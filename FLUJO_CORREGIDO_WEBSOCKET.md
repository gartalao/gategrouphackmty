# ✅ FLUJO CORREGIDO - WebSocket Server-Side Processing

## 🔧 PROBLEMA ARREGLADO

### ❌ ANTES (INCORRECTO):
```
Web App → Gemini API directamente
  ↓
Expone API key en cliente (INSEGURO)
Modelo incorrecto (gemini-1.5-flash)
API version incorrecta (v1 en lugar de v1beta)
```

### ✅ AHORA (CORRECTO):
```
Web App → WebSocket → Backend → Gemini REST API
  ↓
API key solo en backend (SEGURO)
Modelo correcto (gemini-robotics-er-1.5-preview)
API version correcta (v1beta)
```

---

## 🔄 FLUJO COMPLETO IMPLEMENTADO

### 1. Web App (http://localhost:3003)

```typescript
// LiveRecording.tsx
useEffect(() => {
  // 1. Conectar a WebSocket del backend
  const wsService = new WebSocketService({
    url: 'ws://localhost:3001',
    onProductDetected: handleProductDetected
  });
  
  await wsService.connect();
  
  // 2. Iniciar sesión de scan
  const response = await wsService.startScan({
    trolleyId: 1,
    operatorId: 1
  });
  
  scanId = response.scanId; // Ej: 5
});

// Cada 500ms (2 fps):
handleFrameCapture(imageData) {
  const base64 = imageData.split(',')[1]; // Sin prefijo
  
  // 3. Enviar frame al backend
  wsService.sendFrame({
    scanId: 5,
    frameId: 'frame_1_1730...',
    jpegBase64: base64,
    ts: Date.now()
  });
}

// Cuando el backend detecta algo:
onProductDetected(event) {
  // 4. Recibir detección del backend
  console.log('Producto:', event.product_name);
  setDetections([...detections, event]);
}
```

### 2. Backend API (http://localhost:3001)

```javascript
// routes/videoStream.js
socket.on('frame', async (payload) => {
  const { scanId, frameId, jpegBase64 } = payload;
  
  // 1. Obtener catálogo de productos de BD
  const products = await prisma.product.findMany({
    select: { productId, name, visualDescription, detectionKeywords }
  });
  
  // 2. Llamar a Gemini REST API (server-side)
  const result = await analyzeFrame(jpegBase64, products, {
    threshold: 0.70
  });
  
  // 3. Si detectó algo:
  if (result.detected && result.product_name) {
    // 4. Guardar en BD
    const detection = await prisma.productDetection.create({
      data: {
        scanId,
        productId,
        confidence: result.confidence,
        videoFrameId: frameId
      }
    });
    
    // 5. Emitir evento al cliente
    socket.emit('product_detected', {
      event: 'product_detected',
      trolley_id: scan.trolleyId,
      product_id: productId,
      product_name: product.name,
      detected_at: detection.detectedAt,
      confidence: result.confidence,
      box_2d: result.box_2d
    });
  }
});
```

### 3. Gemini Service (Backend)

```javascript
// services/geminiService.js
async function analyzeFrameReal(jpegBase64, catalog, opts) {
  const prompt = buildPrompt(catalog); // Con 8 productos
  
  // Llamada REST a Gemini Robotics-ER 1.5
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    }
  );
  
  const json = await response.json();
  const text = json.candidates[0].content.parts.map(p => p.text).join('');
  
  // Parseo robusto
  const parsed = safeParseDetection(text);
  
  return parsed; // { detected, product_name, confidence, action, box_2d }
}
```

---

## 🎯 CAMBIOS REALIZADOS

### Web App (`apps/web-camera/src/`):

1. ✅ **LiveRecording.tsx** - Cambiado a WebSocket
   - Ya NO llama directamente a Gemini
   - Envía frames al backend vía `wsService.sendFrame()`
   - Escucha `product_detected` del backend

2. ✅ **websocketService.ts** - Actualizado
   - Constructor simplificado (token opcional)
   - Método `sendFrame()` fire-and-forget
   - Listener `product_detected` configurado

### Backend (`apps/api/`):

3. ✅ **services/geminiService.js** - REST API
   - URL correcta: `/v1beta/models/gemini-robotics-er-1.5-preview`
   - Thinking budget 0 (latencia mínima)
   - Parseo robusto de JSON

4. ✅ **routes/videoStream.js** - Ya funcional
   - Recibe frames vía WebSocket
   - Llama a Gemini server-side
   - Emite `product_detected`

---

## 🚀 TESTING AHORA

### 1. Recargar navegador:
```
http://localhost:3003/
```

Presiona **Ctrl+Shift+R** (hard reload)

### 2. Ver consola del navegador (F12):

Deberías ver:
```
[LiveRecording] 🚀 Conectando al backend vía WebSocket...
[WebSocket] ✅ Conectado a http://localhost:3001
[WebSocket] 📡 Enviando start_scan: {trolleyId: 1, operatorId: 1}
[WebSocket] ✅ Scan iniciado: {scanId: 6, status: 'recording'}
[LiveRecording] ✅ Sesión iniciada. Scan ID: 6
[LiveRecording] 📡 Backend procesará frames con Gemini server-side
[LiveRecording] 📸 Frame 1 capturado...
[LiveRecording] 📡 Frame 1 enviado al backend vía WebSocket
```

### 3. Ver logs del backend:

Deberías ver en la terminal del backend:
```
[WS] User connected
[WS] Scan 6 started for trolley 1
[WS] Frame received: frame_1_...
[Gemini] Analyzing frame with 8 products
[WS] Product detected: Coca-Cola 350ml (confidence: 0.92)
```

### 4. Ver detección en la web:

Si muestras una Coca-Cola a la cámara, debería aparecer en el feed en 1-2 segundos.

---

## 🔍 VERIFICACIÓN

### Flujo Correcto:
1. ✅ Web app conecta a `ws://localhost:3001/ws`
2. ✅ Llama `start_scan` → Backend retorna scanId
3. ✅ Captura frames cada 500ms
4. ✅ Envía a backend vía `socket.emit('frame')`
5. ✅ Backend llama a Gemini REST API (server-side)
6. ✅ Backend procesa respuesta
7. ✅ Backend emite `product_detected`
8. ✅ Web app recibe y muestra en DetectionFeed

---

## 🎯 PRODUCTOS DETECTABLES

Los 8 productos en la BD:
1. Coca-Cola 350ml
2. Coca-Cola Zero 350ml
3. Sprite 350ml
4. Pepsi 350ml
5. Agua Natural 500ml
6. Lays Original 100gr
7. Lays Queso 100gr
8. Doritos Nacho 100gr

---

## ⚡ LATENCIA ESPERADA

```
Frame capture: ~50ms
WebSocket send: ~50ms
Backend → Gemini REST: ~800-1500ms
Backend processing: ~50ms
WebSocket emit: ~50ms
Web app update: ~50ms

TOTAL: ~1-1.7 segundos ⚡
```

---

## 🐛 SI NO FUNCIONA

### Ver consola del navegador:
- Debe mostrar "WebSocket conectado"
- Debe mostrar "Scan iniciado"
- Debe mostrar "Frame enviado al backend"

### Ver logs del backend:
- Debe mostrar "[WS] User connected"
- Debe mostrar "[WS] Scan started"
- Debe mostrar "[WS] Frame received"

### Si no se conecta el WebSocket:
- Verifica que backend esté en puerto 3001
- Verifica que .env tenga `VITE_WS_URL=ws://localhost:3001`
- Recarga hard refresh: Ctrl+Shift+R

---

## 🎬 RECARGA Y PRUEBA

**AHORA MISMO**:

1. **Recarga la página**: http://localhost:3003/ (Ctrl+Shift+R)
2. **Abre consola**: F12
3. **Verifica**: "WebSocket conectado" aparece
4. **Muestra Coca-Cola** a la cámara
5. **Ve la detección** en ~1-2 segundos

---

**FLUJO CORREGIDO**: ✅ WebSocket Server-Side  
**API KEY**: ✅ Solo en backend (seguro)  
**Gemini**: ✅ Robotics-ER 1.5 preview  
**Listo para**: Detección en tiempo real

🚀 **¡RECARGA EL NAVEGADOR Y PRUEBA!**

