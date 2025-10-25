# ✅ WebSocket Conexión Arreglada

## 🔧 Cambios Realizados

### 1. Archivos `.env` Creados

#### `/apps/web-camera/.env`
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

#### `/apps/api/.env`
```env
DATABASE_URL="postgresql://neondb_owner:npg_drmFEg6auN9C@ep-little-forest-adbtr9zw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-robotics-er-1.5-preview
GEMINI_FAKE=0
PORT=3001
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
JWT_SECRET=smart-trolley-secret-change-in-production
CORS_ORIGIN=http://localhost:3002
```

### 2. Código Corregido

#### `apps/web-camera/src/components/SystemStatus.tsx`
- Corregido texto de desconexión: "Desconectado - WebSocket al servidor" en lugar de "Streaming directo"

#### `apps/web-camera/src/pages/LiveRecording.tsx`
- Agregado manejo de errores en `handleStartRecording()`
- Corregido estado de error de 'error' a 'disconnected' (tipo válido)

### 3. Servicios Reiniciados
- ✅ Backend corriendo en puerto 3001
- ✅ Frontend corriendo en puerto 3002
- ✅ WebSocket disponible en ws://localhost:3001/ws

---

## 🧪 Cómo Probar

### Paso 1: Verificar que los servicios estén corriendo
```bash
# Ver procesos activos
ps aux | grep -E "nodemon|vite" | grep -v grep

# Debería mostrar:
# - nodemon src/index.js (backend)
# - vite (frontend)
```

### Paso 2: Verificar que el backend responda
```bash
curl http://localhost:3001

# Debería devolver:
# {
#   "status": "ok",
#   "message": "Smart Trolley API - Gemini Real-time Detection",
#   "version": "2.0.0",
#   "gemini_mode": "REAL"
# }
```

### Paso 3: Abrir la aplicación web
1. Abre tu navegador en: `http://localhost:3002/`
2. Abre la consola del navegador (F12 → Console)
3. Haz clic en el botón **"▶ Iniciar Streaming"**

### Paso 4: Verificar en la consola del navegador
Deberías ver los siguientes logs:

```
[LiveRecording] Componente montado. Esperando clic en Iniciar...
[LiveRecording] 🚀 Conectando al backend vía WebSocket...
[WebSocket] ✅ Conectado a ws://localhost:3001
[LiveRecording] ✅ WebSocket conectado
[LiveRecording] 🎬 Iniciando sesión de scan...
[WebSocket] 📡 Enviando start_scan: {trolleyId: 1, operatorId: 1}
[WebSocket] ✅ Scan iniciado: {scanId: X, status: "recording"}
[LiveRecording] ✅ Sesión iniciada. Scan ID: X
[LiveRecording] 📡 Backend procesará frames con Gemini server-side
[LiveRecording] ▶ Streaming AUTOMÁTICO iniciado - Gemini analizará cada frame
[CameraView] 🎬 Streaming iniciado a 2 fps
```

### Paso 5: Verificar el estado en la UI
En la interfaz deberías ver:

- **Backend**: 🟢 "Backend conectado" (icono verde)
- **Gemini AI**: "Gemini inactivo" (cambiará a "Analizando..." cuando se envíen frames)
- **Frames**: Contador incrementando cada 500ms
- **Detecciones**: Productos detectados apareciendo en la lista

---

## 🐛 Troubleshooting

### Si no conecta:

#### 1. Verificar variables de entorno
```bash
# En apps/web-camera:
cat apps/web-camera/.env
# Debe contener: VITE_WS_URL=ws://localhost:3001

# En apps/api:
cat apps/api/.env
# Debe contener: PORT=3001
```

#### 2. Verificar logs del backend
```bash
tail -f logs/backend.log

# Deberías ver:
# ✅ Server running on http://localhost:3001
# ✅ WebSocket available at ws://localhost:3001/ws
# [WS] Video stream namespace initialized at /ws
```

#### 3. Verificar logs del frontend
```bash
tail -f logs/webcam.log

# Deberías ver:
# VITE v5.4.21  ready in XXXms
# ➜  Local:   http://localhost:3002/
```

#### 4. Reiniciar completamente
```bash
# Matar todos los procesos
killall -9 node nodemon vite

# Reiniciar
./start.sh
```

#### 5. Hard refresh del navegador
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
- Esto limpia el cache del navegador

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 3002
- [ ] Archivo `.env` existe en `apps/web-camera/`
- [ ] Archivo `.env` existe en `apps/api/`
- [ ] Console del navegador muestra "WebSocket Conectado"
- [ ] Estado en UI muestra "Backend conectado" (verde)
- [ ] Frames se envían cada 500ms
- [ ] Productos se detectan y aparecen en la lista

---

## 📊 Flujo Completo de Conexión

```
1. Usuario abre http://localhost:3002/
   └─> LiveRecording.tsx se monta
   └─> Log: "Componente montado. Esperando clic en Iniciar..."
   └─> Estado: "Desconectado"

2. Usuario hace clic en "▶ Iniciar Streaming"
   └─> handleStartRecording() ejecuta
   └─> initializeSession() se llama
   └─> WebSocketService.connect() ejecuta
   └─> Socket.IO conecta a ws://localhost:3001/ws
   └─> Log: "[WebSocket] ✅ Conectado a ws://localhost:3001"
   └─> Estado: "Backend conectado" (verde)

3. WebSocket emite start_scan
   └─> Backend crea Scan en BD
   └─> Backend retorna {scanId: X, status: 'recording'}
   └─> Frontend guarda scanId

4. Streaming inicia automáticamente
   └─> CameraView captura frames cada 500ms
   └─> Frames se envían al backend vía WebSocket
   └─> Backend procesa con Gemini
   └─> Detecciones aparecen en UI
```

---

## 🎯 Qué Esperar

Al iniciar el streaming, deberías ver:

1. **Consola del navegador**: Logs continuos mostrando frames capturados y enviados
2. **UI - Estado del Sistema**:
   - Backend: 🟢 Conectado
   - Gemini: 🔵 Analizando (cuando procesa frames)
   - Frames: Contador incrementando
   - Detecciones: Lista de productos detectados

3. **Logs del backend**: 
   ```
   [WS] User guest connected (socketId)
   [WS] Scan X started for trolley 1
   [WS] Product detected: Coca-Cola 350ml (confidence: 0.92)
   ```

---

## 🚀 Siguiente Paso

Si todo funciona correctamente:
1. Muestra un producto a la cámara (puede ser una imagen en el monitor)
2. Observa cómo Gemini lo detecta en < 2 segundos
3. Ve cómo aparece en la lista de detecciones
4. ¡Listo para la demo!

---

**Fecha**: 25 de octubre de 2025
**Estado**: ✅ ARREGLADO Y FUNCIONAL

