import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';

const API_URL = 'http://10.22.212.212:4000'; // Your local IP

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    successCount: 0,
    errorCount: 0,
    lastResponse: null as any,
  });
  
  // Configuration
  const [config, setConfig] = useState({
    flightId: '1',
    trolleyId: '1',
    shelfId: '1',
    apiUrl: API_URL,
    interval: '5', // seconds
  });

  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isCapturing) {
      startAutoCapture();
    } else {
      stopAutoCapture();
    }
    return () => stopAutoCapture();
  }, [isCapturing, config.interval]);

  if (!permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function captureAndUpload() {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });

      if (!photo) return;

      console.log('📸 Foto capturada:', photo.uri);

      // Compress image
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('🗜️  Imagen comprimida:', compressed.uri);

      // Upload to backend
      const formData = new FormData();
      formData.append('image', {
        uri: compressed.uri,
        type: 'image/jpeg',
        name: 'scan.jpg',
      } as any);
      formData.append('flight_id', config.flightId);
      formData.append('trolley_id', config.trolleyId);
      formData.append('shelf_id', config.shelfId);

      console.log('📤 Subiendo a:', `${config.apiUrl}/scan`);

      const response = await fetch(`${config.apiUrl}/scan`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Scan exitoso:', result);
        console.log('📊 Items detectados:', result.items);
        console.log('📈 Diffs:', result.diffs);
        console.log('🎯 Confidence:', result.confidence_avg);
        
        setStats(prev => ({
          totalScans: prev.totalScans + 1,
          successCount: prev.successCount + 1,
          errorCount: prev.errorCount,
          lastResponse: result,
        }));
        setLastScan(result);
      } else {
        console.error('❌ Error en scan:', result);
        setStats(prev => ({
          ...prev,
          totalScans: prev.totalScans + 1,
          errorCount: prev.errorCount + 1,
        }));
      }
    } catch (error) {
      console.error('❌ Error capturando/subiendo:', error);
      setStats(prev => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        errorCount: prev.errorCount + 1,
      }));
    }
  }

  function startAutoCapture() {
    console.log('🎬 Iniciando captura automática cada', config.interval, 'segundos');
    intervalRef.current = setInterval(() => {
      captureAndUpload();
    }, parseInt(config.interval) * 1000);
  }

  function stopAutoCapture() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏸️  Captura automática detenida');
    }
  }

  function toggleCapture() {
    setIsCapturing(!isCapturing);
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <Text style={styles.topBarText}>
                📱 Shelf {config.shelfId} | Flight {config.flightId}
              </Text>
            </View>
            
            {isCapturing && (
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>CAPTURANDO</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      <View style={styles.controls}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Estadísticas</Text>
          <Text style={styles.statsText}>Total: {stats.totalScans}</Text>
          <Text style={styles.statsTextSuccess}>✅ Exitosos: {stats.successCount}</Text>
          <Text style={styles.statsTextError}>❌ Errores: {stats.errorCount}</Text>
          {stats.lastResponse && (
            <Text style={styles.statsText}>
              Última: {stats.lastResponse.items?.length || 0} items, 
              conf: {(stats.lastResponse.confidence_avg * 100).toFixed(0)}%
            </Text>
          )}
        </View>

        {/* Configuration */}
        <View style={styles.configContainer}>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>API URL:</Text>
            <TextInput
              style={styles.configInput}
              value={config.apiUrl}
              onChangeText={(text) => setConfig({ ...config, apiUrl: text })}
              placeholder="http://192.168.1.X:4000"
            />
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Flight ID:</Text>
            <TextInput
              style={styles.configInputSmall}
              value={config.flightId}
              onChangeText={(text) => setConfig({ ...config, flightId: text })}
              keyboardType="numeric"
            />
            <Text style={styles.configLabel}>Trolley ID:</Text>
            <TextInput
              style={styles.configInputSmall}
              value={config.trolleyId}
              onChangeText={(text) => setConfig({ ...config, trolleyId: text })}
              keyboardType="numeric"
            />
            <Text style={styles.configLabel}>Shelf ID:</Text>
            <TextInput
              style={styles.configInputSmall}
              value={config.shelfId}
              onChangeText={(text) => setConfig({ ...config, shelfId: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Intervalo (s):</Text>
            <TextInput
              style={styles.configInputSmall}
              value={config.interval}
              onChangeText={(text) => setConfig({ ...config, interval: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
          onPress={toggleCapture}
        >
          <Text style={styles.captureButtonText}>
            {isCapturing ? '⏸️  DETENER' : '▶️  INICIAR CAPTURA'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={captureAndUpload}
        >
          <Text style={styles.manualButtonText}>📸 CAPTURA MANUAL</Text>
        </TouchableOpacity>

        {lastScan && (
          <View style={styles.lastScanContainer}>
            <Text style={styles.lastScanTitle}>Último Scan #{lastScan.scan_id}</Text>
            {lastScan.items?.map((item: any, idx: number) => (
              <Text key={idx} style={styles.lastScanItem}>
                • {item.sku}: {item.qty} unidades (conf: {(item.confidence * 100).toFixed(0)}%)
              </Text>
            ))}
            {lastScan.diffs?.filter((d: any) => d.diff !== 0).length > 0 && (
              <View style={styles.alertsContainer}>
                <Text style={styles.alertsTitle}>⚠️  Alertas:</Text>
                {lastScan.diffs.filter((d: any) => d.diff !== 0).map((diff: any, idx: number) => (
                  <Text key={idx} style={styles.alertText}>
                    {diff.type === 'missing' ? '🔴' : '🟡'} {diff.sku}: diff {diff.diff}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topBar: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    alignItems: 'center',
  },
  topBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    paddingBottom: 40,
  },
  statsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  statsTextSuccess: {
    color: '#10b981',
    fontSize: 14,
    marginBottom: 4,
  },
  statsTextError: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 4,
  },
  configContainer: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  configLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginRight: 8,
  },
  configInput: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
  },
  configInputSmall: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
    width: 50,
    marginRight: 8,
  },
  captureButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  captureButtonActive: {
    backgroundColor: '#dc2626',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualButton: {
    backgroundColor: '#6b7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastScanContainer: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  lastScanTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastScanItem: {
    color: '#10b981',
    fontSize: 12,
    marginBottom: 4,
  },
  alertsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4a4a4a',
  },
  alertsTitle: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertText: {
    color: '#f59e0b',
    fontSize: 11,
    marginBottom: 2,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

