# 🎯 API de Streaming Funcional - Estado y Plan

## ✅ LIMPIEZA COMPLETADA

### Eliminado:
- ❌ `/apps/mobile-shelf/` - App React Native completa (ya no se usa)
- ❌ Archivos TypeScript duplicados del backend
- ❌ 13 archivos .md redundantes de transformaciones anteriores

### Mantenido:
- ✅ `/apps/web-camera/` - Web app principal (React + Vite)
- ✅ `/apps/api/` - Backend con WebSocket y Gemini
- ✅ `/apps/dashboard/` - Dashboard web
- ✅ Backend services limpios (solo .js)

---

## 🏗️ ARQUITECTURA ACTUAL

```
🌐 Web App (apps/web-camera/)
    ├─ React + TypeScript + Vite
    ├─ Captura de video con WebRTC
    ├─ Conexión directa a Gemini Live API
    ├─ Puerto: 3002 o 3003
    └─ URL: http://localhost:3002

          ↓ WebSocket

🔧 Backend API (apps/api/)
    ├─ Node.js + Express + Socket.IO
    ├─ Coordinación de sesiones
    ├─ Base de datos (Neon PostgreSQL)
    ├─ Puerto: 3001
    └─ WebSocket: ws://localhost:3001/ws

          ↓ Query/Insert

🗄️ Database (Neon PostgreSQL)
    ├─ Productos con visual descriptions
    ├─ Product Detections
    ├─ Scans (sesiones de video)
    └─ Users, Trolleys, Flights
```

---

## 📁 ESTRUCTURA LIMPIA DEL PROYECTO

```
GateGroup_HackMTY/
├── apps/
│   ├── api/                    ← Backend con WebSocket
│   │   ├── src/index.js
│   │   ├── services/
│   │   │   └── geminiService.js
│   │   └── routes/
│   │       ├── videoStream.js
│   │       └── detections.js
│   │
│   ├── web-camera/             ← Web app principal (React)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── OperatorSetup.tsx
│   │   │   │   ├── LiveRecording.tsx
│   │   │   │   └── DemoMode.tsx
│   │   │   ├── components/
│   │   │   │   ├── CameraView.tsx
│   │   │   │   ├── DetectionFeed.tsx
│   │   │   │   └── StatusPanel.tsx
│   │   │   └── services/
│   │   │       ├── cameraService.ts
│   │   │       ├── geminiLiveService.ts
│   │   │       └── websocketService.ts
│   │   └── package.json
│   │
│   └── dashboard/              ← Dashboard web
│       └── components/
│           ├── RealtimeDetectionFeed.jsx
│           └── TrolleyProgress.jsx
│
├── prisma/
│   └── schema.prisma          ← Schema actualizado
│
├── docs/                      ← Documentación del sistema
├── .env                       ← Variables de entorno (crear)
└── seed-products.js           ← Seed de productos
```

---

## 🔧 BACKEND API - ESTADO ACTUAL

### Servicios Implementados:

#### ✅ `services/geminiService.js`
```javascript
// Funciones:
- buildPrompt(catalog)
- analyzeFrame(jpegBase64, catalog, opts)
- productNameToSlug(name)

// Modos:
- FAKE: Para testing sin API key (heurístico)
- REAL: Llamadas a Gemini API
```

#### ✅ `routes/videoStream.js`
```javascript
// WebSocket namespace: /ws
// Eventos:
- start_scan    → Iniciar sesión de grabación
- frame         → Recibir frame de video
- end_scan      → Finalizar sesión
- product_detected (emit) → Notificar detección
```

#### ✅ `routes/detections.js`
```javascript
// REST endpoints:
- GET /trolleys/:id/realtime-status
- GET /trolleys/:id/detections
- GET /scans/:id/summary
```

#### ✅ `src/index.js`
```javascript
// Servidor Express con:
- Socket.IO configurado
- CORS habilitado
- Rutas montadas
- Graceful shutdown
```

---

## 🌐 WEB APP - ESTADO ACTUAL

### Páginas:

#### ✅ `OperatorSetup.tsx`
- Setup de operador
- Inputs: trolleyId, operatorId, nombre
- Test de cámara
- Navegación a LiveRecording

#### ✅ `LiveRecording.tsx`
- Vista de cámara fullscreen
- Streaming de video
- Feed de detecciones en tiempo real
- Controles: Pausar/Reanudar/Finalizar

#### ✅ `DemoMode.tsx`
- Modo demo sin cámara real
- Para testing y demostración

### Servicios:

#### ✅ `geminiLiveService.ts`
- Integración con Gemini Live API
- Análisis directo desde el navegador
- Streaming de video a Gemini

#### ✅ `websocketService.ts`
- Cliente WebSocket robusto
- Eventos: start_scan, frame, end_scan
- Reconexión automática

#### ✅ `cameraService.ts`
- Captura de video con WebRTC
- Extracción de frames
- Compresión JPEG

---

## ⚙️ CONFIGURACIÓN NECESARIA

### 1. Archivo `.env` en la raíz:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_drmFEg6auN9C@ep-little-forest-adbtr9zw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Gemini API
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-pro-vision
GEMINI_FAKE=0

# Video Streaming
VIDEO_FRAME_SEND_FPS=2
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200

# Server
PORT=3001
JWT_SECRET=supersecretkey_hackmty_2025

# WebSocket
WS_URL=http://localhost:3001
```

### 2. Archivo `.env` en `apps/web-camera/`:

```env
VITE_GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

---

## 🚀 EJECUTAR EL SISTEMA

### Backend API:
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/api
npm run dev
```

### Web App:
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/web-camera
npm install  # Si no has instalado
npm run dev
```

---

## 📊 ESTADO DE ARCHIVOS

### Backend API:
- ✅ `src/index.js` - Servidor principal
- ✅ `services/geminiService.js` - Integración Gemini
- ✅ `routes/videoStream.js` - WebSocket streaming
- ✅ `routes/detections.js` - REST endpoints
- ✅ `package.json` - Dependencias actualizadas

### Web Camera:
- ✅ `src/App.tsx` - Componente principal
- ✅ `src/pages/` - 3 páginas (Setup, LiveRecording, DemoMode)
- ✅ `src/components/` - 4 componentes
- ✅ `src/services/` - 3 servicios (camera, gemini, websocket)
- ✅ `package.json` - Dependencias completas

### Base de Datos:
- ✅ `prisma/schema.prisma` - Schema actualizado
- ✅ ProductDetection model
- ✅ Sin Shelf model (eliminado)

---

## 🎯 PRÓXIMOS PASOS PARA API FUNCIONAL

### 1. Instalar Dependencias de Web App
```bash
cd apps/web-camera
npm install
```

### 2. Crear .env en Web Camera
```bash
cd apps/web-camera
cat > .env << 'EOF'
VITE_GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
EOF
```

### 3. Verificar Backend Funcional
```bash
cd apps/api
npm run dev
```

Debería mostrar:
```
✅ Server running on http://localhost:3001
✅ WebSocket available at ws://localhost:3001/ws
✅ Gemini Mode: 🤖 REAL (Production)
```

### 4. Ejecutar Web App
```bash
cd apps/web-camera
npm run dev
```

Debería abrir en: `http://localhost:5173` o similar

---

## 🔍 ARCHIVOS A REVISAR/AJUSTAR

### Backend:
- [ ] `apps/api/src/index.js` - Verificar rutas montadas correctamente
- [ ] `apps/api/routes/videoStream.js` - Verificar eventos WebSocket
- [ ] `apps/api/services/geminiService.js` - Verificar sin errores TypeScript

### Web Camera:
- [ ] `apps/web-camera/src/services/websocketService.ts` - Configuración WS_URL
- [ ] `apps/web-camera/src/services/geminiLiveService.ts` - API key
- [ ] `apps/web-camera/src/pages/LiveRecording.tsx` - Integración completa

---

## 🐛 PROBLEMAS A RESOLVER

### 1. Backend tiene errores de reinicio
- Error: Puerto 3001 en uso
- Solución: Matar procesos y reiniciar limpio

### 2. Archivos .env no existen
- Falta crear `.env` en raíz y en web-camera

### 3. Web app necesita dependencias
- Ejecutar `npm install` en apps/web-camera

---

## 📋 CHECKLIST DE LIMPIEZA

- ✅ Mobile-shelf eliminado
- ✅ Archivos .md redundantes eliminados
- ✅ TypeScript duplicados eliminados
- ✅ Backend limpio con solo archivos .js
- ⏳ Crear .env en raíz
- ⏳ Crear .env en web-camera
- ⏳ Instalar deps de web-camera
- ⏳ Verificar backend sin errores
- ⏳ Probar web app end-to-end

---

## 🎯 OBJETIVO DE ESTA BRANCH

**Branch**: `api-streaming-functional`

**Objetivo**: API backend completamente funcional que:
1. Recibe frames de video vía WebSocket
2. Procesa con Gemini API
3. Detecta productos en tiempo real
4. Guarda en base de datos
5. Notifica a web app vía WebSocket

**Estado actual**: Backend tiene los archivos pero necesita limpieza de procesos

---

## 📝 DOCUMENTACIÓN RELEVANTE

- `MIGRACION_WEB_APP.md` - Contexto de migración a web
- `MIGRACION_VIDEO_TIEMPO_REAL.md` - Detalles de video streaming
- `ESTADO_ACTUAL_SISTEMA.md` - Estado del sistema
- `apps/web-camera/README.md` - Documentación de web app
- `docs/references/gemini-live-api-comparison.md` - Comparación de APIs

---

**Próximo paso**: Limpiar procesos del backend y ejecutar limpiamente la web app.

