import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SelectPhoneScreen from './screens/SelectPhoneScreen';
import ManualCameraScreen from './screens/ManualCameraScreen';
import AutoCameraScreen from './screens/AutoCameraScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="SelectPhone"
        screenOptions={{
          headerShown: false, // Sin header para pantalla completa
        }}
      >
        <Stack.Screen 
          name="SelectPhone" 
          component={SelectPhoneScreen}
          options={{ title: 'Seleccionar Celular' }}
        />
        <Stack.Screen 
          name="ManualCamera" 
          component={ManualCameraScreen}
          options={{ title: 'Modo Manual' }}
        />
        <Stack.Screen 
          name="AutoCamera" 
          component={AutoCameraScreen}
          options={{ title: 'Modo Automático' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
