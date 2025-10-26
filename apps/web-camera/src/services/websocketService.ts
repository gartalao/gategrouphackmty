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
      const fullUrl = `${baseUrl}/ws`;
      
      console.log('[WebSocket] 🔌 Iniciando conexión...');
      console.log('[WebSocket] 📍 URL base:', baseUrl);
      console.log('[WebSocket] 📍 URL completa:', fullUrl);
      console.log('[WebSocket] 🔑 Auth:', this.config.token ? 'Con token' : 'Sin token');
      
      this.socket = io(fullUrl, {
        auth: this.config.token ? { token: this.config.token } : {},
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      console.log('[WebSocket] 🎯 Socket.IO creado, esperando conexión...');

      // Limpiar listeners previos si existen para evitar acumulación
      this.socket.removeAllListeners('connect');
      this.socket.removeAllListeners('disconnect');
      this.socket.removeAllListeners('connect_error');
      this.socket.removeAllListeners('product_detected');

      this.socket.on('connect', () => {
        console.log('[WebSocket] ✅ CONECTADO exitosamente a', fullUrl);
        console.log('[WebSocket] 🆔 Socket ID:', this.socket?.id);
        console.log('[WebSocket] 🚀 Transporte:', this.socket?.io?.engine?.transport?.name);
        this.isConnected = true;
        this.config.onConnect?.();
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] ❌ DESCONECTADO:', reason);
        this.isConnected = false;
        this.config.onDisconnect?.();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] ❌ ERROR DE CONEXIÓN:', error);
        console.error('[WebSocket] 📝 Mensaje:', error.message);
        this.config.onError?.(error);
        reject(error);
      });

      // Escuchar evento product_detected del backend (UN SOLO LISTENER)
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
      console.log('[WebSocket] 🧹 Limpiando listeners y desconectando...');
      // Limpiar todos los listeners antes de desconectar
      this.socket.removeAllListeners('connect');
      this.socket.removeAllListeners('disconnect');
      this.socket.removeAllListeners('connect_error');
      this.socket.removeAllListeners('product_detected');
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[WebSocket] ✅ Desconexión completa');
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
      console.warn('[WebSocket] ⚠️ No conectado, no se puede enviar frame', {
        socket: !!this.socket,
        isConnected: this.isConnected
      });
      return;
    }

    console.log('[WebSocket] 📤 Enviando frame al backend:', {
      scanId: params.scanId,
      frameId: params.frameId,
      base64Length: params.jpegBase64.length,
      timestamp: params.ts
    });

    // Enviar sin esperar respuesta (fire and forget)
    this.socket.emit('frame', params);
    
    console.log('[WebSocket] ✅ Frame emitido exitosamente');
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
