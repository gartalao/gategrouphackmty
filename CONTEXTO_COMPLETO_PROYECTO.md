# 📋 CONTEXTO COMPLETO DEL PROYECTO - Para Otro Chat de Cursor

## 🎯 OBJETIVO DEL PROYECTO

Sistema de detección visual de productos en **TIEMPO REAL** para trolleys de catering aéreo usando **Google Gemini Robotics-ER 1.5**.

**Usuario**: Operador que carga productos en trolleys  
**Acción**: Muestra productos a una cámara web  
**Sistema**: Detecta automáticamente qué productos son y los registra en base de datos  
**Latencia**: < 2 segundos end-to-end  

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

```
┌─────────────────────────────────────┐
│   WEB CAMERA APP                     │
│   - React + Vite + TypeScript       │
│   - Puerto: 3002                    │
│   - Captura video con WebRTC        │
│   - 2 fps (cada 500ms)              │
└─────────────────────────────────────┘
            │
            │ WebSocket
            │ ws://localhost:3001/ws
            ↓
┌─────────────────────────────────────┐
│   BACKEND API                       │
│   - Node.js + Express + Socket.IO   │
│   - Puerto: 3001                    │
│   - Namespace: /ws                  │
└─────────────────────────────────────┘
            │
            │ REST API v1beta
            │ POST request
            ↓
┌─────────────────────────────────────┐
│   GEMINI ROBOTICS-ER 1.5           │
│   - Model: gemini-robotics-er-1.5-preview
│   - Thinking budget: 0             │
│   - Temperature: 0.2                │
└─────────────────────────────────────┘
            │
            │ JSON Response
            ↓
┌─────────────────────────────────────┐
│   BACKEND VALIDATION                │
│   - Parse JSON robusto              │
│   - Threshold: 0.70                 │
│   - Cooldown: 1200ms                │
└─────────────────────────────────────┘
            │
            │ INSERT
            ↓
┌─────────────────────────────────────┐
│   NEON POSTGRESQL                   │
│   - ProductDetection table          │
│   - Scan table                      │
│   - Product table (8 productos)     │
└─────────────────────────────────────┘
            │
            │ WebSocket emit
            │ 'product_detected'
            ↓
┌─────────────────────────────────────┐
│   WEB CAMERA UI                     │
│   - DetectionFeed actualizado       │
│   - Contador incrementado           │
│   - Badge con confianza             │
└─────────────────────────────────────┘
```

---

## 📁 ESTRUCTURA DEL PROYECTO (SOLO LO ESENCIAL)

```
GateGroup_HackMTY/
│
├── apps/
│   ├── api/                          # Backend Node.js
│   │   ├── .env                      # Variables de entorno
│   │   ├── src/
│   │   │   └── index.js              # Servidor Express + Socket.IO
│   │   ├── services/
│   │   │   └── geminiService.js      # Integración Gemini REST API
│   │   └── routes/
│   │       ├── videoStream.js        # WebSocket handlers
│   │       └── detections.js         # REST endpoints
│   │
│   ├── web-camera/                   # Frontend React
│   │   ├── .env                      # Variables de entorno
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LiveRecording.tsx     # Página principal
│   │   │   │   ├── OperatorSetup.tsx     # Setup (no se usa)
│   │   │   │   └── DemoMode.tsx          # Demo (no se usa)
│   │   │   ├── components/
│   │   │   │   ├── CameraView.tsx        # Vista de cámara WebRTC
│   │   │   │   ├── DetectionFeed.tsx     # Lista de detecciones
│   │   │   │   ├── StatusPanel.tsx       # Panel de controles
│   │   │   │   └── SystemStatus.tsx      # Estado del sistema
│   │   │   └── services/
│   │   │       ├── websocketService.ts   # Cliente WebSocket
│   │   │       ├── cameraService.ts      # Manejo de cámara
│   │   │       └── geminiLiveService.ts  # NO SE USA (viejo)
│   │   └── package.json
│   │
│   └── dashboard/                    # Dashboard (opcional, no se usa)
│
├── prisma/
│   ├── schema.prisma                 # Modelo de datos actualizado
│   └── migrations/                   # Migraciones aplicadas
│
├── seed-products.js                  # Seed de 8 productos
├── start.sh                          # Script de inicio
├── README.md                         # Documentación principal
├── COMO_USAR.md                      # Guía de uso
└── PROMPT_PARA_CURSOR.md             # Este prompt
```

---

## 🔧 CONFIGURACIÓN ACTUAL

### apps/api/.env:
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

### apps/web-camera/.env:
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

---

## 🎯 REQUERIMIENTOS FUNCIONALES

### 1. DETECCIÓN EN TIEMPO REAL (OBLIGATORIO):
- Streaming continuo a 2 fps
- Análisis automático de cada frame
- Detección aparece en UI en < 2 segundos
- Sin intervención manual después de "Iniciar"

### 2. GEMINI ROBOTICS-ER 1.5 (OBLIGATORIO):
- Modelo: `gemini-robotics-er-1.5-preview`
- API version: `v1beta`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent`
- Request body:
```json
{
  "contents": [{
    "parts": [
      {"inlineData": {"mimeType": "image/jpeg", "data": "base64_string"}},
      {"text": "prompt_aqui"}
    ]
  }],
  "generationConfig": {
    "temperature": 0.2,
    "thinkingConfig": {"thinkingBudget": 0}
  }
}
```

### 3. DETECCIÓN POR COLOR, FORMA Y TEXTO (OBLIGATORIO):
- **NO usar SKUs ni códigos de barras**
- Buscar por:
  - COLOR: roja, verde, azul, negra, amarilla, naranja, transparente
  - FORMA: lata cilíndrica, botella, bolsa
  - TEXTO: marcas visibles (Coca-Cola, Sprite, Pepsi, Lays, Doritos, Agua)

### 4. UI SIMPLIFICADA (OBLIGATORIO):
- Solo botón "▶ Iniciar Streaming" y "⏹ Detener Streaming"
- NO "Foto Manual", NO "Pausar"
- Streaming 100% automático

### 5. SERVER-SIDE PROCESSING (OBLIGATORIO):
- API key de Gemini SOLO en backend
- NUNCA en cliente
- Frames vía WebSocket al backend
- Backend llama a Gemini

---

## 📊 BASE DE DATOS (Neon PostgreSQL)

### Schema Prisma:

```prisma
model Product {
  productId          Int      @id @default(autoincrement())
  name               String
  visualDescription  String?
  detectionKeywords  String[]
  category           String?
  brand              String?
  
  detections         ProductDetection[]
}

model Scan {
  scanId       Int       @id @default(autoincrement())
  videoPath    String?
  startedAt    DateTime  @default(now())
  endedAt      DateTime?
  status       String    @default("recording")
  
  trolleyId    Int?
  operatorId   Int?
  
  trolley      Trolley?
  operator     User?
  detections   ProductDetection[]
}

model ProductDetection {
  detectionId   Int      @id @default(autoincrement())
  detectedAt    DateTime @default(now())
  confidence    Decimal?
  videoFrameId  String?
  
  scanId     Int
  productId  Int
  operatorId Int?
  
  scan       Scan
  product    Product
  operator   User?
}
```

### Datos Seeded:

**Users**:
- userId: 1, username: 'operator1', passwordHash: (bcrypt)

**Trolleys**:
- trolleyId: 1, trolleyCode: 'TRLLY-001'

**Products** (8 productos):
1. Coca-Cola 350ml
2. Coca-Cola Zero 350ml
3. Sprite 350ml
4. Pepsi 350ml
5. Agua Natural 500ml
6. Lays Original 100gr
7. Lays Queso 100gr
8. Doritos Nacho 100gr

---

## 🔌 WEBSOCKET API

### Cliente → Backend:

#### start_scan
```typescript
socket.emit('start_scan', {
  trolleyId: 123,
  operatorId: 456
}, (response) => {
  // response: {scanId: 39, status: 'recording'}
});
```

#### frame
```typescript
socket.emit('frame', {
  scanId: 39,
  frameId: 'frame_1_1730...',
  jpegBase64: 'base64_string_sin_prefijo',
  ts: 1730123456789
});
// Sin callback (fire and forget)
```

#### end_scan
```typescript
socket.emit('end_scan', {
  scanId: 39
}, (response) => {
  // response: {status: 'completed', endedAt: '2025-10-...'}
});
```

### Backend → Cliente:

#### product_detected
```typescript
socket.on('product_detected', (event) => {
  // event: {
  //   event: 'product_detected',
  //   trolley_id: 1,
  //   product_id: 1,
  //   product_name: 'Coca-Cola 350ml',
  //   detected_at: '2025-10-...',
  //   operator_id: 1,
  //   confidence: 0.92,
  //   box_2d: [350, 400, 650, 700]
  // }
});
```

---

## 🐛 PROBLEMA ACTUAL ESPECÍFICO

### Síntoma:
Web app muestra "Desconectado - WebSocket al servidor" en rojo.

### Logs en consola del navegador:
- NO muestra "[WebSocket] ✅ Conectado"
- Probablemente muestra error de conexión

### Verificado:
- ✅ Backend corriendo en puerto 3001
- ✅ Web app corriendo en puerto 3002
- ✅ `apps/web-camera/.env` existe con `VITE_WS_URL=ws://localhost:3001`
- ✅ Socket.IO CORS permite origen `*`
- ✅ Backend acepta conexiones sin token

### Posibles causas:
1. `LiveRecording.tsx` no llama a `initializeSession()` correctamente
2. `WebSocketService.connect()` tiene algún error
3. Código viejo cacheado en el navegador
4. CORS bloqueando WebSocket (poco probable)
5. Firewall del sistema (poco probable)

### Qué revisar PRIMERO:
1. Abrir consola del navegador (F12) y buscar errores de WebSocket
2. Verificar que `VITE_WS_URL` se esté leyendo correctamente
3. Verificar que `initializeSession()` se llame al hacer clic en "Iniciar"
4. Verificar que `io()` de socket.io-client esté importado correctamente

---

## 🔧 CÓDIGO CRÍTICO QUE DEBE FUNCIONAR

### Backend acepta conexiones (apps/api/routes/videoStream.js líneas 53-74):
```javascript
wsNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (token) {
    const user = verifyToken(token);
    socket.user = user || { userId: 0, username: 'guest', role: 'operator' };
  } else {
    socket.user = { userId: 0, username: 'guest', role: 'operator' };
  }
  
  next(); // DEBE permitir conexión
});
```

### Frontend conecta (apps/web-camera/src/services/websocketService.ts líneas 47-84):
```typescript
async connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    const baseUrl = this.config.url.replace(/\/ws$/i, '');
    
    this.socket = io(`${baseUrl}/ws`, {
      auth: this.config.token ? { token: this.config.token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] ✅ Conectado a', baseUrl);
      this.isConnected = true;
      this.config.onConnect?.();
      resolve();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] ❌ Error de conexión:', error);
      this.config.onError?.(error);
      reject(error);
    });
  });
}
```

### LiveRecording llama conexión (apps/web-camera/src/pages/LiveRecording.tsx):
```typescript
const handleStartRecording = async () => {
  if (!wsServiceRef.current || !scanIdRef.current) {
    await initializeSession(); // DEBE llamarse aquí
  }
  
  setIsRecording(true);
  setIsPaused(false);
};
```

---

## 📦 DEPENDENCIAS

### Backend (apps/api/package.json):
```json
{
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "ajv": "^8.12.0",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "fluent-ffmpeg": "^2.1.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "node-fetch": "^2.7.0",
    "pg": "^8.11.3",
    "sharp": "^0.33.2",
    "socket.io": "^4.7.5",
    "winston": "^3.11.0"
  }
}
```

### Frontend (apps/web-camera/package.json):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.5",
    "@google/generative-ai": "^0.1.3",  ← NO SE USA (viejo)
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0"
  }
}
```

---

## 🎬 FLUJO COMPLETO ESPERADO

### PASO 1: Usuario abre http://localhost:3002/
- LiveRecording.tsx se monta
- useEffect se ejecuta (NO auto-conecta)
- Log: "[LiveRecording] Componente montado. Esperando clic en Iniciar..."
- Estado: "Desconectado"

### PASO 2: Usuario hace clic en "▶ Iniciar Streaming"
- handleStartRecording() ejecuta
- Llama initializeSession()
- WebSocketService.connect() ejecuta
- Socket.IO conecta a ws://localhost:3001/ws
- Log: "[WebSocket] ✅ Conectado a ws://localhost:3001"
- Estado: "Backend conectado"

### PASO 3: WebSocket emite start_scan
- Payload: {trolleyId: 123, operatorId: 456}
- Backend verifica IDs → usa trolley 1 y operator 1
- Backend crea Scan en BD
- Backend retorna {scanId: 39, status: 'recording'}
- Frontend guarda scanId en scanIdRef

### PASO 4: Streaming inicia automáticamente
- setIsRecording(true)
- CameraView recibe isStreaming=true
- useEffect detecta cambio y llama startCapture(500)
- Log: "[CameraView] 🎬 Streaming iniciado a 2 fps"

### PASO 5: Captura continua cada 500ms
- CameraService captura frame del video
- Dibuja en canvas 640x360
- Convierte a base64 JPEG
- Llama handleFrameCapture(imageData)

### PASO 6: Envío de frame al backend
- wsService.sendFrame({scanId, frameId, jpegBase64, ts})
- Log: "[LiveRecording] 📡 Frame X enviado al backend"

### PASO 7: Backend procesa frame
- Recibe evento 'frame'
- Verifica scan activo
- Obtiene catálogo (8 productos)
- Llama geminiService.analyzeFrame()

### PASO 8: Gemini analiza
- POST a Gemini REST API
- Prompt con 8 productos
- Busca por COLOR, FORMA, TEXTO
- Retorna JSON: {detected, product_name, confidence, box_2d}

### PASO 9: Backend valida
- Confidence >= 0.70
- Producto en catálogo
- No en cooldown
- INSERT en ProductDetection

### PASO 10: Backend emite detección
- socket.emit('product_detected', {...})
- Log: "[WS] Product detected: Coca-Cola 350ml (confidence: 0.92)"

### PASO 11: Frontend recibe y muestra
- handleProductDetected() ejecuta
- setDetections() actualiza estado
- DetectionFeed muestra producto
- Contador incrementa

---

## 🚨 PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema 1: Código viejo en nodemon
**Síntoma**: Logs muestran errores en línea 86 pero código actual tiene validaciones en línea 112
**Solución**: Matar nodemon, limpiar cache, reiniciar

### Problema 2: Múltiples procesos corriendo
**Síntoma**: Hay proceso viejo interfiriendo
**Solución**: `killall -9 node nodemon vite` y reiniciar con `./start.sh`

### Problema 3: .env no cargado en Vite
**Síntoma**: `import.meta.env.VITE_WS_URL` es undefined
**Solución**: Crear `.env` en `apps/web-camera/`, reiniciar Vite, hard refresh

### Problema 4: Socket.IO version mismatch
**Síntoma**: Cliente y servidor usan versiones incompatibles
**Solución**: Ambos deben usar socket.io v4.7.5

### Problema 5: CORS bloqueando WebSocket
**Síntoma**: Error de CORS en consola
**Solución**: Backend tiene `cors: {origin: '*'}` pero verificar

---

## 🎯 COMANDOS PARA DEBUGGING

```bash
# Matar TODO
killall -9 node nodemon vite

# Limpiar cache de npm
rm -rf apps/api/node_modules/.cache
rm -rf apps/web-camera/node_modules/.cache

# Verificar procesos corriendo
ps aux | grep -E "node|vite" | grep -v grep

# Ver logs en tiempo real
tail -f logs/backend.log

# Verificar que backend responda
curl http://localhost:3001

# Verificar que web app responda
curl http://localhost:3002

# Verificar DB
npx prisma studio
# Ir a tabla 'products' y verificar 8 productos
# Ir a tabla 'users' y verificar 'operator1'
# Ir a tabla 'trolleys' y verificar trolley ID 1

# Reiniciar limpiamente
./start.sh
```

---

## ✅ ESTADO VERIFICADO

### Backend:
- ✅ Corriendo en puerto 3001
- ✅ Modelo: gemini-robotics-er-1.5-preview
- ✅ WebSocket namespace /ws activo
- ✅ CORS permite *
- ✅ Auth opcional (guest mode)
- ✅ Auto-manejo de trolley/operator IDs

### Frontend:
- ✅ Corriendo en puerto 3002
- ✅ Tiene .env con VITE_WS_URL
- ❌ NO conecta a WebSocket
- ❌ Estado permanece "Desconectado"

### Base de Datos:
- ✅ Conectada (Neon PostgreSQL)
- ✅ 8 productos seeded
- ✅ 1 usuario (operator1)
- ✅ 1 trolley (TRLLY-001)

---

## 🎯 OBJETIVO PARA EL PRÓXIMO CHAT

**ARREGLAR LA CONEXIÓN WEBSOCKET** para que:

1. Al abrir http://localhost:3002/, el WebSocket se conecte automáticamente (o al hacer clic en "Iniciar")
2. Estado cambie de "Desconectado" a "Backend conectado"
3. Al hacer clic en "Iniciar Streaming", todo funcione automáticamente:
   - Sesión se crea
   - Streaming inicia a 2 fps
   - Frames se envían
   - Gemini analiza
   - Detecciones aparecen

**SIN hardcodear nada** - Todo debe venir de .env y configuraciones.

---

## 📝 PROMPT ESPECÍFICO PARA CURSOR

```
ROLE: WebSocket Debugging Expert en Cursor.

PROBLEMA: Web app React (puerto 3002) no conecta a WebSocket del backend (puerto 3001). 
Muestra "Desconectado - WebSocket al servidor" aunque backend está corriendo correctamente.

OBJETIVO: Arreglar la conexión WebSocket para que el sistema de detección en tiempo real funcione.

CONTEXTO:
- Backend: Node.js + Express + Socket.IO en puerto 3001
- Frontend: React + Vite + TypeScript en puerto 3002
- WebSocket namespace: /ws
- .env existe en ambos lados con configuración correcta
- Backend acepta conexiones sin token (guest mode)

ARCHIVOS CLAVE:
- apps/web-camera/src/pages/LiveRecording.tsx (componente principal)
- apps/web-camera/src/services/websocketService.ts (cliente WebSocket)
- apps/api/src/index.js (servidor con Socket.IO)
- apps/api/routes/videoStream.js (handlers WebSocket)

REQUERIMIENTOS:
1. WebSocket debe conectar desde ws://localhost:3001/ws
2. Conexión debe ser automática al hacer clic en "Iniciar Streaming"
3. No debe requerir token (guest mode)
4. Debe funcionar con CORS permitiendo cualquier origen
5. Logs de consola deben mostrar "WebSocket Conectado"

DEBUGGING:
1. Abre consola del navegador (F12) en http://localhost:3002/
2. Busca errores de WebSocket o Socket.IO
3. Verifica que VITE_WS_URL se lea correctamente
4. Verifica que Socket.IO cliente se importe correctamente
5. Asegura que no hay código viejo cacheado

SOLUCIÓN ESPERADA:
Al hacer clic en "Iniciar Streaming", debe mostrar en consola:
[WebSocket] ✅ Conectado a ws://localhost:3001
[WebSocket] ✅ Scan iniciado: {scanId: X}
Y el estado debe cambiar a "Backend conectado" (verde).

INICIA el debugging AHORA y arregla la conexión WebSocket.
```

---

**ESTE DOCUMENTO CONTIENE TODO EL CONTEXTO.**

Usa `PROMPT_PARA_CURSOR.md` para el próximo chat.

