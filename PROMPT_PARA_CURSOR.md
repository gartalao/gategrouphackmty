# PROMPT PARA CURSOR - Arreglar Detección en Tiempo Real con Gemini

## CONTEXTO DEL PROYECTO

Sistema de detección visual de productos en tiempo real para trolleys de catering aéreo usando **Gemini Robotics-ER 1.5**.

**Branch actual**: `api-streaming-functional`

---

## PROBLEMA ACTUAL

La web app (http://localhost:3002) muestra **"Desconectado - Sin conexión al servidor"** aunque:
- ✅ Backend está corriendo en puerto 3001
- ✅ Web app está corriendo en puerto 3002
- ✅ Archivos .env existen
- ❌ WebSocket NO se conecta desde el frontend

---

## ARQUITECTURA ACTUAL

```
🌐 Web Camera App (React + Vite + TypeScript)
  Puerto: 3002
  Ruta: apps/web-camera/
  
    ↓ WebSocket (2 fps)
    
🔧 Backend API (Node.js + Express + Socket.IO)
  Puerto: 3001
  Ruta: apps/api/
  WebSocket namespace: /ws
  
    ↓ REST API v1beta
    
🤖 Gemini Robotics-ER 1.5
  Modelo: gemini-robotics-er-1.5-preview
  
    ↓ JSON Response
    
🗄️ PostgreSQL (Neon)
  Modelo: ProductDetection, Scan, Product, User, Trolley
```

---

## ARCHIVOS CLAVE

### Backend (Node.js):

**`apps/api/src/index.js`**:
- Servidor Express + Socket.IO
- Namespace: `/ws`
- CORS configurado para `*`
- Puerto: 3001

**`apps/api/routes/videoStream.js`**:
- WebSocket events: `start_scan`, `frame`, `end_scan`
- Emit: `product_detected`
- Auth: Opcional (guest mode)
- Auto-maneja trolleyId y operatorId inexistentes

**`apps/api/services/geminiService.js`**:
- Modelo FORZADO: `gemini-robotics-er-1.5-preview`
- REST API: `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent`
- Prompt optimizado para COLOR, FORMA y TEXTO
- Thinking budget: 0 (latencia mínima)

**`apps/api/.env`**:
```env
DATABASE_URL="postgresql://neondb_owner:npg_drmFEg6auN9C@ep-little-forest-adbtr9zw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-robotics-er-1.5-preview
PORT=3001
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
```

### Frontend (React + TypeScript):

**`apps/web-camera/src/pages/LiveRecording.tsx`**:
- Componente principal de grabación
- useEffect NO auto-inicializa (espera clic en "Iniciar")
- Función `initializeSession()` conecta WebSocket
- Función `handleFrameCapture()` envía frames
- Función `handleProductDetected()` recibe detecciones

**`apps/web-camera/src/services/websocketService.ts`**:
- Cliente Socket.IO
- Conecta a `${WS_URL}/ws`
- Métodos: connect(), startScan(), sendFrame(), endScan()
- Listeners: 'product_detected'

**`apps/web-camera/.env`**:
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

### Base de Datos:

**`prisma/schema.prisma`**:
- Product (con visualDescription y detectionKeywords)
- Scan (con trolleyId, operatorId, startedAt, endedAt)
- ProductDetection (scanId, productId, confidence, detectedAt)
- User, Trolley, Flight, FlightRequirement

**`seed-products.js`**:
- 8 productos con visual descriptions:
  - Coca-Cola 350ml, Coca-Cola Zero 350ml, Sprite 350ml, Pepsi 350ml
  - Agua Natural 500ml
  - Lays Original 100gr, Lays Queso 100gr, Doritos Nacho 100gr

---

## ESTADO ACTUAL DEL SISTEMA

### Backend (FUNCIONANDO):
```
✅ Server running on http://localhost:3001
✅ WebSocket available at ws://localhost:3001/ws
✅ Gemini Mode: 🤖 REAL (Production)
✅ Database: 🟢 Connected
[Gemini] Configurado con modelo: gemini-robotics-er-1.5-preview
[Gemini] URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent
```

### Frontend (CARGA PERO NO CONECTA):
```
❌ Estado: "Desconectado - WebSocket al servidor"
❌ Botón "Iniciar Streaming" deshabilitado
❌ No se conecta a ws://localhost:3001/ws
```

---

## REQUERIMIENTOS CRÍTICOS

### 1. DETECCIÓN EN TIEMPO REAL (OBLIGATORIO):
- Al hacer clic en "Iniciar Streaming", debe conectarse automáticamente
- Streaming continuo a 2 fps (cada 500ms)
- Frames se envían automáticamente al backend
- Backend analiza con Gemini automáticamente
- Detecciones aparecen automáticamente en UI

### 2. GEMINI ROBOTICS-ER 1.5 (OBLIGATORIO):
- Modelo: `gemini-robotics-er-1.5-preview`
- API version: v1beta
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent`
- Thinking budget: 0
- Temperature: 0.2

### 3. DETECCIÓN POR COLOR, FORMA Y TEXTO (OBLIGATORIO):
- Prompt debe buscar activamente por COLOR (roja, verde, azul, negra, amarilla, naranja)
- Prompt debe buscar por FORMA (latas cilíndricas, botellas, bolsas)
- Prompt debe buscar por TEXTO visible (Coca-Cola, Sprite, Pepsi, Lays, Doritos, Agua)
- NO usar SKUs ni códigos de barras

### 4. UI SIMPLIFICADA (OBLIGATORIO):
- Solo botón "▶ Iniciar Streaming" / "⏹ Detener Streaming"
- NO botones de "Foto Manual" ni "Pausar"
- Streaming 100% automático después del clic

### 5. SERVER-SIDE PROCESSING (OBLIGATORIO):
- API key de Gemini SOLO en backend
- Frames se envían al backend vía WebSocket
- Backend llama a Gemini REST API
- NUNCA exponer API key en cliente

---

## TAREAS PARA ARREGLAR

### 1. Verificar y Arreglar WebSocket Connection

**Problema**: Frontend no conecta a `ws://localhost:3001/ws`

**Archivos a revisar**:
- `apps/web-camera/src/pages/LiveRecording.tsx` líneas 47-95
- `apps/web-camera/src/services/websocketService.ts` líneas 47-84
- `apps/api/src/index.js` líneas 12-19 (configuración Socket.IO)
- `apps/api/routes/videoStream.js` líneas 50-74 (middleware de auth)

**Verificar**:
1. ¿Se llama `initializeSession()` al montar el componente?
2. ¿El WebSocketService conecta correctamente?
3. ¿Hay errores en consola del navegador?
4. ¿El CORS está configurado para permitir conexión?
5. ¿El auth middleware permite conexión sin token?

**Solución esperada**:
- LiveRecording debe llamar a `initializeSession()` al hacer clic en "Iniciar"
- WebSocket debe conectar a `ws://localhost:3001/ws`
- Backend debe aceptar conexión sin token (guest mode)
- Estado debe cambiar a "Backend conectado" (verde)

### 2. Asegurar Auto-Inicio de Streaming

**Problema**: Después de conectar, el streaming no inicia automáticamente

**Archivos a revisar**:
- `apps/web-camera/src/pages/LiveRecording.tsx` líneas 155-164 (`handleStartRecording`)
- `apps/web-camera/src/components/CameraView.tsx` líneas 35-42 (useEffect para isStreaming)

**Verificar**:
1. ¿`handleStartRecording` llama a `initializeSession()`?
2. ¿`CameraView` recibe prop `isStreaming`?
3. ¿El useEffect de CameraView inicia captura cuando `isStreaming` es true?

**Solución esperada**:
- Al hacer clic en "Iniciar", llama `initializeSession()`
- Conecta WebSocket
- Llama `startScan()` y obtiene scanId
- `setIsRecording(true)` activa CameraView
- CameraView inicia streaming a 2 fps automáticamente

### 3. Verificar Backend Procesamiento

**Problema**: Backend recibe frames pero puede estar fallando

**Archivos a revisar**:
- `apps/api/routes/videoStream.js` líneas 159-247 (evento 'frame')
- `apps/api/services/geminiService.js` líneas 78-130 (analyzeFrameReal)

**Verificar**:
1. ¿El evento 'frame' se está recibiendo?
2. ¿Gemini API se llama correctamente?
3. ¿Hay errores 404 del modelo?
4. ¿El parseo JSON funciona?

**Logs esperados del backend**:
```
[WS] User guest connected
[WS] Scan X started for trolley 1
[WS] Frame received: frame_1_...
[WS] Product detected: Coca-Cola 350ml (confidence: 0.92)
```

### 4. Limpiar Código Viejo y Cache

**Problema**: Puede haber código viejo cacheado

**Acciones**:
1. Eliminar `node_modules/.cache/` en ambas apps
2. Reiniciar con `killall -9 node nodemon vite`
3. npm install en ambas apps
4. Verificar que no haya archivos duplicados (.ts y .js del mismo archivo)

---

## PRODUCTOS PARA DETECTAR

Base de datos tiene 8 productos:

```javascript
[
  {
    name: 'Coca-Cola 350ml',
    visualDescription: 'Lata roja con logo blanco de Coca-Cola',
    detectionKeywords: ['coca', 'cola', 'lata roja', 'logo blanco']
  },
  {
    name: 'Coca-Cola Zero 350ml',
    visualDescription: 'Lata negra con logo rojo y plata de Coca-Cola Zero',
    detectionKeywords: ['coca', 'zero', 'lata negra']
  },
  {
    name: 'Sprite 350ml',
    visualDescription: 'Lata verde con logo Sprite en blanco y amarillo',
    detectionKeywords: ['sprite', 'lata verde', 'limón']
  },
  {
    name: 'Pepsi 350ml',
    visualDescription: 'Lata azul con logo blanco de Pepsi',
    detectionKeywords: ['pepsi', 'lata azul']
  },
  {
    name: 'Agua Natural 500ml',
    visualDescription: 'Botella de plástico transparente con agua',
    detectionKeywords: ['agua', 'botella transparente']
  },
  {
    name: 'Lays Original 100gr',
    visualDescription: 'Bolsa de papas amarilla con logo rojo Lays',
    detectionKeywords: ['lays', 'bolsa amarilla', 'papas']
  },
  {
    name: 'Lays Queso 100gr',
    visualDescription: 'Bolsa de papas naranja con logo rojo Lays sabor queso',
    detectionKeywords: ['lays', 'queso', 'bolsa naranja']
  },
  {
    name: 'Doritos Nacho 100gr',
    visualDescription: 'Bolsa roja con triángulos amarillos, logo Doritos',
    detectionKeywords: ['doritos', 'bolsa roja', 'nacho']
  }
]
```

---

## FLUJO ESPERADO (E2E)

```
1. Usuario abre http://localhost:3002/
   ↓
2. LiveRecording.tsx se monta
   - NO auto-conecta (espera clic en "Iniciar")
   - Estado: "Desconectado"
   ↓
3. Usuario hace clic en "▶ Iniciar Streaming"
   ↓
4. handleStartRecording() ejecuta:
   - Llama initializeSession()
   - WebSocket conecta a ws://localhost:3001/ws
   - Backend acepta (no requiere token)
   ✅ Estado cambia a "Backend conectado"
   ↓
5. WebSocket emite 'start_scan' {trolleyId: 123, operatorId: 456}
   - Backend verifica trolley → usa trolley 1
   - Backend verifica operator → usa operator 1
   - Backend crea Scan
   ✅ Retorna {scanId: X, status: 'recording'}
   ↓
6. Frontend recibe scanId
   - scanIdRef.current = scanId
   - setIsRecording(true)
   ✅ CameraView recibe isStreaming=true
   ↓
7. CameraView useEffect detecta isStreaming=true
   - Llama cameraService.startCapture(500)
   ✅ Inicia streaming a 2 fps
   ↓
8. Cada 500ms automáticamente:
   - Captura frame del video
   - Convierte a base64 JPEG
   - Llama handleFrameCapture(imageData)
   ↓
9. handleFrameCapture():
   - Extrae base64 sin prefijo
   - wsService.sendFrame({scanId, frameId, jpegBase64, ts})
   ✅ Frame enviado al backend
   ↓
10. Backend recibe evento 'frame':
    - Verifica scan activo
    - Obtiene catálogo de productos (8 productos)
    - Llama analyzeFrame(jpegBase64, products, {threshold: 0.70})
    ↓
11. analyzeFrame() en geminiService:
    - Construye prompt con 8 productos
    - POST a Gemini REST API
    - URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent
    - Body: {contents, generationConfig: {temperature: 0.2, thinkingConfig: {thinkingBudget: 0}}}
    ↓
12. Gemini analiza (~1-1.5s):
    - Busca productos por COLOR, FORMA y TEXTO
    - Retorna: {detected, product_name, confidence, action, box_2d}
    ↓
13. Backend valida resultado:
    - detected === true
    - product_name existe en catálogo
    - confidence >= 0.70
    - No en cooldown (1200ms)
    ↓
14. Backend INSERT ProductDetection
    ↓
15. Backend emit 'product_detected':
    - {trolley_id, product_id, product_name, detected_at, confidence, box_2d}
    ↓
16. Frontend recibe evento 'product_detected':
    - handleProductDetected()
    - setDetections([newDetection, ...prev])
    ✅ DetectionFeed muestra producto

LATENCIA TOTAL: ~1-2 segundos
```

---

## CONFIGURACIÓN ACTUAL

### Variables de Entorno (apps/api/.env):
```env
DATABASE_URL="postgresql://neondb_owner:npg_drmFEg6auN9C@ep-little-forest-adbtr9zw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-robotics-er-1.5-preview
GEMINI_FAKE=0
PORT=3001
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
JWT_SECRET=smart-trolley-secret-change-in-production
```

### Variables de Entorno (apps/web-camera/.env):
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

---

## CÓDIGO ACTUAL RELEVANTE

### WebSocket Backend (apps/api/src/index.js):
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: '*',  // Permite cualquier origen
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 10e6,
});

initializeVideoStream(io); // Inicializa namespace /ws
```

### WebSocket Namespace (apps/api/routes/videoStream.js):
```javascript
function initializeVideoStream(io) {
  const wsNamespace = io.of('/ws');

  wsNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (token) {
      const user = verifyToken(token);
      socket.user = user || { userId: 0, username: 'guest', role: 'operator' };
    } else {
      // Sin token, usar guest (DEV MODE)
      socket.user = { userId: 0, username: 'guest', role: 'operator' };
    }
    
    next(); // PERMITE conexión
  });

  wsNamespace.on('connection', (socket) => {
    console.log(`[WS] User ${socket.user.username} connected (${socket.id})`);
    
    // Eventos: start_scan, frame, end_scan
  });
}
```

### WebSocket Cliente (apps/web-camera/src/services/websocketService.ts):
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

    this.socket.on('product_detected', (event: ProductDetectedEvent) => {
      console.log('[WebSocket] 🎯 Producto detectado:', event.product_name);
      this.config.onProductDetected?.(event);
    });
  });
}
```

### LiveRecording (apps/web-camera/src/pages/LiveRecording.tsx):
```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

useEffect(() => {
  // NO auto-iniciar, esperar clic en "Iniciar"
  console.log('[LiveRecording] Componente montado. Esperando clic en Iniciar...');
  
  return () => {
    cleanup();
  };
}, []);

const initializeSession = async () => {
  try {
    console.log('[LiveRecording] 🚀 Conectando al backend vía WebSocket...');
    
    const wsService = new WebSocketService({
      url: WS_URL,
      onConnect: () => {
        console.log('[LiveRecording] ✅ WebSocket conectado');
        setBackendStatus('connected');
      },
      onDisconnect: () => {
        console.log('[LiveRecording] ❌ WebSocket desconectado');
        setBackendStatus('disconnected');
      },
      onProductDetected: handleProductDetected,
    });

    await wsService.connect();
    wsServiceRef.current = wsService;

    const response = await wsService.startScan({
      trolleyId: trolleyId || 1,
      operatorId: operatorId || 1,
    });

    scanIdRef.current = response.scanId;
    setScanId(response.scanId);
    setIsConnected(true);
    
    console.log(`[LiveRecording] ✅ Sesión iniciada. Scan ID: ${response.scanId}`);
  } catch (error) {
    console.error('[LiveRecording] ❌ Error inicializando:', error);
    setError(`Error al conectar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    setBackendStatus('error');
  }
};

const handleStartRecording = async () => {
  if (!wsServiceRef.current || !scanIdRef.current) {
    await initializeSession();
  }
  
  setIsRecording(true);
  setIsPaused(false);
  console.log('[LiveRecording] ▶ Streaming AUTOMÁTICO iniciado');
};
```

---

## DEBUGGING

### Logs esperados en consola del navegador (F12):

**Al cargar página**:
```
[LiveRecording] Componente montado. Esperando clic en Iniciar...
```

**Al hacer clic en "Iniciar"**:
```
[LiveRecording] 🚀 Conectando al backend vía WebSocket...
[WebSocket] ✅ Conectado a ws://localhost:3001
[LiveRecording] ✅ WebSocket conectado
[WebSocket] 📡 Enviando start_scan: {trolleyId: 1, operatorId: 1}
[WebSocket] ✅ Scan iniciado: {scanId: 39, status: 'recording'}
[LiveRecording] ✅ Sesión iniciada. Scan ID: 39
[LiveRecording] ▶ Streaming AUTOMÁTICO iniciado
[CameraView] 🎬 Streaming iniciado a 2 fps
[LiveRecording] 📸 Frame 1 capturado...
[LiveRecording] 📡 Frame 1 enviado al backend
```

### Logs esperados en backend (terminal):

```
[Gemini] Configurado con modelo: gemini-robotics-er-1.5-preview
[Gemini] URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent
✅ Server running on http://localhost:3001
✅ WebSocket available at ws://localhost:3001/ws
[WS] No token provided, using guest user (dev mode)
[WS] User guest connected (abc123)
[WS] Trolley 1 no existe, usando trolley por defecto (si aplica)
[WS] Scan 39 started for trolley 1
[WS] Frame received: frame_1_...
[WS] Product detected: Coca-Cola 350ml (confidence: 0.92)
```

---

## PROMPT DE GEMINI ACTUAL

```javascript
function buildPrompt(catalog) {
  return `Eres un sistema de visión EN TIEMPO REAL para detección de productos en trolleys de catering aéreo.

TAREA:
Analiza este FRAME y detecta CUALQUIER producto visible de la lista. BUSCA ACTIVAMENTE por COLOR, FORMA y TEXTO del producto.

PRODUCTOS A DETECTAR (bebidas y snacks de avión):
1. Coca-Cola 350ml — Lata roja con logo blanco de Coca-Cola — keywords: coca, cola, lata roja, logo blanco
2. Coca-Cola Zero 350ml — Lata negra con logo rojo y plata de Coca-Cola Zero — keywords: coca, zero, lata negra
3. Sprite 350ml — Lata verde con logo Sprite en blanco y amarillo — keywords: sprite, lata verde, limón
4. Pepsi 350ml — Lata azul con logo blanco de Pepsi — keywords: pepsi, lata azul
5. Agua Natural 500ml — Botella de plástico transparente con agua — keywords: agua, botella transparente
6. Lays Original 100gr — Bolsa de papas amarilla con logo rojo Lays — keywords: lays, bolsa amarilla, papas
7. Lays Queso 100gr — Bolsa de papas naranja con logo rojo Lays sabor queso — keywords: lays, queso, bolsa naranja
8. Doritos Nacho 100gr — Bolsa roja con triángulos amarillos, logo Doritos — keywords: doritos, bolsa roja, nacho

INSTRUCCIONES CRÍTICAS:
1. BUSCA por COLOR primero (lata roja, lata verde, lata azul, lata negra, bolsa amarilla, bolsa naranja, bolsa roja)
2. BUSCA por FORMA (latas cilíndricas, botellas, bolsas de papas)
3. BUSCA por TEXTO VISIBLE (Coca-Cola, Sprite, Pepsi, Lays, Doritos, Agua)
4. NO uses códigos de barras ni SKUs
5. Si VES el producto en la imagen, marca detected:true
6. Si puedes, devuelve "box_2d": [ymin, xmin, ymax, xmax] normalizado 0-1000
7. Respuesta JSON ESTRICTA sin code fences

FORMATO DE RESPUESTA (SOLO JSON):
{ "detected": true|false, "product_name": "<nombre_exacto_del_producto>", "confidence": 0.0-1.0, "action": "placing_in_trolley", "box_2d": [ymin, xmin, ymax, xmax] }

Si NO ves ningún producto de la lista:
{ "detected": false }`;
}
```

---

## COMANDOS PARA EJECUTAR

### Ver logs en tiempo real:
```bash
# Terminal 1
tail -f logs/backend.log

# Terminal 2  
tail -f logs/webcam.log
```

### Verificar servicios:
```bash
curl http://localhost:3001
curl http://localhost:3002
```

### Reiniciar todo:
```bash
killall -9 node nodemon vite
sleep 2
./start.sh
```

---

## CHECKLIST DE VERIFICACIÓN

- [ ] Backend corriendo en puerto 3001
- [ ] Web app corriendo en puerto 3002
- [ ] `apps/api/.env` existe con GEMINI_API_KEY
- [ ] `apps/web-camera/.env` existe con VITE_WS_URL
- [ ] Base de datos tiene 8 productos (verificar con `npx prisma studio`)
- [ ] Usuario `operator1` existe en DB
- [ ] Trolley con ID 1 existe en DB
- [ ] geminiService.js usa `gemini-robotics-er-1.5-preview`
- [ ] Socket.IO CORS permite origen `*`
- [ ] WebSocket namespace es `/ws`
- [ ] Frontend conecta a `ws://localhost:3001/ws`

---

## OBJETIVO FINAL

**Al hacer clic en "▶ Iniciar Streaming"**:

1. WebSocket conecta a backend ✅
2. Sesión se crea en BD ✅
3. Streaming inicia a 2 fps ✅
4. Frames se envían automáticamente ✅
5. Backend analiza con Gemini ✅
6. Detecciones aparecen en UI en ~1-2s ✅
7. Usuario muestra Coca-Cola → aparece "Coca-Cola 350ml" ✅

**TODO AUTOMÁTICO después del clic inicial.**

---

## SOLUCIONES A INTENTAR

### 1. Problema de Conexión WebSocket:

Si frontend no conecta:

a) Verificar que LiveRecording llame a `initializeSession()` al hacer clic:
```typescript
const handleStartRecording = async () => {
  // Debe llamar esto si no está conectado
  if (!wsServiceRef.current || !scanIdRef.current) {
    await initializeSession();
  }
  setIsRecording(true);
};
```

b) Verificar que WebSocketService construya URL correcta:
```typescript
const baseUrl = this.config.url.replace(/\/ws$/i, ''); // ws://localhost:3001
this.socket = io(`${baseUrl}/ws`, {...}); // ws://localhost:3001/ws
```

c) Verificar CORS en backend:
```javascript
cors: {
  origin: '*', // Debe permitir cualquier origen
  methods: ['GET', 'POST'],
}
```

### 2. Problema de Foreign Keys:

Si backend falla al crear scan:

a) Verificar que videoStream.js tenga el código de auto-manejo:
```javascript
if (trolleyId) {
  const trolleyExists = await prisma.trolley.findUnique({where: {trolleyId}});
  if (!trolleyExists) {
    let defaultTrolley = await prisma.trolley.findFirst();
    trolleyId = defaultTrolley.trolleyId;
  }
}

if (operatorId) {
  const operatorExists = await prisma.user.findUnique({where: {userId: operatorId}});
  if (!operatorExists) {
    let defaultOperator = await prisma.user.findFirst();
    operatorId = defaultOperator.userId;
  }
}
```

b) Ejecutar seed para asegurar datos:
```bash
node seed-products.js
```

### 3. Problema de Gemini Model:

Si backend tiene error 404:

a) Verificar que geminiService.js tenga:
```javascript
const GEMINI_MODEL = 'gemini-robotics-er-1.5-preview'; // FORZADO
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
```

b) Verificar logs del backend para confirmar modelo:
```
[Gemini] Configurado con modelo: gemini-robotics-er-1.5-preview
```

---

## RESULTADO ESPERADO

Después de hacer clic en "Iniciar Streaming":

```
Estado del Sistema:
✅ Gemini AI: Analizando... (azul pulsando)
✅ Streaming: Backend conectado (verde)
✅ Frames: 5, 6, 7... (incrementando cada 500ms)
✅ Detecciones: 0 → 1 → 2... (al mostrar productos)
✅ Cámara: Overlay "Grabando..."

Productos Detectados:
┌─────────────────────────────┐
│ Coca-Cola 350ml        92%  │
│ 3:58:45 PM                  │
└─────────────────────────────┘
```

---

## COMANDOS PARA DEBUGGING

```bash
# Ver si backend responde
curl http://localhost:3001

# Ver si web app responde
curl http://localhost:3002

# Ver productos en BD
npx prisma studio
# Ir a tabla 'products' y verificar 8 productos

# Ver logs en tiempo real
tail -f logs/backend.log

# Reiniciar todo limpiamente
killall -9 node nodemon vite
./start.sh
```

---

## PRIORIDADES

1. **CRÍTICO**: WebSocket debe conectar desde frontend a backend
2. **CRÍTICO**: Streaming debe iniciar automáticamente al hacer clic
3. **CRÍTICO**: Gemini debe usar modelo `gemini-robotics-er-1.5-preview`
4. **IMPORTANTE**: Detección debe ser por COLOR, FORMA y TEXTO
5. **IMPORTANTE**: UI solo con botón Iniciar/Detener

---

**BRANCH**: `api-streaming-functional`  
**ESTADO**: Backend OK, Frontend no conecta WebSocket  
**OBJETIVO**: Detección en tiempo real 100% automática con Gemini Robotics-ER 1.5

