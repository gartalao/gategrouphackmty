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
      console.log('[LiveRecording] 🚀 Inicializando streaming directo...');
      
      // Configurar Gemini directo
      if (!GEMINI_API_KEY) {
        console.log('[LiveRecording] ⚠️ Sin API key de Gemini, modo demo');
        setIsConnected(true);
        setScanId(12345);
        setGeminiStatus('idle');
        setBackendStatus('disconnected');
        return;
      }

      console.log('[LiveRecording] 🤖 Configurando Gemini directo...');
      geminiServiceRef.current = new GeminiLiveService({
        apiKey: GEMINI_API_KEY,
        model: 'gemini-1.5-flash',
      });
      
      setIsConnected(true);
      setScanId(12345);
      setGeminiStatus('idle');
      setBackendStatus('disconnected');
      console.log('[LiveRecording] ✅ Streaming directo configurado');
      
    } catch (error) {
      console.error('[LiveRecording] ❌ Error inicializando:', error);
      setError(`Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

      // STREAMING DIRECTO: Cámara → Gemini
      if (geminiServiceRef.current) {
        try {
          setGeminiStatus('analyzing');
          console.log(`[LiveRecording] 🤖 Gemini analizando frame ${frameCounterRef.current}...`);
          
          const base64Data = imageData.split(',')[1];
          
          // Catálogo de productos de ejemplo
          const productCatalog = [
            { productId: 1, name: 'Coca Cola 330ml', visualDescription: 'Lata roja de Coca Cola', detectionKeywords: ['coca', 'cola', 'lata', 'roja'] },
            { productId: 2, name: 'Sandwich Club', visualDescription: 'Sandwich triangular con lechuga', detectionKeywords: ['sandwich', 'club', 'lechuga', 'triangular'] },
            { productId: 3, name: 'Agua Mineral', visualDescription: 'Botella de agua transparente', detectionKeywords: ['agua', 'botella', 'transparente'] },
            { productId: 4, name: 'Café Americano', visualDescription: 'Taza de café negro', detectionKeywords: ['cafe', 'americano', 'taza', 'negro'] },
            { productId: 5, name: 'Galletas Oreo', visualDescription: 'Galletas redondas negras y blancas', detectionKeywords: ['oreo', 'galletas', 'negro', 'blanco'] }
          ];

          const result = await geminiServiceRef.current.analyzeFrame(
            base64Data,
            productCatalog,
            { threshold: 0.7 }
          );

          if (result.detected && result.product_name) {
            setGeminiStatus('success');
            const newDetection: Detection = {
              id: `gemini_${Date.now()}`,
              product_name: result.product_name,
              detected_at: new Date().toISOString(),
              confidence: result.confidence || 0.85,
            };

            setDetections((prev) => [newDetection, ...prev].slice(0, 20));
            console.log(`[LiveRecording] ✅ Producto detectado: ${result.product_name} (${Math.round((result.confidence || 0.85) * 100)}%)`);
          } else {
            setGeminiStatus('idle');
            console.log(`[LiveRecording] 🔍 No se detectaron productos en frame ${frameCounterRef.current}`);
          }
        } catch (geminiError) {
          setGeminiStatus('error');
          console.log('[LiveRecording] ❌ Error en análisis Gemini:', geminiError);
        }
      } else {
        console.log(`[LiveRecording] ⚠️ Gemini no configurado, modo demo`);
        setGeminiStatus('idle');
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
