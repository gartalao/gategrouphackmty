import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Ajv from 'ajv';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { GeminiDetectionResult, DetectedItem } from './types';
import { GEMINI_BATCH_PROMPT } from './prompt';
import { applyNMS } from './postprocess';

const ajv = new Ajv();

// JSON Schema for Gemini response validation
const geminiResponseSchema = {
  type: 'object',
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label', 'box_2d', 'confidence'],
        properties: {
          label: {
            type: 'string',
          },
          box_2d: {
            type: 'array',
            items: { type: 'number' },
            minItems: 4,
            maxItems: 4,
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
          },
          brand: {
            type: 'string',
          },
          color: {
            type: 'string',
          },
        },
      },
    },
  },
};

const validate = ajv.compile(geminiResponseSchema);

export class GeminiDetector {
  private genAI: GoogleGenerativeAI;
  private modelId: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelId = env.GEMINI_MODEL_ID;
    logger.info({ modelId: this.modelId }, 'Gemini detector initialized');
  }

  /**
   * Detect objects in a single frame (batch mode)
   */
  async detectFrame(
    imagePath: string,
    thinkingBudget: number = 0
  ): Promise<GeminiDetectionResult> {
    const startTime = Date.now();

    try {
      // Read image and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      // Get the generative model
      const model = this.genAI.getGenerativeModel({
        model: this.modelId,
      });

      // Prepare the request
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: GEMINI_BATCH_PROMPT,
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
          temperature: 0.1,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      // Parse JSON
      let parsed: GeminiDetectionResult;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        logger.error({ text, error }, 'Failed to parse Gemini JSON response');
        throw new Error('Invalid JSON from Gemini');
      }

      // Validate schema
      const valid = validate(parsed);
      if (!valid) {
        logger.error({ errors: validate.errors }, 'Gemini schema validation failed');
        throw new Error('Invalid schema from Gemini');
      }

      // Apply NMS to remove duplicates
      const items = applyNMS(parsed.items, 0.5);

      const duration = Date.now() - startTime;

      logger.info(
        {
          duration,
          itemsCount: items.length,
          thinkingBudget,
          model: this.modelId,
        },
        'Gemini detection completed'
      );

      return {
        items,
        metadata: {
          frame_time_ms: duration,
          thinking_budget: thinkingBudget,
          model: this.modelId,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        {
          error: (error as Error).message,
          duration,
          imagePath,
        },
        'Gemini detection failed'
      );
      throw error;
    }
  }

  /**
   * Detect with retries and exponential backoff
   */
  async detectFrameWithRetry(
    imagePath: string,
    maxRetries: number = 3
  ): Promise<GeminiDetectionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Increase thinking budget on retries for better quality
        const thinkingBudget = attempt === 1 ? 0 : Math.min(attempt, 4);
        return await this.detectFrame(imagePath, thinkingBudget);
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          { attempt, maxRetries, error: lastError.message },
          'Gemini detection attempt failed'
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Gemini detection failed after all retries');
  }
}

// Singleton instance
let detectorInstance: GeminiDetector | null = null;

export function getGeminiDetector(): GeminiDetector {
  if (!detectorInstance) {
    detectorInstance = new GeminiDetector();
  }
  return detectorInstance;
}

