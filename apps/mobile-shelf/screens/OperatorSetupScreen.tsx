import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OperatorSetupScreenProps {
  navigation: any;
}

export default function OperatorSetupScreen({ navigation }: OperatorSetupScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [trolleyId, setTrolleyId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedOperatorId = await AsyncStorage.getItem('operator_id');
      const savedOperatorName = await AsyncStorage.getItem('operator_name');

      if (savedOperatorId) setOperatorId(savedOperatorId);
      if (savedOperatorName) setOperatorName(savedOperatorName);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const validateAndStart = async () => {
    // Validaciones
    if (!trolleyId) {
      Alert.alert('Error', 'Por favor ingresa el ID del trolley');
      return;
    }

    if (!operatorId) {
      Alert.alert('Error', 'Por favor ingresa tu ID de operador');
      return;
    }

    if (!operatorName) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    if (!cameraReady) {
      Alert.alert('Error', 'Espera a que la cámara esté lista');
      return;
    }

    setIsLoading(true);

    try {
      // Guardar datos
      await AsyncStorage.setItem('operator_id', operatorId);
      await AsyncStorage.setItem('operator_name', operatorName);
      await AsyncStorage.setItem('trolley_id', trolleyId);

      // Navegar a LiveRecordingScreen
      navigation.navigate('LiveRecording', {
        trolleyId: parseInt(trolleyId, 10),
        operatorId: parseInt(operatorId, 10),
        operatorName,
      });
    } catch (error) {
      console.error('Error al iniciar:', error);
      Alert.alert('Error', 'No se pudo iniciar la sesión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cargando...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.title}>📷 Permiso de Cámara</Text>
          <Text style={styles.permissionText}>
            Esta app necesita acceso a la cámara para grabar el proceso de carga del trolley en
            tiempo real.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Dar Permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 Setup de Operador</Text>
        <Text style={styles.subtitle}>Configura tu sesión de picking</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ID del Trolley:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 123"
            placeholderTextColor="#888"
            value={trolleyId}
            onChangeText={setTrolleyId}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tu ID de Operador:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 1"
            placeholderTextColor="#888"
            value={operatorId}
            onChangeText={setOperatorId}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tu Nombre:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor="#888"
            value={operatorName}
            onChangeText={setOperatorName}
          />
        </View>

        <View style={styles.cameraTest}>
          <Text style={styles.label}>Test de Cámara:</Text>
          <View style={styles.cameraPreview}>
            <CameraView
              style={styles.camera}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
            />
            {cameraReady && (
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>✓ Cámara lista</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, (!cameraReady || isLoading) && styles.disabledButton]}
          onPress={validateAndStart}
          disabled={!cameraReady || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>▶️ Iniciar Sesión de Picking</Text>
          )}
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
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  cameraTest: {
    marginBottom: 30,
  },
  cameraPreview: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  readyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  readyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#22c55e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});

