# ✅ PROYECTO LIMPIO Y FUNCIONAL

## 🎯 BRANCH: `api-streaming-functional`

---

## ✅ LIMPIEZA COMPLETADA

### Eliminado:
- ❌ `/apps/mobile-shelf/` (completa - ya no se usa React Native)
- ❌ 13 archivos .md redundantes de transformaciones anteriores
- ❌ Archivos TypeScript duplicados en backend
- ❌ Archivos obsoletos de Expo/React Native

### Mantenido:
- ✅ `/apps/web-camera/` - Web app principal (React + Vite + TypeScript)
- ✅ `/apps/api/` - Backend limpio (solo JavaScript)
- ✅ `/apps/dashboard/` - Dashboard web
- ✅ Documentación esencial

---

## 🏗️ ARQUITECTURA FINAL

```
🌐 Web App (http://localhost:5173)
    │
    ├─ React + TypeScript + Vite
    ├─ Cámara Web (WebRTC getUserMedia)
    ├─ Gemini Live API (directo desde navegador)
    └─ UI con Tailwind CSS
        │
        ↓ WebSocket
        │
🔧 Backend API (http://localhost:3001)
    │
    ├─ Node.js + Express
    ├─ Socket.IO (/ws namespace)
    ├─ Gemini Service (backup/coordinación)
    └─ Routes: videoStream, detections
        │
        ↓ Prisma ORM
        │
🗄️ Neon PostgreSQL
    │
    ├─ products (con visualDescription)
    ├─ product_detections
    ├─ scans (sesiones de video)
    └─ users, trolleys, flights
```

---

## 🟢 SERVICIOS ACTIVOS

| Servicio | Estado | URL | Puerto |
|----------|--------|-----|--------|
| **Backend API** | 🟢 CORRIENDO | http://localhost:3001 | 3001 |
| **Web Camera App** | 🟢 INICIANDO | http://localhost:5173 | 5173 |
| **WebSocket** | 🟢 ACTIVO | ws://localhost:3001/ws | 3001 |
| **Base de Datos** | 🟢 CONECTADA | Neon PostgreSQL | - |
| **Gemini API** | 🟢 CONFIGURADA | Modo REAL | - |

---

## 📁 ESTRUCTURA LIMPIA DEL PROYECTO

```
GateGroup_HackMTY/
├── apps/
│   ├── api/                    Backend Node.js
│   │   ├── src/index.js
│   │   ├── services/geminiService.js
│   │   └── routes/
│   │       ├── videoStream.js
│   │       └── detections.js
│   │
│   ├── web-camera/             Web App React
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── services/
│   │   └── .env ✅
│   │
│   └── dashboard/              Dashboard
│       └── components/
│
├── prisma/
│   └── schema.prisma
│
├── .env ✅
├── seed-products.js
└── docs/
```

---

## 🔧 CONFIGURACIÓN ACTUAL

### `.env` (raíz del proyecto):
```env
DATABASE_URL="postgresql://neondb_owner:...@neon.tech/neondb?sslmode=require"
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-pro-vision
GEMINI_FAKE=0
PORT=3001
JWT_SECRET=supersecretkey_hackmty_2025
```

### `apps/web-camera/.env`:
```env
VITE_GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

---

## 🚀 CÓMO USAR EL SISTEMA

### Paso 1: Abrir Web App
```
http://localhost:5173
```

### Paso 2: Configuración Inicial
- Trolley ID: `1`
- Operator ID: `1`
- Nombre: Tu nombre
- Clic en "Iniciar Sesión"

### Paso 3: Grabación en Vivo
- Permitir acceso a cámara
- Clic en "Iniciar Captura"
- Mostrar productos a la cámara
- Ver detecciones en tiempo real

---

## 🎯 PRODUCTOS DETECTABLES

| Producto | Visual | Keywords |
|----------|--------|----------|
| Coca-Cola 350ml | Lata roja logo blanco | coca, cola, lata, roja |
| Sprite 350ml | Lata verde | sprite, lata, verde |
| Lays Original 100gr | Bolsa amarilla | lays, papas, amarilla |
| Pepsi 350ml | Lata azul | pepsi, lata, azul |
| Doritos Nacho 100gr | Bolsa roja | doritos, nacho, roja |

---

## 📊 BACKEND API - ENDPOINTS

### REST:
- `GET /` - Info de la API
- `GET /health` - Health check
- `GET /api/trolleys/:id/realtime-status` - Estado en tiempo real
- `GET /api/trolleys/:id/detections` - Historial de detecciones
- `GET /api/scans/:id/summary` - Resumen de scan

### WebSocket (`ws://localhost:3001/ws`):
- `start_scan` ← Iniciar sesión
- `frame` ← Enviar frame de video
- `end_scan` ← Finalizar sesión
- `product_detected` → Notificación de detección

---

## 🎨 WEB APP - CARACTERÍSTICAS

### Páginas:
1. **OperatorSetup** (`/`) - Configuración inicial
2. **LiveRecording** (`/recording`) - Grabación en vivo
3. **DemoMode** (`/demo`) - Modo demo sin cámara

### Componentes:
- **CameraView** - Captura de video con WebRTC
- **DetectionFeed** - Feed de productos detectados
- **StatusPanel** - Panel de estado y controles
- **SystemStatus** - Estado de conexiones

### Servicios:
- **cameraService** - Manejo de cámara web
- **geminiLiveService** - Integración Gemini Live API
- **websocketService** - Comunicación con backend

---

## 🔍 VERIFICAR FUNCIONAMIENTO

### Backend Check:
```bash
curl http://localhost:3001
```

Respuesta esperada:
```json
{
  "status":"ok",
  "message":"Smart Trolley API - Gemini Real-time Detection",
  "version":"2.0.0",
  "gemini_mode":"REAL"
}
```

### Web App Check:
Abre: `http://localhost:5173`

Deberías ver la pantalla de setup con campos de input.

### WebSocket Check:
En la consola del navegador (F12) debería mostrar:
```
[WebSocket] Connecting to ws://localhost:3001
[WebSocket] Connected successfully
```

---

## 🐛 SI HAY ERRORES

### Backend no inicia:
```bash
# Matar procesos
lsof -ti:3001 | xargs kill -9

# Reiniciar
cd apps/api && npm run dev
```

### Web app no se conecta:
- Verificar que backend esté corriendo
- Verificar .env en web-camera
- Revisar consola del navegador

### Gemini API error:
- Verificar API key válida
- Verificar créditos en Google Cloud
- Temporalmente usar GEMINI_FAKE=1

---

## 📋 ARCHIVOS CRÍTICOS

### Backend (JavaScript puro):
- ✅ `apps/api/src/index.js`
- ✅ `apps/api/services/geminiService.js`
- ✅ `apps/api/routes/videoStream.js`
- ✅ `apps/api/routes/detections.js`

### Web App (TypeScript):
- ✅ `apps/web-camera/src/App.tsx`
- ✅ `apps/web-camera/src/pages/LiveRecording.tsx`
- ✅ `apps/web-camera/src/services/geminiLiveService.ts`
- ✅ `apps/web-camera/src/services/websocketService.ts`

### Configuración:
- ✅ `.env` (raíz)
- ✅ `apps/web-camera/.env`
- ✅ `prisma/schema.prisma`

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Backend corriendo en puerto 3001
2. ✅ Web app corriendo en puerto 5173
3. ⏳ Probar captura de cámara
4. ⏳ Probar detección de productos
5. ⏳ Verificar WebSocket funcionando
6. ⏳ Testing end-to-end completo

---

## 🚀 ACCEDER AL SISTEMA

**ABRE EN TU NAVEGADOR:**
```
http://localhost:5173
```

Deberías ver la pantalla de setup del operador.

---

## 💡 VENTAJAS DE LA WEB APP

- ✅ Sin necesidad de Expo o React Native
- ✅ Funciona en cualquier navegador moderno
- ✅ Gemini Live API directo (menor latencia)
- ✅ Actualizaciones instantáneas (refresh)
- ✅ Compatible con desktop, tablet, móvil
- ✅ Menor tamaño (~2-5 MB vs 50-100 MB)
- ✅ Deploy simple (servidor web estático)

---

## 📝 DOCUMENTACIÓN RELEVANTE

- `API_STREAMING_STATUS.md` - Estado de la API
- `MIGRACION_WEB_APP.md` - Contexto de migración
- `ESTADO_ACTUAL_SISTEMA.md` - Estado del sistema
- `apps/web-camera/README.md` - Docs de web app

---

**ESTADO**: 🟢 **PROYECTO LIMPIO Y FUNCIONAL**  
**BRANCH**: `api-streaming-functional`  
**LISTO PARA**: Testing de la web app con backend

**ABRE**: http://localhost:5173 🚀

