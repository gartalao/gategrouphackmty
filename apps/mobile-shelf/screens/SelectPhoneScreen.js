import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectPhoneScreen({ navigation }) {
  const [mode, setMode] = useState('auto'); // 'auto' o 'manual'

  const handleSelectPhone = async (shelfId) => {
    try {
      // Guardar el shelf_id en AsyncStorage
      await AsyncStorage.setItem('shelf_id', shelfId.toString());
      console.log(`✅ Celular ${shelfId} seleccionado en modo ${mode}`);
      
      // Navegar según el modo seleccionado
      if (mode === 'auto') {
        navigation.navigate('AutoCamera');
      } else {
        navigation.navigate('ManualCamera');
      }
    } catch (error) {
      console.error('Error guardando shelf_id:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Trolley Setup</Text>
      <Text style={styles.subtitle}>¿Qué celular soy?</Text>
      
      {/* Toggle de modo */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'auto' && styles.modeButtonActive]}
          onPress={() => setMode('auto')}
        >
          <Text style={[styles.modeButtonText, mode === 'auto' && styles.modeButtonTextActive]}>
            🤖 Automático
          </Text>
          <Text style={styles.modeButtonSubtext}>Cada 5 segundos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
          onPress={() => setMode('manual')}
        >
          <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
            👆 Manual
          </Text>
          <Text style={styles.modeButtonSubtext}>Cuando presiones</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleSelectPhone(1)}
        >
          <Text style={styles.buttonText}>Celular 1</Text>
          <Text style={styles.buttonSubtext}>(Repisa Superior)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleSelectPhone(2)}
        >
          <Text style={styles.buttonText}>Celular 2</Text>
          <Text style={styles.buttonSubtext}>(Repisa Media)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleSelectPhone(3)}
        >
          <Text style={styles.buttonText}>Celular 3</Text>
          <Text style={styles.buttonSubtext}>(Repisa Inferior)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>HackMTY 2025 - GateGroup</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  modeButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    minWidth: 150,
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  modeButtonSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    color: '#e0e0e0',
    fontSize: 14,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#999',
  },
});

