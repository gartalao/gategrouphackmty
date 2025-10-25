import React, { useState, useEffect, useRef } from 'react';
import { CameraView } from '../components/CameraView';
import { DetectionFeed, Detection } from '../components/DetectionFeed';
import { StatusPanel } from '../components/StatusPanel';
import { SystemStatus } from '../components/SystemStatus';
import { GeminiLiveService } from '../services/geminiLiveService';
import { WebSocketService, ProductDetectedEvent } from '../services/websocketService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LiveRecordingProps {
  trolleyId: number;
  operatorId: number;
  operatorName: string;
  onEndSession: () => void;
}

export const LiveRecording: React.FC<LiveRecordingProps> = ({
  trolleyId,
  operatorId,
  operatorName,
  onEndSession,
}) => {
  // Estados principales
  const [scanId, setScanId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [framesSent, setFramesSent] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastFrameTime, setLastFrameTime] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [backendStatus, setBackendStatus] = useState<'disconnected' | 'connected' | 'sending'>('disconnected');

  // Referencias a servicios
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const scanIdRef = useRef<number | null>(null);
  const frameCounterRef = useRef(0);

  // Configuración
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  useEffect(() => {
    initializeSession();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      console.log('[LiveRecording] 🚀 Conectando al backend vía WebSocket...');
      
      // Conectar a WebSocket del backend (server-side processing)
      const wsService = new WebSocketService({
        url: WS_URL,
        onConnect: () => {
          console.log('[LiveRecording] ✅ WebSocket conectado');
          setBackendStatus('connected');
        },
        onDisconnect: () => {
          console.log('[LiveRecording] ❌ WebSocket desconectado');
          setBackendStatus('disconnected');
        },
        onProductDetected: handleProductDetected,
      });

      await wsService.connect();
      wsServiceRef.current = wsService;

      // Iniciar sesión de scan en el backend
      console.log('[LiveRecording] 🎬 Iniciando sesión de scan...');
      const response = await wsService.startScan({
        trolleyId: trolleyId || 1,
        operatorId: operatorId || 1,
      });

      scanIdRef.current = response.scanId;
      setScanId(response.scanId);
      setIsConnected(true);
      setGeminiStatus('idle');

      console.log(`[LiveRecording] ✅ Sesión iniciada. Scan ID: ${response.scanId}`);
      console.log('[LiveRecording] 📡 Backend procesará frames con Gemini server-side');
      
    } catch (error) {
      console.error('[LiveRecording] ❌ Error inicializando:', error);
      setError(`Error al conectar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setBackendStatus('error');
    }
  };

  const handleProductDetected = (event: ProductDetectedEvent) => {
    const newDetection: Detection = {
      id: `${event.product_id}_${Date.now()}`,
      product_name: event.product_name,
      detected_at: event.detected_at,
      confidence: event.confidence,
      product_id: event.product_id,
    };

    setDetections((prev) => [newDetection, ...prev].slice(0, 20)); // Keep last 20
    setGeminiStatus('success');
    
    console.log(`[LiveRecording] ✅ Producto detectado: ${event.product_name} (${Math.round(event.confidence * 100)}%)`);
  };

  const handleFrameCapture = async (imageData: string) => {
    if (!isRecording || isPaused) return;

    try {
      frameCounterRef.current++;
      const frameId = `frame_${frameCounterRef.current}_${Date.now()}`;
      const currentTime = new Date().toLocaleTimeString();

      setFramesSent((prev) => prev + 1);
      setLastFrameTime(currentTime);

      console.log(`[LiveRecording] 📸 Frame ${frameCounterRef.current} capturado a las ${currentTime}`);

      // ENVIAR AL BACKEND VÍA WEBSOCKET (server-side processing)
      if (wsServiceRef.current && scanIdRef.current) {
        try {
          setGeminiStatus('analyzing');
          
          const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          
          // Enviar frame al backend vía WebSocket
          wsServiceRef.current.sendFrame({
            scanId: scanIdRef.current,
            frameId,
            jpegBase64: base64Data,
            ts: Date.now(),
          });

          console.log(`[LiveRecording] 📡 Frame ${frameCounterRef.current} enviado al backend vía WebSocket`);
          setGeminiStatus('idle');
        } catch (error) {
          setGeminiStatus('error');
          console.error('[LiveRecording] ❌ Error enviando frame:', error);
        }
      } else {
        console.log(`[LiveRecording] ⚠️ WebSocket no conectado o scanId no disponible`);
      }
    } catch (error) {
      console.error('[LiveRecording] ❌ Error processing frame:', error);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = async () => {
    if (!wsServiceRef.current || !scanId) return;

    try {
      setIsRecording(false);
      setIsPaused(false);

      // Finalizar scan
      await wsServiceRef.current.endScan({ scanId });

      // Mostrar confirmación
      const confirmed = window.confirm(
        '¿Estás seguro de que quieres finalizar la sesión? Esto detendrá la grabación.'
      );

      if (confirmed) {
        onEndSession();
      } else {
        // Reanudar si canceló
        setIsRecording(true);
      }
    } catch (error) {
      console.error('[LiveRecording] Error ending session:', error);
      setError(`Error al finalizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const cleanup = () => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🎥 Grabación en Vivo</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
              <span>Trolley #{trolleyId}</span>
              <span>•</span>
              <span>{operatorName}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera View - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <CameraView
              onFrame={handleFrameCapture}
              onError={(error) => setError(error.message)}
              className="h-96 lg:h-[500px]"
            />
          </div>

          {/* Status Panel - 1/3 width on large screens */}
          <div className="lg:col-span-1">
            <SystemStatus
              isConnected={isConnected}
              framesSent={framesSent}
              lastFrameTime={lastFrameTime}
              geminiStatus={geminiStatus}
              backendStatus={backendStatus}
              detectionsCount={detections.length}
              className="mb-6"
            />
            
            <StatusPanel
              isConnected={isConnected}
              isRecording={isRecording}
              isPaused={isPaused}
              framesSent={framesSent}
              queueSize={queueSize}
              onStartRecording={handleStartRecording}
              onPauseRecording={handlePauseRecording}
              onStopRecording={handleStopRecording}
              className="mb-6"
            />
          </div>
        </div>

        {/* Detection Feed */}
        <div className="mt-6">
          <DetectionFeed detections={detections} />
        </div>
      </div>
    </div>
  );
};
