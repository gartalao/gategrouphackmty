# Smart Trolley - Mobile Shelf App

Aplicación React Native (Expo) para captura automática y manual de imágenes de repisas en trolleys de catering aéreo.

---

## ✨ Características Implementadas

### **Fase 1 - Básico**
- ✅ Captura manual de fotos con botón
- ✅ Compresión de imágenes (JPEG 1280px, 80% quality)
- ✅ Upload a backend vía POST /scan
- ✅ Selector de celular (1, 2, o 3)
- ✅ Keep-awake para operación continua

### **Fase 2 - Automático**
- ✅ **Modo Automático**: Captura cada 5 segundos
- ✅ **Modo Manual**: Captura con botón (para testing)
- ✅ **Cola Offline**: Guarda scans cuando no hay backend
- ✅ **Reintentos Automáticos**: Procesa cola cuando se reconecta
- ✅ **Indicadores Visuales**: 🟢 Verde / 🟡 Amarillo / 🔴 Rojo
- ✅ **Contador de Pendientes**: Muestra scans en cola
- ✅ **Kiosk Mode**: Bloquea botón atrás
- ✅ **Pausa/Reanudar**: Control del timer automático
- ✅ **Countdown Visual**: Muestra segundos hasta próximo scan

---

## 🚀 Instalación

### 1. Instalar Dependencias
```bash
cd apps/mobile-shelf
npm install
```

### 2. Configurar Variables de Entorno
Crea archivo `.env`:
```bash
# Cambia XXX por tu IP local (usa ipconfig)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001/api

EXPO_PUBLIC_SCAN_INTERVAL_MS=5000
EXPO_PUBLIC_IMAGE_QUALITY=0.80
EXPO_PUBLIC_IMAGE_MAX_WIDTH=1280

# IDs de prueba
EXPO_PUBLIC_FLIGHT_ID=123
EXPO_PUBLIC_TROLLEY_ID=456
```

### 3. Iniciar Expo
```bash
npx expo start
```

### 4. Instalar en Android
1. Instala "Expo Go" desde Google Play
2. Escanea el QR code que aparece en la terminal
3. La app se cargará automáticamente

---

## 📱 Flujo de Uso

### Configuración Inicial
```
[Abrir App]
  ↓
[Seleccionar Modo: 🤖 Automático / 👆 Manual]
  ↓
[Seleccionar Celular: 1, 2, o 3]
  ↓
[Dar permiso a cámara]
  ↓
[Pantalla de captura]
```

### Modo Automático (Producción)
```
- Captura cada 5 segundos automáticamente
- Muestra countdown en pantalla
- Intenta enviar al backend
- Si falla → Guarda en cola offline
- Procesamiento automático de cola
- Botón Pausar/Reanudar
- Botón Volver (sale del modo auto)
```

### Modo Manual (Testing)
```
- Botón "TOMAR FOTO" visible
- Captura solo cuando presionas
- Mismo flujo de compresión y upload
- Útil para debugging
```

---

## 📦 Estructura de Archivos

```
apps/mobile-shelf/
├── screens/
│   ├── SelectPhoneScreen.js    → Selector de celular + modo
│   ├── ManualCameraScreen.js   → Modo manual (testing)
│   └── AutoCameraScreen.js     → Modo automático (producción)
├── utils/
│   ├── imageCompressor.js      → Compresión de imágenes
│   ├── uploadScan.js           → Upload al backend
│   └── offlineQueue.js         → Sistema de cola offline
├── App.js                      → Navigation setup
├── app.json                    → Configuración Expo
├── package.json                → Dependencias
└── .env                        → Variables (NO commitear)
```

---

## 🔧 Cómo Funciona

### 1. Captura Automática
```javascript
// Timer cada 5 segundos
setInterval(() => {
  await captureAndUpload();
}, 5000);
```

### 2. Compresión
```javascript
// Resize a 1280px width (height proporcional)
const compressed = await ImageManipulator.manipulateAsync(
  photoUri,
  [{ resize: { width: 1280 } }],
  { compress: 0.80, format: 'jpeg' }
);
// Resultado: 200-400 KB por imagen
```

### 3. Upload con Fallback
```javascript
try {
  await uploadScan(imageUri, shelfId);
  // ✅ Enviado al backend
} catch (error) {
  await saveToOfflineQueue(imageUri, shelfId);
  // 🟡 Guardado en cola offline
}
```

### 4. Cola Offline
- **Capacidad**: Hasta 50 scans
- **Política**: FIFO (elimina más antiguos si se llena)
- **Reintentos**: Máximo 3 intentos por scan
- **Procesamiento**: Automático cuando detecta conexión

---

## 🎯 Estados Visuales

| Indicador | Color | Significado |
|-----------|-------|-------------|
| 🟢 Operativo | Verde | Conectado y funcionando |
| 🟡 En cola offline | Amarillo | Sin backend, guardando localmente |
| 🔴 Error | Rojo | Error crítico |
| ⏸️ Pausado | Gris | Timer detenido manualmente |

---

## 🧪 Testing

### Probar Modo Manual
1. Selecciona "Manual" en la primera pantalla
2. Presiona "TOMAR FOTO"
3. Verifica que captura y muestra el status

### Probar Modo Automático
1. Selecciona "Automático"
2. Observa el countdown (5, 4, 3, 2, 1)
3. Verifica que captura automáticamente
4. Prueba el botón "Pausar"

### Probar Cola Offline
1. Inicia la app sin backend activo
2. Observa que dice "🟡 En cola offline"
3. Verifica "Pendientes: X" aumenta
4. Activa el backend
5. Observa que la cola se procesa automáticamente

---

## ⚠️ Troubleshooting

### Error: "Camera permission denied"
**Solución**: Settings → Apps → Smart Trolley → Permissions → Camera → Permitir

### Error: "Network request failed"
**Causa**: Backend no está corriendo o IP incorrecta

**Solución**:
1. Verifica que el backend esté activo
2. Encuentra tu IP: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
3. Actualiza `.env` con la IP correcta
4. NO uses `localhost`, usa la IP de tu red

### App se cierra al presionar atrás
**Solución**: En modo automático el botón está bloqueado. Usa el botón "Volver" en pantalla.

### Batería se agota rápido
**Solución**: 
- Reduce brillo de pantalla
- Usa power bank
- En testing, usa modo manual en lugar de automático

---

## 📊 Métricas

### Captura
- **Frecuencia**: 5 segundos
- **Tamaño imagen**: 200-400 KB
- **Latencia captura**: ~500ms
- **Latencia upload**: 1-3s (con backend)

### Cola Offline
- **Capacidad**: 50 scans (~10-20 MB)
- **Tiempo retención**: Hasta 3 reintentos
- **Procesamiento**: 3 scans por ciclo

### Consumo
- **RAM**: ~150-200 MB
- **Batería**: ~15-20% por hora activa
- **Storage**: Variable según cola offline

---

## 🔜 Próximas Mejoras (Fase 3)

- [ ] Pantalla de estadísticas del día
- [ ] Visualización de scans recientes
- [ ] Configuración de intervalo de captura
- [ ] Exportar logs para debugging
- [ ] Modo oscuro/claro
- [ ] Notificaciones push de alertas
- [ ] Build APK standalone

---

## 📚 Referencias

- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [React Navigation](https://reactnavigation.org/)

---

## 👥 Equipo

**HackMTY 2025 - GateGroup Smart Trolley**

---

## 📄 Licencia

MIT License - HackMTY 2025

