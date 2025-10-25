import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Pause, Square, Package, Wifi, WifiOff } from 'lucide-react';

interface DemoDetection {
  id: string;
  product_name: string;
  detected_at: string;
  confidence: number;
}

export const DemoMode: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [framesSent, setFramesSent] = useState(0);
  const [detections, setDetections] = useState<DemoDetection[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Productos de ejemplo para la demo
  const demoProducts = [
    'Coca Cola 330ml',
    'Sandwich Club',
    'Agua Mineral',
    'Café Americano',
    'Galletas Oreo',
    'Jugo de Naranja',
    'Ensalada César',
    'Pan Integral'
  ];

  useEffect(() => {
    initializeCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'environment' },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.log('Cámara no disponible, usando modo demo sin cámara');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    
    // Simular envío de frames
    const interval = setInterval(() => {
      if (isRecording && !isPaused) {
        setFramesSent(prev => prev + 1);
        
        // Simular detección aleatoria cada 3-5 segundos
        if (Math.random() < 0.3) {
          const randomProduct = demoProducts[Math.floor(Math.random() * demoProducts.length)];
          const newDetection: DemoDetection = {
            id: `demo_${Date.now()}`,
            product_name: randomProduct,
            detected_at: new Date().toISOString(),
            confidence: 0.85 + Math.random() * 0.1
          };
          
          setDetections(prev => [newDetection, ...prev].slice(0, 10));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🎥 Demo Mode - Smart Trolley</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
              <span>Trolley #123</span>
              <span>•</span>
              <span>Operador Demo</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Demo Mode</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden h-96 lg:h-[500px]">
              {videoRef.current ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Cámara no disponible</p>
                    <p className="text-sm text-gray-400">Modo demo activo</p>
                  </div>
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="flex items-center space-x-2 bg-black/70 px-3 py-2 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-white text-sm font-medium">
                    {isConnected ? 'Demo Mode' : 'Desconectado'}
                  </span>
                </div>

                <div className="bg-black/70 px-3 py-2 rounded-lg text-white text-sm">
                  Frames: {framesSent}
                </div>
              </div>

              {/* Recording Indicator */}
              {isRecording && !isPaused && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="font-medium">Demo Grabando...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Estado del Sistema</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/20">
                  <div className="w-4 h-4 text-green-500">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-green-500">Demo Mode</div>
                    <div className="text-xs text-gray-400">Simulación activa</div>
                  </div>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg ${isRecording && !isPaused ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
                  <div className={`w-4 h-4 ${isRecording && !isPaused ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`font-medium ${isRecording && !isPaused ? 'text-red-500' : 'text-gray-500'}`}>
                      {isRecording ? (isPaused ? 'Pausado' : 'Grabando') : 'Detenido'}
                    </div>
                    <div className="text-xs text-gray-400">Captura de video</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{framesSent}</div>
                    <div className="text-xs text-gray-400">Frames Enviados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{detections.length}</div>
                    <div className="text-xs text-gray-400">Detecciones</div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex space-x-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>Iniciar Demo</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={togglePause}
                        className="flex-1 flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
                      </button>
                      <button
                        onClick={stopRecording}
                        className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        <Square className="w-4 h-4" />
                        <span>Detener</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detection Feed */}
        <div className="mt-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">
                  Productos Detectados (Demo)
                </h3>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {detections.length}
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {detections.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Inicia la demo para ver detecciones simuladas</p>
                  <p className="text-sm">Los productos aparecerán automáticamente</p>
                </div>
              ) : (
                detections.map((detection) => (
                  <div
                    key={detection.id}
                    className="bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">
                          {detection.product_name}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(detection.detected_at).toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-green-500">
                              {Math.round(detection.confidence * 100)}% - Alta
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Demo Info */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-2 text-blue-300">
                <div className="w-4 h-4 mt-0.5">ℹ️</div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Modo Demo Activo</p>
                  <p className="text-xs">
                    Esta es una simulación. Los productos se detectan automáticamente para demostrar la funcionalidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
