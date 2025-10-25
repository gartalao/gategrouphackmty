import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { CameraService } from '../services/cameraService';

interface CameraViewProps {
  onFrame?: (imageData: string) => void;
  onError?: (error: Error) => void;
  isStreaming?: boolean; // Control externo de streaming
  className?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onFrame,
  onError,
  isStreaming = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraServiceRef = useRef<CameraService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraInfo, setCameraInfo] = useState<{ width: number; height: number; frameRate: number } | null>(null);

  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (cameraServiceRef.current) {
        cameraServiceRef.current.dispose();
      }
    };
  }, []);

  // Auto-iniciar/detener streaming según prop
  useEffect(() => {
    if (isStreaming && isInitialized && !isCapturing) {
      startCapture();
    } else if (!isStreaming && isCapturing) {
      stopCapture();
    }
  }, [isStreaming, isInitialized]);

  const initializeCamera = async () => {
    if (!videoRef.current) return;

    try {
      // Verificar disponibilidad de cámara
      const isAvailable = await CameraService.isCameraAvailable();
      if (!isAvailable) {
        throw new Error('Cámara no disponible en este dispositivo');
      }

      // Solicitar permisos
      const hasPermission = await CameraService.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Permisos de cámara denegados');
      }

      // Inicializar servicio de cámara
      cameraServiceRef.current = new CameraService(
        {
          width: 1280,
          height: 720,
          facingMode: 'environment',
          frameRate: 30,
        },
        {
          onFrame: (imageData) => {
            onFrame?.(imageData);
          },
          onError: (error) => {
            setError(error.message);
            onError?.(error);
          },
        }
      );

      await cameraServiceRef.current.initialize(videoRef.current);
      setIsInitialized(true);
      setError(null);

      // Obtener información de la cámara
      const info = cameraServiceRef.current.getCameraInfo();
      setCameraInfo(info);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      onError?.(err as Error);
    }
  };

  const startCapture = () => {
    if (cameraServiceRef.current && isInitialized) {
      // Captura optimizada para Rate Limit de Gemini (10 RPM = 1 cada 6 segundos)
      // Usamos 7 segundos para tener margen de seguridad
      cameraServiceRef.current.startCapture(7000); // ~8.5 frames/min (bajo el límite de 10 RPM)
      setIsCapturing(true);
      console.log('[CameraView] 🎬 Streaming iniciado - 1 frame cada 7 segundos (Rate Limit optimizado)');
    }
  };

  const stopCapture = () => {
    if (cameraServiceRef.current) {
      cameraServiceRef.current.stopCapture();
      setIsCapturing(false);
    }
  };

  const captureFrame = () => {
    if (cameraServiceRef.current) {
      const frame = cameraServiceRef.current.captureFrame();
      if (frame) {
        onFrame?.(frame);
      }
    }
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-900 text-white p-8 rounded-lg ${className}`}>
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error de Cámara</h3>
        <p className="text-gray-300 text-center mb-4">{error}</p>
        <button
          onClick={initializeCamera}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Overlay de Estado */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Estado de Conexión */}
        <div className="flex items-center space-x-2 bg-black/70 px-3 py-2 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white text-sm font-medium">
            {isInitialized ? 'Cámara Activa' : 'Inicializando...'}
          </span>
        </div>

        {/* Información de la Cámara */}
        {cameraInfo && (
          <div className="bg-black/70 px-3 py-2 rounded-lg text-white text-sm">
            {cameraInfo.width}×{cameraInfo.height} @ {cameraInfo.frameRate}fps
          </div>
        )}
      </div>

      {/* Solo mostrar estado, sin controles manuales */}
      {/* El streaming se controla desde LiveRecording con props */}

      {/* Indicador de Captura */}
      {isCapturing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-medium">Grabando...</span>
          </div>
        </div>
      )}
    </div>
  );
};
