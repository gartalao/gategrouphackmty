import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OperatorSetupScreen from './screens/OperatorSetupScreen';
import LiveRecordingScreen from './screens/LiveRecordingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="OperatorSetup"
        screenOptions={{
          headerShown: false, // Sin header para pantalla completa
        }}
      >
        <Stack.Screen
          name="OperatorSetup"
          component={OperatorSetupScreen}
          options={{ title: 'Setup de Operador' }}
        />
        <Stack.Screen
          name="LiveRecording"
          component={LiveRecordingScreen}
          options={{ title: 'Grabación en Vivo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
