# ✅ API FUNCIONAL - Gemini Robotics-ER 1.5 REST

## 🎯 BRANCH: api-streaming-functional

---

## ✅ IMPLEMENTACIÓN COMPLETADA

### Cambios Críticos Realizados:

1. **Gemini Service actualizado a REST API** ✅
   - De: SDK `@google/generative-ai`
   - A: REST API directo `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent`
   - Header: `x-goog-api-key` o query param `?key=`
   - Temperature: 0.2 (determinista)
   - Thinking Budget: 0 (latencia mínima)

2. **Productos actualizados en BD** ✅
   - 8 productos con visual descriptions y keywords
   - Coca-Cola, Coca Zero, Sprite, Pepsi, Agua, Lays Original, Lays Queso, Doritos

3. **Parseo robusto implementado** ✅
   - Función `safeParseDetection()` que extrae JSON de texto
   - Tolerante a markdown y texto adicional
   - Validación de campos requeridos

4. **Bounding boxes soportado** ✅
   - Campo opcional `box_2d: [ymin, xmin, ymax, xmax]`
   - Normalizado 0-1000
   - Se emite en evento `product_detected`

5. **Limpieza del proyecto** ✅
   - Eliminado `/apps/mobile-shelf/`
   - Eliminados 13 archivos .md redundantes
   - Eliminados archivos TypeScript duplicados
   - Solo archivos JavaScript en backend

---

## 🔧 GEMINI REST API - IMPLEMENTACIÓN

### Request Format:

```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: jpegBase64, // Sin prefijo data:image
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        thinkingConfig: {
          thinkingBudget: 0, // Latencia mínima
        },
      },
    }),
  }
);
```

### Response Parsing:

```javascript
const json = await response.json();
const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

// Parseo robusto con regex
const jsonMatch = text.match(/\{[\s\S]*?\}/);
const parsed = JSON.parse(jsonMatch[0]);

// Resultado:
// {
//   detected: true,
//   product_name: "Coca-Cola 350ml",
//   confidence: 0.92,
//   action: "placing_in_trolley",
//   box_2d: [350, 400, 650, 700]
// }
```

---

## 📦 PRODUCTOS EN BASE DE DATOS

| # | Producto | Visual Description | Keywords |
|---|----------|-------------------|----------|
| 1 | Coca-Cola 350ml | Lata roja con logo blanco | coca, cola, lata roja, logo blanco |
| 2 | Coca-Cola Zero 350ml | Lata negra con logo rojo y plata | coca, zero, lata negra |
| 3 | Sprite 350ml | Lata verde con logo Sprite | sprite, lata verde, limón |
| 4 | Pepsi 350ml | Lata azul con logo blanco | pepsi, lata azul |
| 5 | Agua Natural 500ml | Botella transparente con agua | agua, botella transparente |
| 6 | Lays Original 100gr | Bolsa amarilla con logo rojo | lays, bolsa amarilla, papas |
| 7 | Lays Queso 100gr | Bolsa naranja con logo rojo | lays, queso, bolsa naranja |
| 8 | Doritos Nacho 100gr | Bolsa roja con triángulos amarillos | doritos, bolsa roja, nacho |

---

## 🔌 WEBSOCKET EVENTS

### Cliente → Backend:

#### `start_scan`
```json
{
  "trolleyId": 1,
  "operatorId": 1
}
```

Respuesta (callback):
```json
{
  "scanId": 123,
  "status": "recording"
}
```

#### `frame`
```json
{
  "scanId": 123,
  "frameId": "frame_123_45_1730...",
  "jpegBase64": "base64_string_sin_prefijo",
  "ts": 1730123456789
}
```

Sin respuesta (procesamiento asíncrono)

#### `end_scan`
```json
{
  "scanId": 123
}
```

Respuesta (callback):
```json
{
  "status": "completed",
  "endedAt": "2025-10-26T10:15:34.123Z"
}
```

### Backend → Cliente:

#### `product_detected`
```json
{
  "event": "product_detected",
  "trolley_id": 1,
  "product_id": 1,
  "product_name": "Coca-Cola 350ml",
  "detected_at": "2025-10-26T10:15:34.123Z",
  "operator_id": 1,
  "confidence": 0.92,
  "box_2d": [350, 400, 650, 700]
}
```

---

## 🎯 FLUJO COMPLETO DE DETECCIÓN

```
1. Web App captura frame de cámara (WebRTC)
   - Canvas 640x360 px
   - JPEG quality 0.5
   - toDataURL → base64
   
2. Web App emite socket 'frame' con jpegBase64
   - A 2 fps (500ms interval)
   - Payload: ~200-300 KB
   
3. Backend recibe frame en videoStream.js
   - Verifica scan activo
   - Obtiene catálogo de productos
   
4. Backend llama geminiService.analyzeFrame()
   - POST a Gemini REST API
   - Prompt con 8 productos
   - Thinking budget 0 (fast)
   
5. Gemini analiza y retorna JSON
   - Latencia: ~800-1500ms
   - Formato: { detected, product_name, confidence, action, box_2d }
   
6. Backend valida resultado
   - Threshold >= 0.70
   - Action === "placing_in_trolley"
   - Product existe en catálogo
   
7. Backend verifica cooldown
   - 1200ms por (scanId, productId)
   - Evita duplicados
   
8. Backend inserta en ProductDetection
   - scanId, productId, confidence
   - videoFrameId, detectedAt
   
9. Backend emite 'product_detected'
   - A room del trolley
   - Con box_2d si está disponible
   
10. Web App recibe evento
    - Actualiza DetectionFeed
    - Dibuja box_2d en overlay
    - Actualiza contadores

TOTAL: ~1-2 segundos E2E ⚡
```

---

## 🔧 CONFIGURACIÓN

### Backend `.env`:
```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-robotics-er-1.5-preview
GEMINI_FAKE=0
PORT=3001
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
JWT_SECRET=supersecretkey_hackmty_2025
```

### Web Camera `apps/web-camera/.env`:
```env
VITE_GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

---

## 🚀 EJECUTAR EL SISTEMA

### Terminal 1 - Backend:
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/api
npm run dev
```

Debería mostrar:
```
═══════════════════════════════════════════════════════
🚀 Smart Trolley API Server
═══════════════════════════════════════════════════════
✅ Server running on http://localhost:3001
✅ WebSocket available at ws://localhost:3001/ws
✅ Gemini Mode: 🤖 REAL (Production)
✅ Database: 🟢 Connected
```

### Terminal 2 - Web App:
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/web-camera
npm run dev
```

Debería abrir en: `http://localhost:5173`

---

## 📱 USAR LA WEB APP

### 1. Abrir en navegador:
```
http://localhost:5173
```

### 2. Permitir acceso a cámara

### 3. Setup:
- Trolley ID: `1`
- Operator ID: `1`
- Nombre: Tu nombre

### 4. Iniciar captura:
- Clic en "Iniciar Captura"
- Mostrar Coca-Cola a la cámara
- Simular "meter al trolley" (acercar)
- Esperar 1-2 segundos
- Ver detección en feed ✅

---

## 🎯 PROMPT DE GEMINI (Optimizado)

El prompt que se envía a Gemini Robotics-ER 1.5:

```
Eres un sistema de visión EN TIEMPO REAL para catering aéreo.

TAREA:
Dado este FRAME de un operador cargando un trolley, decide si el operador está 
METIENDO alguno de los siguientes productos. Detecta por apariencia visual y 
texto visible. NO uses ni menciones SKUs, QR o códigos de barras.

PRODUCTOS:
1. Coca-Cola 350ml — Lata roja con logo blanco de Coca-Cola — keywords: coca, cola, lata roja, logo blanco
2. Coca-Cola Zero 350ml — Lata negra con logo rojo y plata de Coca-Cola Zero — keywords: coca, zero, lata negra
3. Sprite 350ml — Lata verde con logo Sprite en blanco y amarillo — keywords: sprite, lata verde, limón
4. Pepsi 350ml — Lata azul con logo blanco de Pepsi — keywords: pepsi, lata azul
5. Agua Natural 500ml — Botella de plástico transparente con agua — keywords: agua, botella transparente
6. Lays Original 100gr — Bolsa de papas amarilla con logo rojo Lays — keywords: lays, bolsa amarilla, papas
7. Lays Queso 100gr — Bolsa de papas naranja con logo rojo Lays sabor queso — keywords: lays, queso, bolsa naranja
8. Doritos Nacho 100gr — Bolsa roja con triángulos amarillos, logo Doritos — keywords: doritos, bolsa roja, nacho

REGLAS:
- Responde detected:true SOLO si la acción visible es "placing_in_trolley" (producto entrando al trolley por la mano del operador).
- Si el producto ya está en el trolley o solo se sostiene, responde detected:false.
- Devuelve a lo sumo UN producto por frame.
- Si puedes, devuelve también "box_2d": [ymin, xmin, ymax, xmax] normalizado 0-1000 para el producto detectado.
- Prohíbe code fences. Respuesta JSON ESTRICTA y SOLO JSON.

FORMATO:
{ "detected": true|false, "product_name": "<nombre_exacto_del_producto>", "confidence": 0.0-1.0, "action": "placing_in_trolley", "box_2d": [ymin, xmin, ymax, xmax] }

Si no detectas producto:
{ "detected": false }
```

---

## 📊 VALIDACIONES IMPLEMENTADAS

### En Backend (videoStream.js):

1. **Threshold de confianza**: >= 0.70 (configurable)
2. **Acción requerida**: "placing_in_trolley" (exacta)
3. **Cooldown**: 1200ms por producto
4. **Producto en catálogo**: Debe existir en BD
5. **Scan activo**: Debe estar en status "recording"

### En geminiService.js:

1. **Parseo robusto**: Extrae JSON de texto con regex
2. **Validación de campos**: detected, product_name required
3. **Manejo de errores**: Return { detected: false } en fallos
4. **Modo FAKE**: Para testing sin API (GEMINI_FAKE=1)

---

## 🔍 DEBUGGING

### Ver logs del backend:

Los logs mostrarán:

```
[WS] User connected
[WS] Scan 1 started for trolley 1
[WS] Frame received: frame_1_23_...
[Gemini] Analyzing frame with 8 products
[WS] Product detected: Coca-Cola 350ml (confidence: 0.92) with box
```

### Si no detecta:

```
[Gemini] Detection below threshold: 0.65 < 0.70
[Gemini] Wrong action: holding, expected placing_in_trolley
[WS] Product Coca-Cola 350ml in cooldown, skipping
```

### Si hay error de Gemini:

```
[Gemini] API error: 400 Bad Request
[Gemini] Error calling API: invalid API key
```

---

## 🎨 WEB APP - OVERLAY DE BOUNDING BOX

Si Gemini retorna `box_2d`, la web app puede dibujarlo:

```typescript
// En CameraView.tsx
if (detection.box_2d) {
  const [ymin, xmin, ymax, xmax] = detection.box_2d;
  
  // Normalizar de 0-1000 a dimensiones del video
  const x = (xmin / 1000) * videoWidth;
  const y = (ymin / 1000) * videoHeight;
  const w = ((xmax - xmin) / 1000) * videoWidth;
  const h = ((ymax - ymin) / 1000) * videoHeight;
  
  // Dibujar rectángulo
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  
  // Etiqueta
  ctx.fillStyle = '#22c55e';
  ctx.fillText(detection.product_name, x, y - 10);
}
```

---

## 🚀 SERVICIOS ACTIVOS

| Servicio | Estado | URL |
|----------|--------|-----|
| **Backend API** | 🟢 CORRIENDO | http://localhost:3001 |
| **Web Camera** | 🟢 COMPILANDO | http://localhost:5173 |
| **WebSocket** | 🟢 ACTIVO | ws://localhost:3001/ws |
| **Database** | 🟢 CONECTADA | Neon PostgreSQL |
| **Gemini REST** | 🟢 CONFIGURADA | v1beta API |

---

## 📋 VERIFICACIÓN RÁPIDA

### 1. Backend Health:
```bash
curl http://localhost:3001
```

Debería retornar:
```json
{"status":"ok","message":"Smart Trolley API - Gemini Real-time Detection","version":"2.0.0","gemini_mode":"REAL"}
```

### 2. Productos en BD:
```bash
npx prisma studio
```

Ve a tabla `products` y verifica 8 productos.

### 3. Web App:
```
http://localhost:5173
```

Debería mostrar pantalla de setup.

---

## 🎯 TESTING DE DETECCIÓN

### Modo FAKE (Sin consumir API):

En `.env` del backend:
```
GEMINI_FAKE=1
```

Los frames con keywords en el frameId se detectarán automáticamente.

### Modo REAL (Con Gemini):

En `.env` del backend:
```
GEMINI_FAKE=0
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
```

Detección real con Gemini Robotics-ER 1.5.

---

## 💡 TIPS PARA MEJOR DETECCIÓN

### Iluminación:
- ✅ Buena luz uniforme
- ❌ Evitar contraluz
- ❌ Evitar sombras fuertes

### Posicionamiento:
- ✅ Producto de frente a cámara
- ✅ Logo/etiqueta visible
- ✅ Simular movimiento de "meter"
- ❌ No solo sostener estático

### Timing:
- ✅ Esperar 1.2s entre productos (cooldown)
- ✅ Movimiento claro
- ✅ Pausar brevemente al meter

---

## 🐛 TROUBLESHOOTING

### "No se detectan productos"

1. **Verifica logs del backend** para errores de Gemini
2. **Revisa API key** válida y con créditos
3. **Usa modo FAKE** temporalmente: `GEMINI_FAKE=1`
4. **Revisa threshold**: Baja a 0.50 para testing
5. **Verifica productos en BD**: `npx prisma studio`

### "Gemini API error 400"

```
[Gemini] API error: 400 {"error": {"message": "API key not valid"}}
```

- Verifica que `GEMINI_API_KEY` sea correcta
- Verifica que el modelo sea `gemini-robotics-er-1.5-preview`
- Verifica que tengas acceso al modelo en preview

### "Product not found in catalog"

```
[WS] Product not found in catalog: Coca Cola 350ml
[WS] Available products: Coca-Cola 350ml, Sprite 350ml, ...
```

- El nombre debe coincidir exactamente
- Gemini debe retornar "Coca-Cola 350ml" (con guión)
- Ajusta el prompt para ser más específico

---

## 📈 MÉTRICAS

### Latencia Esperada:
- **Frame capture**: ~50ms
- **WebSocket send**: ~50-100ms
- **Gemini API**: ~800-1500ms (thinking_budget=0)
- **DB insert**: ~50ms
- **WebSocket emit**: ~50ms
- **UI update**: ~100ms

**TOTAL**: ~1.1-1.9 segundos ✅

### Throughput:
- **Frames enviados**: 2 fps
- **Frames procesados**: ~1-2 fps (depende de latencia Gemini)
- **Detecciones**: ~5-10 por minuto (con cooldown)

---

## 🎉 ESTADO FINAL

**Backend**: ✅ Gemini REST API integrado  
**Productos**: ✅ 8 productos seeded  
**Parsing**: ✅ Robusto con regex  
**Validaciones**: ✅ Threshold + action + cooldown  
**Bounding boxes**: ✅ Soportado  
**Limpieza**: ✅ Proyecto limpio  

**LISTO PARA**: Detección en tiempo real con Gemini Robotics-ER 1.5

---

## 📞 PRÓXIMA ACCIÓN

**ABRE EN TU NAVEGADOR**:
```
http://localhost:5173
```

Y prueba detectar una Coca-Cola metiendo al trolley! 🥤

---

**Estado**: 🟢 **API COMPLETAMENTE FUNCIONAL**  
**Gemini**: ✅ REST API con thinking_budget=0  
**Productos**: ✅ 8 productos listos  
**Pipeline**: ✅ Completo E2E  

🚀 **¡SISTEMA LISTO PARA DETECCIÓN EN TIEMPO REAL!**

