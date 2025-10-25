# 🚀 Instrucciones para Iniciar el Sistema

## 📋 Comandos por Carpeta

### 1. **Backend API** (Terminal 1)

```bash
cd apps/api
npm run dev
```

**Qué hace**: Inicia el servidor Express en `http://localhost:3001`
- ✅ Escucha en puerto 3001
- ✅ WebSocket en `/ws`
- ✅ API REST en `/api/*`
- ✅ Análisis de video con Gemini

**Archivos importantes**:
- `apps/api/src/index.js` - Entry point
- `apps/api/routes/videoStream.ts` - WebSocket handler
- `apps/api/services/videoStreamService.ts` - Lógica de streaming

---

### 2. **Frontend Web Camera** (Terminal 2)

```bash
cd apps/web-camera
npm run dev
```

**Qué hace**: Inicia la aplicación web en `http://localhost:5173` (o similar)
- ✅ Interfaz de cámara
- ✅ Streaming de video
- ✅ Conexión WebSocket al backend

**Archivos importantes**:
- `apps/web-camera/src/App.tsx` - Componente principal
- `apps/web-camera/src/components/CameraView.tsx` - Vista de cámara
- `apps/web-camera/src/services/websocketService.ts` - Cliente WebSocket

---

## ✅ Verificar que Funciona

### Paso 1: Verificar Backend

Abrir en navegador: `http://localhost:3001`

**Deberías ver**:
```json
{
  "status": "ok",
  "message": "Smart Trolley API - Gemini Real-time Detection",
  "version": "2.0.0",
  "gemini_mode": "REAL"
}
```

### Paso 2: Verificar Frontend

Abrir en navegador: `http://localhost:5173`

**Deberías ver**:
- ✅ Interfaz de cámara
- ✅ Botones "Iniciar Streaming", "Foto Manual"
- ✅ Vista previa de video

### Paso 3: Probar Flujo Completo

1. **Permitir acceso a cámara** (navegador pedirá permiso)
2. **Click en "Iniciar Streaming"**
3. **Verificar logs en Terminal 1** (backend)

**Logs esperados**:
```
[WS] User operator01 connected (abc123)
[WS] Scan 789 started for trolley 456 (video stream initialized)
[WS] ✓ Product detected: Coca-Cola Regular 330ml (confidence: 0.89)
```

---

## 🔧 Configuración Necesaria

### Archivo: `apps/api/.env`

Crear este archivo si no existe:

```env
PORT=3001
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
GEMINI_API_KEY=tu_api_key_aqui
GEMINI_MODEL=gemini-1.5-flash
JWT_SECRET=tu_secret_key
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
```

### Archivo: `apps/web-camera/.env`

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

**Solución**:
```bash
# En apps/api
npm install

# En apps/web-camera
npm install
```

### Error: "Port 3001 already in use"

**Solución**: Cambiar puerto en `apps/api/.env`:
```env
PORT=3002
```

### Error: "WebSocket connection failed"

**Solución**: Verificar que el backend esté corriendo:
```bash
curl http://localhost:3001/health
```

### Cámara no abre

**Solución**:
1. Usar HTTPS (en producción)
2. Permitir permisos de cámara en el navegador
3. Verificar que tienes cámara conectada

---

## 📊 Comandos Rápidos

### Iniciar todo en paralelo (3 terminales):

**Terminal 1** (Backend):
```bash
cd apps/api && npm run dev
```

**Terminal 2** (Frontend):
```bash
cd apps/web-camera && npm run dev
```

**Terminal 3** (Logs):
```bash
tail -f apps/api/logs/*.log
```

### Detener todo:

Presionar `Ctrl+C` en cada terminal

---

## 🎯 Flujo de Uso

1. **Iniciar backend** → `cd apps/api && npm run dev`
2. **Abrir navegador** → `http://localhost:5173`
3. **Permitir cámara**
4. **Click "Iniciar Streaming"**
5. **Ver detecciones en tiempo real**

---

## 📝 Variables de Entorno Requeridas

**Backend** (`apps/api/.env`):
- ✅ `GEMINI_API_KEY` - **Requerida** para análisis real
- ✅ `DATABASE_URL` - **Requerida** para guardar datos
- ⚠️ `GEMINI_FAKE=1` - Opcional, para testing sin API key

**Frontend** (`apps/web-camera/.env`):
- ⚠️ `VITE_API_URL` - Opcional (default: localhost:3001)
- ⚠️ `VITE_WS_URL` - Opcional (default: ws://localhost:3001)

---

## 🔗 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Backend API | http://localhost:3001 | Servidor principal |
| Frontend | http://localhost:5173 | App web cámara |
| Health Check | http://localhost:3001/health | Verificar backend |
| WebSocket | ws://localhost:3001/ws | Conexión real-time |

---

¡Listo para probar! 🚀
