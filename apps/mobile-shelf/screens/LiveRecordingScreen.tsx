import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  BackHandler,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import WebSocketClient, { ProductDetectedEvent } from '../utils/websocketClient';
import VideoStreamer from '../utils/videoStreamer';

interface LiveRecordingScreenProps {
  navigation: any;
  route: {
    params: {
      trolleyId: number;
      operatorId: number;
      operatorName: string;
    };
  };
}

interface Detection {
  id: string;
  product_name: string;
  detected_at: string;
  confidence: number;
}

export default function LiveRecordingScreen({ navigation, route }: LiveRecordingScreenProps) {
  const { trolleyId, operatorId, operatorName } = route.params;

  const [scanId, setScanId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [framesSent, setFramesSent] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);

  const cameraRef = useRef<any>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const videoStreamerRef = useRef<VideoStreamer | null>(null);

  useEffect(() => {
    initializeSession();

    // Bloquear botón de atrás
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Finalizar sesión?',
        'Estás seguro de que quieres finalizar? Esto detendrá la grabación.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', onPress: handleEndSession },
        ]
      );
      return true;
    });

    return () => {
      backHandler.remove();
      cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      // Mantener pantalla activa
      await activateKeepAwakeAsync();

      // Inicializar WebSocket
      const wsClient = new WebSocketClient({
        onConnect: () => {
          console.log('[LiveRecording] WebSocket connected');
          setWsConnected(true);
        },
        onDisconnect: () => {
          console.log('[LiveRecording] WebSocket disconnected');
          setWsConnected(false);
        },
        onError: (error) => {
          console.error('[LiveRecording] WebSocket error:', error);
        },
        onProductDetected: handleProductDetected,
      });

      await wsClient.connect();
      wsClientRef.current = wsClient;

      // Iniciar scan
      const response = await wsClient.startScan({ trolleyId, operatorId });
      setScanId(response.scanId);

      // Iniciar video streaming
      const streamer = new VideoStreamer({
        scanId: response.scanId,
        cameraRef,
        wsClient,
        onFrameSent: () => {
          setFramesSent((prev) => prev + 1);
        },
        onError: (error) => {
          console.error('[LiveRecording] Streamer error:', error);
        },
      });

      streamer.start();
      videoStreamerRef.current = streamer;
      setIsRecording(true);

      console.log(`[LiveRecording] Session started. Scan ID: ${response.scanId}`);
    } catch (error) {
      console.error('[LiveRecording] Error initializing:', error);
      Alert.alert('Error', 'No se pudo iniciar la sesión. Verifica tu conexión.');
      navigation.goBack();
    }
  };

  const handleProductDetected = (event: ProductDetectedEvent) => {
    const newDetection: Detection = {
      id: `${event.product_id}_${Date.now()}`,
      product_name: event.product_name,
      detected_at: event.detected_at,
      confidence: event.confidence,
    };

    setDetections((prev) => [newDetection, ...prev].slice(0, 10)); // Keep last 10
  };

  const handlePauseResume = () => {
    if (!videoStreamerRef.current) return;

    if (isPaused) {
      videoStreamerRef.current.resume();
      setIsPaused(false);
    } else {
      videoStreamerRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleEndSession = async () => {
    if (!wsClientRef.current || !scanId) return;

    try {
      // Detener streaming
      videoStreamerRef.current?.stop();
      setIsRecording(false);

      // Finalizar scan
      await wsClientRef.current.endScan({ scanId });

      Alert.alert('Sesión Finalizada', 'La sesión de picking ha finalizado correctamente.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('[LiveRecording] Error ending session:', error);
      Alert.alert('Error', 'Error al finalizar la sesión.');
    } finally {
      cleanup();
    }
  };

  const cleanup = () => {
    videoStreamerRef.current?.stop();
    wsClientRef.current?.disconnect();
    deactivateKeepAwake();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (wsClientRef.current) {
        setOfflineQueueSize(wsClientRef.current.getQueueSize());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const connectionColor = wsConnected ? '#22c55e' : '#ef4444';
  const recordingColor = isRecording && !isPaused ? '#ef4444' : '#888';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎥 Grabación en Vivo</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.infoText}>Trolley #{trolleyId}</Text>
          <Text style={styles.infoText}>•</Text>
          <Text style={styles.infoText}>{operatorName}</Text>
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />

        {/* Status Overlay */}
        <View style={styles.statusOverlay}>
          <View style={[styles.statusDot, { backgroundColor: connectionColor }]} />
          <Text style={styles.statusText}>{wsConnected ? 'Conectado' : 'Desconectado'}</Text>

          {isRecording && !isPaused && (
            <View style={[styles.recordingDot, { backgroundColor: recordingColor }]} />
          )}
        </View>

        {/* Stats Overlay */}
        <View style={styles.statsOverlay}>
          <Text style={styles.statText}>Frames: {framesSent}</Text>
          {offlineQueueSize > 0 && (
            <Text style={[styles.statText, styles.queueWarning]}>
              Cola: {offlineQueueSize}
            </Text>
          )}
        </View>
      </View>

      {/* Detections Feed */}
      <View style={styles.detectionsFeed}>
        <Text style={styles.feedTitle}>📦 Productos Detectados ({detections.length})</Text>
        <ScrollView style={styles.detectionsList}>
          {detections.map((detection) => (
            <View key={detection.id} style={styles.detectionItem}>
              <Text style={styles.productName}>{detection.product_name}</Text>
              <View style={styles.detectionMeta}>
                <Text style={styles.confidence}>
                  {(detection.confidence * 100).toFixed(0)}%
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(detection.detected_at).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}

          {detections.length === 0 && (
            <Text style={styles.emptyText}>
              Esperando detecciones... Mete productos al trolley.
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.pauseButton]}
          onPress={handlePauseResume}
        >
          <Text style={styles.buttonText}>{isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.endButton]} onPress={handleEndSession}>
          <Text style={styles.buttonText}>⏹️ Finalizar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 8,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  statsOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  queueWarning: {
    color: '#eab308',
    marginTop: 3,
  },
  detectionsFeed: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    maxHeight: 180,
  },
  feedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detectionsList: {
    flex: 1,
  },
  detectionItem: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  detectionMeta: {
    alignItems: 'flex-end',
  },
  confidence: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  controls: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    gap: 10,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#3b82f6',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

