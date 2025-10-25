import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compressImage } from '../utils/imageCompressor';
import { uploadScan } from '../utils/uploadScan';
import { saveToOfflineQueue, getOfflineQueue, removeFromOfflineQueue } from '../utils/offlineQueue';

export default function AutoCameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [shelfId, setShelfId] = useState(null);
  const [status, setStatus] = useState('Iniciando...');
  const [scanCount, setScanCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    // Activar keep-awake
    activateKeepAwakeAsync();
    
    // Cargar configuración
    loadShelfId();
    loadPendingQueue();
    
    // Bloquear botón atrás
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Bloquear
    });

    return () => {
      backHandler.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (permission?.granted && shelfId && isActive) {
      startAutoCapture();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [permission, shelfId, isActive]);

  const loadShelfId = async () => {
    try {
      const savedShelfId = await AsyncStorage.getItem('shelf_id');
      if (savedShelfId) {
        setShelfId(savedShelfId);
      }
    } catch (error) {
      console.error('Error cargando shelf_id:', error);
    }
  };

  const loadPendingQueue = async () => {
    try {
      const queue = await getOfflineQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Error cargando cola:', error);
    }
  };

  const startAutoCapture = () => {
    setStatus('🟢 Operativo');
    setCountdown(5);

    // Timer principal de captura cada 5 segundos
    intervalRef.current = setInterval(() => {
      handleAutoCapture();
    }, 5000);

    // Countdown visual
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 5;
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoCapture = async () => {
    if (!cameraRef.current || !shelfId) return;

    try {
      setStatus('📸 Capturando...');
      
      // 1. Capturar foto
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        skipProcessing: false,
      });
      
      console.log('📸 Foto capturada:', photo.uri);
      setStatus('🔄 Comprimiendo...');
      
      // 2. Comprimir imagen
      const compressed = await compressImage(photo.uri);
      
      console.log('✅ Imagen comprimida');
      setStatus('☁️ Enviando...');
      
      // 3. Intentar enviar al backend
      try {
        const result = await uploadScan(compressed.uri, shelfId);
        
        // Éxito
        setStatus('✅ Enviado');
        setScanCount(prev => prev + 1);
        console.log('✅ Scan subido:', result);
        
        // Intentar procesar cola offline
        await processOfflineQueue();
        
      } catch (uploadError) {
        // Error de red - guardar en cola offline
        console.log('⚠️ Backend no disponible, guardando en cola...');
        await saveToOfflineQueue(compressed.uri, shelfId);
        await loadPendingQueue();
        setStatus('🟡 En cola offline');
      }
      
      // Resetear status después de 1.5 segundos
      setTimeout(() => {
        if (isActive) setStatus('🟢 Operativo');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error en captura:', error);
      setStatus('❌ Error: ' + error.message);
      setTimeout(() => {
        if (isActive) setStatus('🟢 Operativo');
      }, 2000);
    }
  };

  const processOfflineQueue = async () => {
    try {
      const queue = await getOfflineQueue();
      
      for (const item of queue.slice(0, 3)) { // Procesar máximo 3 por ciclo
        try {
          await uploadScan(item.imageUri, item.shelfId);
          await removeFromOfflineQueue(item.id);
          console.log('✅ Scan offline enviado:', item.id);
        } catch (error) {
          console.log('⚠️ Scan offline aún no se puede enviar');
          break; // Si falla uno, detener reintentos
        }
      }
      
      await loadPendingQueue();
    } catch (error) {
      console.error('Error procesando cola offline:', error);
    }
  };

  const togglePause = () => {
    if (isActive) {
      // Pausar
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setIsActive(false);
      setStatus('⏸️ Pausado');
    } else {
      // Reanudar
      setIsActive(true);
      startAutoCapture();
    }
  };

  // Verificar permisos
  if (!permission) {
    return <View style={styles.container}><Text style={styles.text}>Cargando...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = 
    status.includes('🟢') ? '#22c55e' :
    status.includes('🟡') ? '#eab308' :
    status.includes('🔴') || status.includes('❌') ? '#ef4444' :
    '#3b82f6';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modo Automático</Text>
        <Text style={styles.subtitle}>Celular: {shelfId || '?'} | Cada 5 segundos</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          facing="back"
        />
        
        {/* Countdown overlay */}
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}s</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Scans enviados:</Text>
            <Text style={styles.statValue}>{scanCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pendientes:</Text>
            <Text style={[styles.statValue, pendingCount > 0 && styles.statWarning]}>
              {pendingCount}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.pauseButton, !isActive && styles.resumeButton]}
          onPress={togglePause}
        >
          <Text style={styles.pauseButtonText}>
            {isActive ? '⏸️ Pausar' : '▶️ Reanudar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  countdownText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statWarning: {
    color: '#eab308',
  },
  pauseButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  resumeButton: {
    backgroundColor: '#22c55e',
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#4b5563',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text: {
    color: '#fff',
  },
});

