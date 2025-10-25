import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  token: string;
}

export interface ProductDetectedEvent {
  event: 'product_detected';
  trolley_id: number;
  product_id: number;
  product_name: string;
  detected_at: string;
  operator_id: number;
  confidence: number;
}

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onProductDetected?: (event: ProductDetectedEvent) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private callbacks: WebSocketCallbacks;
  private isConnected = false;

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Conecta al WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.url, {
        auth: {
          token: this.config.token,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected');
        this.isConnected = true;
        this.callbacks.onConnect?.();
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
        this.isConnected = false;
        this.callbacks.onDisconnect?.();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error);
        this.callbacks.onError?.(error);
        reject(error);
      });

      this.socket.on('product_detected', (event: ProductDetectedEvent) => {
        console.log('[WebSocket] Product detected:', event);
        this.callbacks.onProductDetected?.(event);
      });
    });
  }

  /**
   * Desconecta del WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Inicia un nuevo scan
   */
  async startScan(params: { trolleyId: number; operatorId: number }): Promise<{ scanId: number; status: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('start_scan', params, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Envía un frame de video
   */
  sendFrame(params: { scanId: number; frameId: string; jpegBase64: string }): void {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not connected, cannot send frame');
      return;
    }

    this.socket.emit('frame', params);
  }

  /**
   * Finaliza un scan
   */
  async endScan(params: { scanId: number }): Promise<{ status: string; endedAt: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('end_scan', params, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Obtiene el estado de conexión
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}
