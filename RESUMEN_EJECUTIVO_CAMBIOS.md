# RESUMEN EJECUTIVO - TRANSFORMACIÓN DEL PROYECTO

## 🎯 OBJETIVO DEL CAMBIO

Transformar completamente el proyecto de un sistema de **validación de trolleys con fotos estáticas y detección de SKUs** a un sistema de **grabación en tiempo real con detección visual de productos durante el picking**.

---

## 📊 COMPARACIÓN RÁPIDA

### ANTES (Sistema actual)
- **Hardware**: 3 teléfonos Android fijos montados en cada repisa del trolley
- **Captura**: Fotos cada 5 segundos de cada repisa
- **IA**: OpenAI GPT-4 Vision API
- **Detección**: Lectura de códigos SKU/QR en los productos
- **Flujo**: Validar que el trolley tenga todos los productos al final
- **Latencia**: 6-7 segundos por análisis
- **Output**: JSON con array de items, cantidades, confianza

### AHORA (Sistema nuevo)
- **Hardware**: 1 cámara Android/iPhone montada en el pecho del operador
- **Captura**: Video continuo en tiempo real
- **IA**: Google Gemini Robotics-ER 1.5 API
- **Detección**: Reconocimiento visual del producto + texto visible (NUNCA SKUs)
- **Flujo**: Detectar en tiempo real cuando el operador METE productos al trolley
- **Latencia**: < 2 segundos por detección
- **Output**: Boolean simple (`{product: "coca_cola_350ml", detected: true}`)

---

## 🔑 CAMBIOS FUNDAMENTALES

### 1. Detección Visual vs SKUs
- ❌ **NO** leer códigos de barras, QR, o SKUs
- ✅ **SÍ** detectar productos por apariencia visual (color, forma, texto visible)
- Ejemplos:
  - "Lata roja con logo blanco de Coca-Cola"
  - "Bolsa amarilla de Lays con logo rojo"
  - "Botella transparente de agua"

### 2. Detección de Movimiento
- Gemini debe detectar la **acción** de meter el producto al trolley
- No solo "hay una coca-cola en la imagen"
- Sino "el operador está metiendo una coca-cola al trolley"

### 3. Respuesta Simplificada
- De: `{ items: [{sku: "COK-123", quantity: 24, confidence: 0.95}] }`
- A: `{ product: "coca_cola_350ml", detected: true, confidence: 0.95 }`

### 4. Actualización Incremental
- Cada vez que Gemini detecta un producto → INSERT en DB inmediato
- Dashboard se actualiza en tiempo real (< 1 segundo)

---

## 📱 CAMBIOS EN LA APP MÓVIL

### Eliminar:
- Selección de shelf_id (ya no hay múltiples teléfonos)
- Captura de fotos cada 5s
- Compresión de imágenes
- Cola offline de fotos

### Agregar:
- Grabación de video continua
- Streaming de video vía WebSocket
- Vista preview de cámara fullscreen
- Contador de productos detectados en tiempo real
- Setup inicial: escanear QR del trolley + seleccionar operador

### Nueva estructura:
```
/screens/
  - OperatorSetupScreen.js (nuevo)
  - LiveRecordingScreen.js (nuevo)
  - [eliminar AutoCameraScreen.js]
  - [eliminar ManualCameraScreen.js]
  - [eliminar SelectPhoneScreen.js]

/utils/
  - videoStreamer.js (nuevo)
  - websocketClient.js (nuevo)
  - [eliminar imageCompressor.js]
  - [eliminar uploadScan.js]
```

---

## 🔧 CAMBIOS EN EL BACKEND

### Eliminar:
- Endpoint `POST /scan`
- Integración con OpenAI
- Procesamiento de imágenes estáticas
- Lógica de análisis por shelves

### Agregar:
- WebSocket endpoint para video streaming: `ws://api/video/stream`
- Integración con Gemini API
- Extracción de frames de video
- Detección event-driven

### Nuevos archivos:
```
/services/
  - geminiService.js (nuevo)

/routes/
  - videoStream.js (nuevo)
  - detections.js (nuevo)
```

### Variables de entorno:
```bash
# Eliminar
OPENAI_API_KEY=...

# Agregar
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-robotics-er-1.5
VIDEO_FRAME_RATE=15
DETECTION_CONFIDENCE_THRESHOLD=0.7
```

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Eliminar tabla:
```sql
DROP TABLE shelves CASCADE;
```

### Nueva tabla principal:
```sql
CREATE TABLE product_detections (
  detection_id SERIAL PRIMARY KEY,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confidence DECIMAL(5,4),
  video_frame_id VARCHAR(255),
  scan_id INTEGER REFERENCES scans(scan_id),
  product_id INTEGER REFERENCES products(product_id),
  operator_id INTEGER REFERENCES users(user_id)
);
```

### Actualizar tabla scans:
```sql
ALTER TABLE scans RENAME COLUMN image_path TO video_path;
ALTER TABLE scans DROP COLUMN shelf_id;
ALTER TABLE scans ADD COLUMN started_at TIMESTAMP;
ALTER TABLE scans ADD COLUMN ended_at TIMESTAMP;
```

### Actualizar tabla products:
```sql
ALTER TABLE products ADD COLUMN visual_description TEXT;
ALTER TABLE products ADD COLUMN detection_keywords TEXT[];
```

**Ejemplo de producto:**
```sql
INSERT INTO products (name, visual_description, detection_keywords) VALUES
(
  'Coca-Cola 350ml',
  'Lata roja con logo blanco de Coca-Cola, tamaño 350ml',
  ARRAY['coca', 'cola', 'lata roja', 'logo blanco']
);
```

---

## 📊 CAMBIOS EN EL DASHBOARD

### Nuevos componentes:
- `RealtimeDetectionFeed.jsx` - Stream de detecciones en vivo
- `TrolleyProgress.jsx` - Progreso en tiempo real del trolley
- `LiveVideoPreview.jsx` - Preview del video del operador (opcional)

### Actualizar:
- WebSocket connection para escuchar `product_detected` events
- Vista de trolley: de "shelf status" a "producto por producto"
- Eliminar referencias a repisas

---

## 📝 CAMBIOS EN DOCUMENTACIÓN

### Archivos a ELIMINAR:
- `/docs/ops/qr-labeling.md`
- `/docs/ops/hardware-mounting.md`
- `/docs/api/vision-json-schema.md`

### Archivos a REESCRIBIR COMPLETAMENTE:
- `/docs/overview.md`
- `/docs/architecture/context-architecture.md`
- `/docs/architecture/data-model.md`
- `/docs/architecture/sequence-scan.md` → renombrar a `sequence-detection.md`
- `/docs/flows/technical-scan.md` → renombrar a `technical-detection-flow.md`
- `/docs/api/contracts.md`
- `README.md`

### Archivos NUEVOS a crear:
- `/docs/gemini-integration.md`
- `/docs/video-streaming-guide.md`
- `/docs/operator-manual.md`

---

## 🎬 NUEVO FLUJO OPERATIVO

1. **Inicio de turno**
   - Operador toma cámara (smartphone con app)
   - Monta cámara en soporte de pecho
   - Abre app
   - Escanea QR del trolley que va a cargar
   - Selecciona su nombre de usuario
   - Presiona "Iniciar"

2. **Durante el picking**
   - Cámara graba video continuamente
   - Operador toma productos del almacén
   - Al meter cada producto al trolley, Gemini lo detecta
   - Dashboard muestra detección en tiempo real
   - Supervisor ve progreso desde dashboard

3. **Al terminar**
   - Operador presiona "Finalizar"
   - Dashboard muestra resumen: productos completos/faltantes
   - Trolley sale a despacho

---

## 🧪 TESTING

### Casos de prueba críticos:

1. **Video streaming**
   - ✅ Video se graba correctamente
   - ✅ Se transmite al backend sin pérdida
   - ✅ Reconexión automática funciona

2. **Detección con Gemini**
   - ✅ Detecta coca-cola cuando se mete al trolley
   - ✅ NO detecta si solo se muestra pero no se mete
   - ✅ Identifica producto correcto (no confunde coca con pepsi)
   - ✅ Precisión > 85%

3. **Tiempo real**
   - ✅ Detección → DB → Dashboard en < 2 segundos
   - ✅ Sin pérdida de detecciones
   - ✅ Dashboard se actualiza sin reload

4. **Experiencia de usuario**
   - ✅ Setup en < 30 segundos
   - ✅ Cámara no estorba al operador
   - ✅ Feedback visual claro

---

## 💰 COSTOS ESTIMADOS

### Gemini API (estimado)
- Gemini Robotics-ER 1.5: ~$0.02-0.05 por minuto de video
- Para 8 horas de operación: ~$10-$25 USD por operador por día
- 3 operadores × 5 días = $150-$375 USD por semana

### Comparación con OpenAI anterior:
- OpenAI GPT-4 Vision: ~$0.01 por imagen
- 3 teléfonos × 12 fotos/min × 480 min = 17,280 fotos/día
- Costo: ~$170 USD/día
- **Gemini es más económico para este caso de uso**

---

## ⏱️ TIMELINE DE IMPLEMENTACIÓN

### Fase 1: Preparación (2-3 horas)
- Actualizar documentación
- Crear schemas de Prisma
- Migración de DB

### Fase 2: Backend (4-5 horas)
- Integración Gemini API
- WebSocket video streaming
- Endpoints de detecciones

### Fase 3: Mobile (5-6 horas)
- UI de grabación en vivo
- Video streaming
- WebSocket client

### Fase 4: Dashboard (3-4 horas)
- Componentes tiempo real
- WebSocket integration

### Fase 5: Testing (2-3 horas)
- Pruebas con productos reales
- Ajuste de prompts
- Optimización

**TOTAL: 16-21 horas de desarrollo**

---

## 🚨 PUNTOS CRÍTICOS

1. **Ancho de banda**
   - Video streaming requiere conexión estable
   - Mínimo 2 Mbps upload recomendado
   - Implementar buffer local si se pierde conexión

2. **Batería**
   - Grabación continua consume mucha batería
   - Usar power bank o carga externa
   - Optimizar frame rate (15 fps suficiente)

3. **Latencia de Gemini**
   - Gemini debe responder en < 1 segundo
   - Si tarda más, hacer downsampling de frames
   - Monitorear rate limits

4. **Precisión**
   - Testing exhaustivo con productos reales
   - Ajustar prompts según resultados
   - Mantener log de falsos positivos/negativos

---

## ✅ CHECKLIST DE TRANSFORMACIÓN

### Código
- [ ] Eliminada toda referencia a "SKU" en código
- [ ] Eliminada toda referencia a "OpenAI" o "ChatGPT"
- [ ] Implementado video streaming
- [ ] Integrada Gemini API
- [ ] WebSockets funcionando
- [ ] DB migrada

### Documentación
- [ ] README.md actualizado
- [ ] overview.md reescrito
- [ ] architecture docs actualizados
- [ ] API contracts actualizados
- [ ] Nuevos docs creados (Gemini, video streaming)

### Testing
- [ ] Video streaming funciona
- [ ] Gemini detecta productos correctamente
- [ ] Dashboard se actualiza en tiempo real
- [ ] App móvil estable
- [ ] Demo end-to-end funciona

### Deployment
- [ ] Variables de entorno configuradas
- [ ] Gemini API key válida
- [ ] Migración de DB ejecutada
- [ ] Apps deployadas
- [ ] Monitoreo configurado

---

## 📞 SIGUIENTE PASO

Usa el archivo `TRANSFORMATION_PROMPT.md` como guía completa para implementar todos estos cambios en Cursor.

El prompt está diseñado para ser usado directamente con Cursor AI y cubre todos los aspectos técnicos de la transformación.

---

**Versión**: 1.0  
**Fecha**: 2025-10-25  
**Estado**: Listo para implementación

