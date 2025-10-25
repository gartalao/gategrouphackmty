import { Camera } from 'expo-camera';
import WebSocketClient, { FramePayload } from './websocketClient';

const VIDEO_FRAME_SEND_FPS = parseInt(process.env.EXPO_PUBLIC_VIDEO_FRAME_SEND_FPS || '2', 10);
const FRAME_INTERVAL_MS = 1000 / VIDEO_FRAME_SEND_FPS;

interface VideoStreamerConfig {
  scanId: number;
  cameraRef: React.RefObject<Camera>;
  wsClient: WebSocketClient;
  onFrameSent?: (frameId: string) => void;
  onError?: (error: Error) => void;
}

class VideoStreamer {
  private scanId: number;
  private cameraRef: React.RefObject<Camera>;
  private wsClient: WebSocketClient;
  private config: VideoStreamerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private frameCounter = 0;
  private isRunning = false;

  constructor(config: VideoStreamerConfig) {
    this.scanId = config.scanId;
    this.cameraRef = config.cameraRef;
    this.wsClient = config.wsClient;
    this.config = config;
  }

  start(): void {
    if (this.isRunning) {
      console.warn('[VideoStreamer] Already running');
      return;
    }

    this.isRunning = true;
    this.frameCounter = 0;

    console.log(`[VideoStreamer] Starting at ${VIDEO_FRAME_SEND_FPS} fps`);

    this.intervalId = setInterval(() => {
      this.captureAndSendFrame();
    }, FRAME_INTERVAL_MS);
  }

  private async captureAndSendFrame(): Promise<void> {
    if (!this.cameraRef.current) {
      console.warn('[VideoStreamer] Camera ref not available');
      return;
    }

    try {
      // Capture frame as JPEG with base64
      const photo = await this.cameraRef.current.takePictureAsync({
        quality: 0.5, // Reduce quality for faster transmission
        base64: true,
        skipProcessing: true,
      });

      if (!photo.base64) {
        console.warn('[VideoStreamer] No base64 data in photo');
        return;
      }

      this.frameCounter++;
      const frameId = `frame_${this.scanId}_${this.frameCounter}_${Date.now()}`;

      const framePayload: FramePayload = {
        scanId: this.scanId,
        frameId,
        jpegBase64: photo.base64,
        ts: Date.now(),
      };

      // Send via WebSocket
      this.wsClient.sendFrame(framePayload);

      this.config.onFrameSent?.(frameId);

      console.log(`[VideoStreamer] Frame sent: ${frameId} (${this.frameCounter} total)`);
    } catch (error) {
      console.error('[VideoStreamer] Error capturing frame:', error);
      this.config.onError?.(error as Error);
    }
  }

  pause(): void {
    if (!this.isRunning) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('[VideoStreamer] Paused');
  }

  resume(): void {
    if (this.isRunning) return;
    this.start();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.frameCounter = 0;
    console.log('[VideoStreamer] Stopped');
  }

  getStats(): { isRunning: boolean; framesSent: number; fps: number } {
    return {
      isRunning: this.isRunning,
      framesSent: this.frameCounter,
      fps: VIDEO_FRAME_SEND_FPS,
    };
  }
}

export default VideoStreamer;

