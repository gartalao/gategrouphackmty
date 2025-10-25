export interface CameraConfig {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

export interface CameraCallbacks {
  onFrame?: (imageData: string) => void;
  onError?: (error: Error) => void;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private config: CameraConfig;
  private callbacks: CameraCallbacks;
  private isCapturing = false;

  constructor(config: CameraConfig = {}, callbacks: CameraCallbacks = {}) {
    this.config = {
      width: 1280,
      height: 720,
      facingMode: 'environment',
      frameRate: 30,
      ...config,
    };
    this.callbacks = callbacks;
  }

  /**
   * Inicializa la cámara
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    if (!videoElement) {
      throw new Error('Video element is required');
    }

    this.videoElement = videoElement;
    
    // Crear canvas para captura de frames
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Could not get canvas context');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          facingMode: this.config.facingMode,
          frameRate: this.config.frameRate,
        },
        audio: false,
      });

      if (!this.videoElement) {
        throw new Error('Video element is null');
      }

      this.videoElement.srcObject = this.stream;
      
      return new Promise((resolve) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play();
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Inicia la captura de frames
   */
  startCapture(intervalMs: number = 1000): void {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    this.captureLoop(intervalMs);
  }

  /**
   * Detiene la captura de frames
   */
  stopCapture(): void {
    this.isCapturing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Loop principal de captura
   */
  private captureLoop(intervalMs: number): void {
    if (!this.isCapturing) return;

    const captureFrame = () => {
      if (!this.videoElement || !this.canvas || !this.ctx) return;

      // Configurar canvas con las dimensiones del video
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      // Dibujar frame actual del video en el canvas
      this.ctx.drawImage(this.videoElement, 0, 0);

      // Convertir a base64
      const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
      this.callbacks.onFrame?.(imageData);

      // Programar siguiente captura
      setTimeout(() => {
        if (this.isCapturing) {
          this.animationFrameId = requestAnimationFrame(captureFrame);
        }
      }, intervalMs);
    };

    this.animationFrameId = requestAnimationFrame(captureFrame);
  }

  /**
   * Captura un frame específico
   */
  captureFrame(): string | null {
    if (!this.videoElement || !this.canvas || !this.ctx) return null;

    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    this.ctx.drawImage(this.videoElement, 0, 0);

    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Obtiene información de la cámara
   */
  getCameraInfo(): { width: number; height: number; frameRate: number } | null {
    if (!this.videoElement) return null;

    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      frameRate: this.config.frameRate || 30,
    };
  }

  /**
   * Libera recursos
   */
  dispose(): void {
    this.stopCapture();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Verifica si la cámara está disponible
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  /**
   * Obtiene permisos de cámara
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
}
