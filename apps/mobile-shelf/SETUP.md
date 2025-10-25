# Mobile Shelf - Setup Guide

## 📱 Smart Trolley Mobile App

Esta es la aplicación móvil React Native Expo para las cámaras de estantería Android del Smart Trolley.

## 🔧 Cambios Realizados

### Problema Original
- Error: `Unable to resolve module @babel/runtime/helpers/slicedToArray`
- Error: `Invalid hook call` por múltiples versiones de React
- Conflictos entre monorepo workspace y Expo

### Solución Aplicada

#### 1. **Removido del Workspace**
- Mobile-shelf ya NO es parte del npm workspace
- Eliminado de `package.json` workspaces
- Ahora es un proyecto completamente independiente

#### 2. **Dependencias Limpias**
- React 19.1.0 como única versión
- Todas las dependencias instaladas localmente
- Sin conflictos con el monorepo

#### 3. **Metro Config Simplificado**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.projectRoot = __dirname;
config.watchFolders = [__dirname];
module.exports = config;
```

## 🚀 Cómo Levantar el Proyecto

### Prerrequisitos
- Node.js 20.14.0+ (recomendado 20.19.4+)
- npm 10.7.0+
- Expo CLI
- Android Studio / Xcode (para emuladores)

### Pasos

1. **Navegar al directorio correcto**:
   ```bash
   cd D:\GitHub\GateGroup_HackMTY\apps\mobile-shelf
   ```

2. **Instalar dependencias** (si no están instaladas):
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npx expo start --clear
   ```

4. **Ejecutar en dispositivo/emulador**:
   - **Android**: `npx expo start --android`
   - **iOS**: `npx expo start --ios`
   - **Web**: `npx expo start --web`

### Comandos Disponibles
```bash
npm run start      # expo start
npm run dev        # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```

## 📁 Estructura del Proyecto

```
apps/mobile-shelf/
├── App.js                 # Componente principal
├── index.js               # Punto de entrada
├── package.json          # Dependencias independientes
├── metro.config.js        # Configuración Metro (simplificada)
├── app.json              # Configuración Expo
├── screens/              # Pantallas de la app
│   ├── AutoCameraScreen.js
│   ├── ManualCameraScreen.js
│   └── SelectPhoneScreen.js
├── utils/                # Utilidades
│   ├── imageCompressor.js
│   ├── offlineQueue.js
│   └── uploadScan.js
└── assets/               # Recursos (iconos, imágenes)
```

## ⚠️ Notas Importantes

- **NO ejecutar** `expo start` desde la raíz del proyecto
- **Siempre ejecutar** desde `apps/mobile-shelf/`
- El proyecto es **completamente independiente** del monorepo
- React 19.1.0 es la única versión instalada

## 🐛 Solución de Problemas

### Si aparece "Unable to find expo":
```bash
cd apps/mobile-shelf
npm install
npx expo start --clear
```

### Si hay errores de React:
```bash
cd apps/mobile-shelf
rm -rf node_modules
npm install
npx expo start --clear
```

### Si hay problemas de caché:
```bash
npx expo start --clear
# o
npx expo start --reset-cache
```

## 📱 Funcionalidades

- **Cámara automática**: Captura automática de productos
- **Cámara manual**: Captura manual con controles
- **Selección de teléfono**: Configuración de dispositivo
- **Compresión de imágenes**: Optimización automática
- **Cola offline**: Sincronización cuando hay conexión
- **Subida de escaneos**: Envío a la API

---

**Desarrollado por GateGroup Smart Trolley Team para HackMTY 2024**
