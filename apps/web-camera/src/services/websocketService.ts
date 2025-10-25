import { io, Socket } from 'socket.io-client';

export interface ProductDetectedEvent {
  event: 'product_detected';
  trolley_id: number;
  product_id: number;
  product_name: string;
  detected_at: string;
  operator_id: number;
  confidence: number;
  box_2d?: number[];
}

export interface WebSocketConfig {
  url: string;
  token?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onProductDetected?: (event: ProductDetectedEvent) => void;
}

export interface StartScanParams {
  trolleyId: number;
  operatorId: number;
}

export interface FrameParams {
  scanId: number;
  frameId: string;
  jpegBase64: string;
  ts: number;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private isConnected = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  /**
   * Conecta al WebSocket del backend
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Extraer solo la URL base (sin /ws al final si existe)
      const baseUrl = this.config.url.replace(/\/ws$/i, '');
      
      this.socket = io(`${baseUrl}/ws`, {
        auth: this.config.token ? { token: this.config.token } : {},
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] ✅ Conectado a', baseUrl);
        this.isConnected = true;
        this.config.onConnect?.();
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] ❌ Desconectado:', reason);
        this.isConnected = false;
        this.config.onDisconnect?.();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] ❌ Error de conexión:', error);
        this.config.onError?.(error);
        reject(error);
      });

      // Escuchar evento product_detected del backend
      this.socket.on('product_detected', (event: ProductDetectedEvent) => {
        console.log('[WebSocket] 🎯 Producto detectado:', event.product_name);
        this.config.onProductDetected?.(event);
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
   * Inicia un nuevo scan (sesión de grabación)
   */
  async startScan(params: StartScanParams): Promise<{ scanId: number; status: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('[WebSocket] 📡 Enviando start_scan:', params);

      this.socket.emit('start_scan', params, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          console.log('[WebSocket] ✅ Scan iniciado:', response);
          resolve(response);
        }
      });
    });
  }

  /**
   * Envía un frame de video al backend para procesamiento
   */
  sendFrame(params: FrameParams): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[WebSocket] ⚠️ No conectado, no se puede enviar frame');
      return;
    }

    // Enviar sin esperar respuesta (fire and forget)
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
