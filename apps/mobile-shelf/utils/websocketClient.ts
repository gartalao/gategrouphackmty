import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3001';

interface WebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onProductDetected?: (data: ProductDetectedEvent) => void;
}

export interface ProductDetectedEvent {
  event: 'product_detected';
  trolley_id: number;
  product_id: number;
  product_name: string;
  detected_at: string;
  operator_id: number | null;
  confidence: number;
}

export interface StartScanPayload {
  trolleyId: number;
  operatorId: number;
}

export interface FramePayload {
  scanId: number;
  frameId: string;
  jpegBase64: string;
  ts: number;
}

export interface EndScanPayload {
  scanId: number;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private offlineFrameQueue: FramePayload[] = [];
  private readonly MAX_OFFLINE_QUEUE = 50;

  constructor(config: WebSocketConfig = {}) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // Get JWT token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Connect to WebSocket namespace /ws
      this.socket = io(`${WS_URL}/ws`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupListeners();

      console.log('[WebSocket] Connecting to:', WS_URL);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.config.onError?.(error);
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.config.onConnect?.();

      // Process offline queue
      this.processOfflineQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.config.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempts++;
      this.config.onError?.(error);
    });

    // Listen for product_detected events
    this.socket.on('product_detected', (data: ProductDetectedEvent) => {
      console.log('[WebSocket] Product detected:', data.product_name);
      this.config.onProductDetected?.(data);
    });
  }

  startScan(payload: StartScanPayload): Promise<{ scanId: number; status: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        return reject(new Error('WebSocket not connected'));
      }

      this.socket.emit('start_scan', payload, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  sendFrame(payload: FramePayload): void {
    if (!this.socket?.connected) {
      // Save to offline queue
      this.addToOfflineQueue(payload);
      return;
    }

    this.socket.emit('frame', payload);
  }

  endScan(payload: EndScanPayload): Promise<{ status: string; endedAt: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        return reject(new Error('WebSocket not connected'));
      }

      this.socket.emit('end_scan', payload, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  private addToOfflineQueue(frame: FramePayload): void {
    if (this.offlineFrameQueue.length >= this.MAX_OFFLINE_QUEUE) {
      // Remove oldest frame (FIFO)
      this.offlineFrameQueue.shift();
    }

    this.offlineFrameQueue.push(frame);
    console.log(`[WebSocket] Frame queued offline. Queue size: ${this.offlineFrameQueue.length}`);
  }

  private processOfflineQueue(): void {
    if (this.offlineFrameQueue.length === 0) return;

    console.log(`[WebSocket] Processing ${this.offlineFrameQueue.length} offline frames`);

    while (this.offlineFrameQueue.length > 0) {
      const frame = this.offlineFrameQueue.shift();
      if (frame) {
        this.sendFrame(frame);
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getQueueSize(): number {
    return this.offlineFrameQueue.length;
  }
}

export default WebSocketClient;

