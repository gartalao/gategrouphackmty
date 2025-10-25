import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compressImage } from '../utils/imageCompressor';
import { uploadScan } from '../utils/uploadScan';

export default function ManualCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [shelfId, setShelfId] = useState(null);
  const [status, setStatus] = useState('Listo');
  const [scanCount, setScanCount] = useState(0);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Activar keep-awake para evitar que la pantalla se apague
    activateKeepAwakeAsync();
    
    // Obtener shelf_id guardado
    loadShelfId();
  }, []);

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

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Cámara no disponible');
      return;
    }

    if (!shelfId) {
      Alert.alert('Error', 'No se ha seleccionado un celular');
      return;
    }

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
      
      console.log('✅ Imagen comprimida:', compressed.uri);
      setStatus('☁️ Enviando...');
      
      // 3. Enviar al backend
      const result = await uploadScan(compressed.uri, shelfId);
      
      setStatus('✅ ¡Enviado!');
      setScansCount(scanCount + 1);
      console.log('✅ Scan subido:', result);
      
      // Resetear status después de 2 segundos
      setTimeout(() => setStatus('Listo'), 2000);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setStatus('❌ Error: ' + error.message);
      
      // Resetear status después de 3 segundos
      setTimeout(() => setStatus('Listo'), 3000);
    }
  };

  // Verificar permisos
  if (!permission) {
    return <View style={styles.container}><Text>Cargando...</Text></View>;
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modo Testing</Text>
        <Text style={styles.subtitle}>Celular: {shelfId || '?'}</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          facing="back"
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleTakePhoto}
        >
          <Text style={styles.captureButtonText}>TOMAR FOTO</Text>
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Fotos enviadas hoy: {scanCount}</Text>
        </View>
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
    fontSize: 16,
    color: '#aaa',
    marginTop: 5,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  controls: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#999',
    fontSize: 16,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statsText: {
    color: '#aaa',
    fontSize: 14,
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
});

