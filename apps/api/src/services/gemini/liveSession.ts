import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { GeminiDetectionResult, TrackedObject } from './types';
import { ObjectTracker, applyNMS, isWithinROI } from './postprocess';
import { buildStreamPrompt } from './prompt';
import { ROIConfig } from './types';

/**
 * Live streaming session for real-time object detection
 * Uses Gemini Live API (WebSocket-based) for low-latency detection
 */
export class GeminiLiveSession {
  private genAI: GoogleGenerativeAI;
  private modelId: string;
  private tracker: ObjectTracker;
  private roiConfig: ROIConfig[];
  private isActive: boolean = false;
  private frameCount: number = 0;
  private thinkingBudget: number;

  constructor(roiConfig: ROIConfig[] = [], thinkingBudget: number = 0) {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelId = env.GEMINI_MODEL_ID;
    this.tracker = new ObjectTracker();
    this.roiConfig = roiConfig;
    this.thinkingBudget = thinkingBudget;
    logger.info({ modelId: this.modelId, thinkingBudget }, 'Live session initialized');
  }

  /**
   * Process a single frame in streaming mode
   * For MVP, we use batch mode with fast thinking_budget
   * Future: migrate to actual Live API WebSocket
   */
  async processFrame(
    imageBase64: string,
    shelfId: number,
    timestamp: number = Date.now()
  ): Promise<{
    detections: GeminiDetectionResult;
    tracked: TrackedObject[];
    newEntries: TrackedObject[];
  }> {
    const startTime = Date.now();
    this.frameCount++;

    try {
      // Get the generative model
      const model = this.genAI.getGenerativeModel({
        model: this.modelId,
      });

      // Generate content with streaming-optimized config
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildStreamPrompt(this.thinkingBudget),
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.0,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      const parsed: GeminiDetectionResult = JSON.parse(text);

      // Apply NMS
      let items = applyNMS(parsed.items, 0.5);

      // Filter by ROI if configured for this shelf
      const roiForShelf = this.roiConfig.find((r) => r.shelfId === shelfId);
      if (roiForShelf) {
        items = items.filter((item) => isWithinROI(item.box_2d, roiForShelf.roi));
        logger.debug(
          { shelfId, beforeROI: parsed.items.length, afterROI: items.length },
          'ROI filtering applied'
        );
      }

      // Track objects
      const tracked = this.tracker.track(items, timestamp);

      // Get newly entered objects
      const newEntries = this.tracker.getNewEntries();

      const duration = Date.now() - startTime;

      logger.info(
        {
          frameCount: this.frameCount,
          duration,
          detections: items.length,
          tracked: tracked.length,
          newEntries: newEntries.length,
          shelfId,
        },
        'Frame processed'
      );

      return {
        detections: {
          items,
          metadata: {
            frame_time_ms: duration,
            thinking_budget: this.thinkingBudget,
            model: this.modelId,
          },
        },
        tracked,
        newEntries,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        {
          error: (error as Error).message,
          duration,
          frameCount: this.frameCount,
          shelfId,
        },
        'Frame processing failed'
      );
      throw error;
    }
  }

  /**
   * Start the live session
   */
  start(): void {
    this.isActive = true;
    this.frameCount = 0;
    this.tracker.reset();
    logger.info('Live session started');
  }

  /**
   * Stop the live session
   */
  stop(): void {
    this.isActive = false;
    logger.info({ totalFrames: this.frameCount }, 'Live session stopped');
  }

  /**
   * Check if session is active
   */
  get active(): boolean {
    return this.isActive;
  }

  /**
   * Reset the tracker (useful when trolley is changed)
   */
  resetTracker(): void {
    this.tracker.reset();
    this.frameCount = 0;
    logger.info('Tracker reset');
  }

  /**
   * Update ROI configuration
   */
  updateROI(roiConfig: ROIConfig[]): void {
    this.roiConfig = roiConfig;
    logger.info({ shelvesCount: roiConfig.length }, 'ROI configuration updated');
  }

  /**
   * Update thinking budget (for quality vs speed trade-off)
   */
  setThinkingBudget(budget: number): void {
    this.thinkingBudget = Math.max(0, Math.min(4, budget));
    logger.info({ thinkingBudget: this.thinkingBudget }, 'Thinking budget updated');
  }
}

// Session manager for multiple trolleys
const activeSessions = new Map<number, GeminiLiveSession>();

export function getLiveSession(trolleyId: number, roiConfig: ROIConfig[] = []): GeminiLiveSession {
  let session = activeSessions.get(trolleyId);
  if (!session) {
    session = new GeminiLiveSession(roiConfig);
    activeSessions.set(trolleyId, session);
  }
  return session;
}

export function closeLiveSession(trolleyId: number): void {
  const session = activeSessions.get(trolleyId);
  if (session) {
    session.stop();
    activeSessions.delete(trolleyId);
    logger.info({ trolleyId }, 'Live session closed');
  }
}

export function getAllActiveSessions(): Map<number, GeminiLiveSession> {
  return activeSessions;
}

