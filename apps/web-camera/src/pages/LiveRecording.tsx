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
  
  // Estados para sistema de ventas
  const [scanType, setScanType] = useState<'load' | 'return'>('load');
  const [originalScanId, setOriginalScanId] = useState<number | null>(null);
  const [loadedProductsMap, setLoadedProductsMap] = useState<Map<number, string>>(new Map()); // ID -> nombre
  const [returnedProducts, setReturnedProducts] = useState<Set<number>>(new Set()); // IDs de productos retornados

  // Referencias a servicios
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const scanIdRef = useRef<number | null>(null);
  const frameCounterRef = useRef(0);
  const isRecordingRef = useRef(false); // Ref inmediata para evitar delays de React state
  const scanTypeRef = useRef<'load' | 'return'>('load'); // Ref inmediata para tipo de scan
  const detectedProductIdsRef = useRef<Set<number>>(new Set()); // Productos ya detectados en esta sesión

  // Configuración
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  useEffect(() => {
    // NO auto-iniciar, esperar a que usuario haga clic en "Iniciar"
    console.log('[LiveRecording] Componente montado. Esperando clic en Iniciar...');
    console.log('[LiveRecording] 📋 Configuración:');
    console.log('[LiveRecording]    - WS_URL:', WS_URL);
    console.log('[LiveRecording]    - VITE_WS_URL:', import.meta.env.VITE_WS_URL);
    console.log('[LiveRecording]    - Todas las env:', import.meta.env);
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeSession = async (type: 'load' | 'return') => {
    try {
      console.log(`[LiveRecording] 🚀 Iniciando sesión (${type})...`);
      console.log('[LiveRecording] 📡 URL WebSocket:', WS_URL);
      
      // Limpiar sesión anterior si existe
      if (wsServiceRef.current) {
        console.log('[LiveRecording] 🧹 Limpiando sesión anterior...');
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
        scanIdRef.current = null;
      }
      
      console.log('[LiveRecording] 🏭 Creando servicio WebSocket...');
      
      // Conectar a WebSocket del backend (server-side processing)
      const wsService = new WebSocketService({
        url: WS_URL,
        onConnect: () => {
          console.log('[LiveRecording] ✅ WebSocket conectado exitosamente');
          setIsConnected(true);
          setBackendStatus('connected');
        },
        onDisconnect: () => {
          console.log('[LiveRecording] ❌ WebSocket desconectado');
          setIsConnected(false);
          setBackendStatus('disconnected');
        },
        onError: (error) => {
          console.error('[LiveRecording] ❌ Error en WebSocket:', error);
          setError(`Error de WebSocket: ${error.message}`);
          setBackendStatus('disconnected');
        },
        onProductDetected: handleProductDetected,
      });

      console.log('[LiveRecording] 🔌 Conectando al WebSocket...');
      await wsService.connect();
      wsServiceRef.current = wsService;
      console.log('[LiveRecording] ✅ Servicio WebSocket guardado en ref');

      // Iniciar sesión de scan en el backend según tipo
      console.log(`[LiveRecording] 🎬 Iniciando sesión de ${type} scan...`);
      
      if (type === 'load') {
        // Scan normal de carga
        const response = await wsService.startScan({
          trolleyId: trolleyId || 1,
          operatorId: operatorId || 1,
        });

        scanIdRef.current = response.scanId;
        setScanId(response.scanId);
        setOriginalScanId(response.scanId); // Guardar para usar en return scan
        
        console.log(`[LiveRecording] ✅ LOAD Scan iniciado. Scan ID: ${response.scanId}`);
      } else {
        // Return scan (productos restantes)
        if (!originalScanId) {
          throw new Error('No hay scan de carga original');
        }

        const response = await wsService.startReturnScan({
          scanId: originalScanId, // ID del scan de carga original
          trolleyId: trolleyId || 1,
          operatorId: operatorId || 1,
        });

        scanIdRef.current = response.returnScanId;
        setScanId(response.returnScanId);
        
        console.log(`[LiveRecording] ✅ RETURN Scan iniciado. Return Scan ID: ${response.returnScanId}`);
      }

      setIsConnected(true);
      setGeminiStatus('idle');

      console.log('[LiveRecording] 📡 Backend procesará frames con Gemini server-side');
      
    } catch (error) {
      console.error('[LiveRecording] ❌ Error inicializando:', error);
      setError(`Error al conectar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setBackendStatus('disconnected');
    }
  };

  const handleProductDetected = (event: ProductDetectedEvent & { scan_type?: string }) => {
    // Verificar si ya fue detectado en esta sesión (deduplicación frontend)
    if (detectedProductIdsRef.current.has(event.product_id)) {
      console.log(`[LiveRecording] ⏭️ ${event.product_name} ya fue detectado en frontend - Ignorando duplicado`);
      return; // No agregar duplicado
    }

    // Marcar como detectado
    detectedProductIdsRef.current.add(event.product_id);

    const scanTypeFromEvent = event.scan_type || scanType;

    // Manejar según tipo de scan
    if (scanTypeFromEvent === 'load') {
      // SCAN DE CARGA: Mostrar productos cargados
      setLoadedProductsMap((prev) => new Map(prev).set(event.product_id, event.product_name));

      const newDetection: Detection = {
        id: `${event.product_id}_${Date.now()}`,
        product_name: `📦 ${event.product_name}`,
        detected_at: event.detected_at,
        confidence: event.confidence,
        product_id: event.product_id,
      };

      setDetections((prev) => [newDetection, ...prev].slice(0, 20));
      console.log(`[LiveRecording] ✅ [CARGA] Producto agregado: ${event.product_name}`);
    } else {
      // SCAN DE RETORNO: Producto retornado (agregar a lista)
      setReturnedProducts((prev) => new Set([...prev, event.product_id]));
      
      const newDetection: Detection = {
        id: `${event.product_id}_${Date.now()}`,
        product_name: `🔄 ${event.product_name} (Retornado)`,
        detected_at: event.detected_at,
        confidence: event.confidence,
        product_id: event.product_id,
      };

      setDetections((prev) => [newDetection, ...prev].slice(0, 20));
      console.log(`[LiveRecording] 🔄 [RETORNO] Producto retornado: ${event.product_name}`);
      
      // CALCULAR Y MOSTRAR PRODUCTOS VENDIDOS inmediatamente
      setTimeout(() => {
        calculateAndShowSoldProducts();
      }, 100);
    }

    setGeminiStatus('success');
  };

  // Calcular productos vendidos en tiempo real
  const calculateAndShowSoldProducts = () => {
    const loadedIds = Array.from(loadedProductsMap.keys());
    const soldProductIds = loadedIds.filter((id) => !returnedProducts.has(id));

    console.log(`[LiveRecording] 💰 Calculando vendidos...`);
    console.log(`[LiveRecording]    Cargados: ${loadedIds.length}`);
    console.log(`[LiveRecording]    Retornados: ${returnedProducts.size}`);
    console.log(`[LiveRecording]    Vendidos: ${soldProductIds.length}`);

    // Agregar detecciones de productos vendidos
    soldProductIds.forEach((productId) => {
      // Solo agregar si no está ya en detections como vendido
      const alreadyShownAsSold = detections.some(
        (d) => d.product_id === productId && d.product_name.includes('VENDIDO')
      );

      if (!alreadyShownAsSold) {
        const productName = loadedProductsMap.get(productId) || `Producto ID ${productId}`;
        
        const soldDetection: Detection = {
          id: `sold_${productId}_${Date.now()}_${Math.random()}`,
          product_name: `✅ ${productName} (VENDIDO)`,
          detected_at: new Date().toISOString(),
          confidence: 1.0,
          product_id: productId,
        };

        setDetections((prev) => [soldDetection, ...prev]);
      }
    });

    console.log(`[LiveRecording] 💰 Productos vendidos mostrados en UI`);
  };

  const handleFrameCapture = async (imageData: string) => {
    console.log('[LiveRecording] 🎯 handleFrameCapture llamado');
    console.log('[LiveRecording] 📊 Estado:', { 
      isRecording, 
      isPaused,
      isRecordingRef: isRecordingRef.current 
    });
    
    // Usar REF en lugar de state para evitar delay de React
    if (!isRecordingRef.current || isPaused) {
      console.log('[LiveRecording] ⏸️ No se procesa frame - isRecordingRef:', isRecordingRef.current, 'isPaused:', isPaused);
      return;
    }

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
          
          console.log(`[LiveRecording] 🔍 Datos del frame:`, {
            frameId,
            scanId: scanIdRef.current,
            base64Length: base64Data.length,
            timestamp: Date.now()
          });
          
          // Enviar frame al backend vía WebSocket
          wsServiceRef.current.sendFrame({
            scanId: scanIdRef.current,
            frameId,
            jpegBase64: base64Data,
            ts: Date.now(),
            scanType: scanTypeRef.current, // Usar REF para evitar delay
          });

          console.log(`[LiveRecording] 📤 Frame enviado con scanType: ${scanTypeRef.current}`);

          console.log(`[LiveRecording] 📡 Frame ${frameCounterRef.current} ENVIADO al backend vía WebSocket`);
          setGeminiStatus('idle');
        } catch (error) {
          setGeminiStatus('error');
          console.error('[LiveRecording] ❌ Error enviando frame:', error);
        }
      } else {
        console.warn(`[LiveRecording] ⚠️ No se puede enviar frame:`, {
          wsService: !!wsServiceRef.current,
          scanId: scanIdRef.current
        });
      }
    } catch (error) {
      console.error('[LiveRecording] ❌ Error processing frame:', error);
    }
  };

  const handleStartRecording = async (type: 'load' | 'return') => {
    try {
      console.log(`[LiveRecording] 🎬 handleStartRecording - INICIO (${type})`);
      
      // Validar que para return scan tengamos un originalScanId
      if (type === 'return' && !originalScanId) {
        setError('Primero debes completar un escaneo de carga del trolley');
        return;
      }
      
      // PRIMERO: Si es return scan, cargar productos del scan original
      if (type === 'return' && originalScanId) {
        console.log('[LiveRecording] 📥 Cargando productos del scan original...');
        try {
          const response = await fetch(`http://localhost:3001/api/scans/${originalScanId}/summary`);
          const data = await response.json();
          
          // Crear Map de productos cargados (ID -> nombre)
          const productsMap = new Map<number, string>();
          data.products.forEach((p: any) => {
            productsMap.set(p.product_id, p.product_name);
          });
          
          setLoadedProductsMap(productsMap);
          
          console.log(`[LiveRecording] ✅ ${productsMap.size} productos únicos cargados del scan original`);
          console.log('[LiveRecording] 📋 Productos:', Array.from(productsMap.values()));
        } catch (err) {
          console.error('[LiveRecording] ⚠️ Error cargando scan original:', err);
        }
      }
      
      // SEGUNDO: Limpiar productos detectados de sesión anterior
      detectedProductIdsRef.current.clear();
      setDetections([]); // Limpiar UI
      setReturnedProducts(new Set()); // Limpiar retornados
      
      // Si es load scan, también limpiar loaded products
      if (type === 'load') {
        setLoadedProductsMap(new Map());
      }
      
      console.log('[LiveRecording] 🧹 Productos detectados limpiados para nueva sesión');
      
      // TERCERO: Establecer tipo de scan (STATE + REF)
      setScanType(type);
      scanTypeRef.current = type; // ← ACTUALIZACIÓN INMEDIATA
      console.log(`[LiveRecording] ✅ scanType actualizado: ${type}`);
      
      // CUARTO: Establecer estado de grabación (ref + state)
      isRecordingRef.current = true; // Actualización INMEDIATA con ref
      setIsRecording(true);
      setIsPaused(false);
      console.log('[LiveRecording] ✅ Estado actualizado: isRecordingRef=true, isRecording=true');
      
      // QUINTO: Crear nueva sesión según tipo
      console.log('[LiveRecording] 🔌 Creando nueva sesión...');
      await initializeSession(type);
      
      console.log(`[LiveRecording] ▶ Streaming AUTOMÁTICO iniciado (${type}) - Gemini analizará cada frame`);
    } catch (error) {
      console.error('[LiveRecording] ❌ Error al iniciar streaming:', error);
      setError(`Error al iniciar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      isRecordingRef.current = false; // Revertir en caso de error
      setIsRecording(false);
    }
  };

  const handlePauseRecording = () => {
    // Ya no se usa, pero mantengo por compatibilidad
    setIsPaused(!isPaused);
  };

  const handleStopRecording = async () => {
    if (!wsServiceRef.current || !scanId) return;

    try {
      isRecordingRef.current = false; // Actualización INMEDIATA con ref
      setIsRecording(false);
      setIsPaused(false);

      // Finalizar scan según tipo
      if (scanType === 'return') {
        await wsServiceRef.current.endReturnScan({ returnScanId: scanId });
        console.log('[LiveRecording] ✅ Return scan finalizado');
        
        // MOSTRAR RESUMEN DE VENTAS AL FINALIZAR
        setTimeout(() => {
          showSalesSummary();
        }, 500);
      } else {
        await wsServiceRef.current.endScan({ scanId });
        console.log('[LiveRecording] ✅ Load scan finalizado');
      }

      // Mensaje de confirmación según tipo
      const message = scanType === 'load'
        ? 'Escaneo de carga finalizado! ¿Deseas salir?'
        : 'Escaneo de retorno finalizado! Ve el análisis de ventas en "Productos Detectados". ¿Deseas salir?';

      const confirmed = window.confirm(message);

      if (confirmed) {
        onEndSession();
      }
    } catch (error) {
      console.error('[LiveRecording] Error ending session:', error);
      setError(`Error al finalizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Mostrar resumen de ventas al finalizar return scan
  const showSalesSummary = () => {
    console.log('[LiveRecording] 📊 Generando resumen de ventas...');
    
    // Limpiar detecciones actuales
    setDetections([]);
    
    const loadedIds = Array.from(loadedProductsMap.keys());
    const returnedIds = Array.from(returnedProducts);
    const soldIds = loadedIds.filter((id) => !returnedProducts.has(id));
    
    console.log(`[LiveRecording] 📊 Resumen:`);
    console.log(`[LiveRecording]    Cargados: ${loadedIds.length} productos`);
    console.log(`[LiveRecording]    Retornados: ${returnedIds.length} productos`);
    console.log(`[LiveRecording]    VENDIDOS: ${soldIds.length} productos`);
    
    // Agregar productos vendidos a la UI
    soldIds.forEach((productId) => {
      const productName = loadedProductsMap.get(productId) || `Producto ID ${productId}`;
      
      const soldDetection: Detection = {
        id: `sold_${productId}_${Date.now()}`,
        product_name: `✅ ${productName} (VENDIDO)`,
        detected_at: new Date().toISOString(),
        confidence: 1.0,
        product_id: productId,
      };
      
      setDetections((prev) => [...prev, soldDetection]);
    });
    
    // Agregar productos retornados a la UI
    returnedIds.forEach((productId) => {
      const productName = loadedProductsMap.get(productId) || `Producto ID ${productId}`;
      
      const returnedDetection: Detection = {
        id: `returned_${productId}_${Date.now()}`,
        product_name: `🔄 ${productName} (Retornado)`,
        detected_at: new Date().toISOString(),
        confidence: 0.5,
        product_id: productId,
      };
      
      setDetections((prev) => [...prev, returnedDetection]);
    });
    
    console.log('[LiveRecording] ✅ Resumen de ventas mostrado en UI');
  };

  const cleanup = async () => {
    console.log('[LiveRecording] 🧹 Cleanup iniciado...');
    
    // Finalizar scan si existe
    if (wsServiceRef.current && scanIdRef.current) {
      try {
        console.log('[LiveRecording] 🛑 Finalizando scan:', scanIdRef.current);
        await wsServiceRef.current.endScan({ scanId: scanIdRef.current });
      } catch (error) {
        console.warn('[LiveRecording] ⚠️ Error finalizando scan:', error);
      }
    }
    
    // Desconectar WebSocket
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
    
    // Limpiar referencias
    scanIdRef.current = null;
    isRecordingRef.current = false;
    scanTypeRef.current = 'load'; // Reset a load por defecto
    detectedProductIdsRef.current.clear();
    
    console.log('[LiveRecording] ✅ Cleanup completado');
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
              isStreaming={isRecording && !isPaused}
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
              onStartLoadScan={() => handleStartRecording('load')}
              onStartReturnScan={() => handleStartRecording('return')}
              hasOriginalScan={!!originalScanId}
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
