# PROMPT PARA TRANSFORMACIÓN COMPLETA DEL PROYECTO

## CONTEXTO DEL CAMBIO

Este proyecto actualmente está diseñado para usar **OpenAI Vision API / ChatGPT** para detectar SKUs mediante fotos estáticas cada 5 segundos desde teléfonos fijos montados en las repisas de trolleys.

**NUEVO ENFOQUE**: El proyecto debe transformarse completamente para usar **Google Gemini API (Gemini Robotics-ER 1.5)** con las siguientes características fundamentales:

### Cambios Principales:

1. **De fotos estáticas a video en tiempo real**
   - ANTES: 3 teléfonos fijos toman fotos cada 5 segundos
   - AHORA: 1 cámara Android/iPhone montada en el pecho del operador que graba video continuo en tiempo real

2. **De detección de SKUs a detección de productos**
   - ANTES: Se detectaban códigos SKU/QR mediante visión
   - AHORA: Se detectan productos visualmente (coca cola 350ml, sprite 350ml, lays 100gr) por su apariencia/texto del producto
   - **NUNCA detectar SKUs o códigos de barras**

3. **De análisis de imagen completa a detección de movimiento**
   - ANTES: Análisis completo de cada foto
   - AHORA: Gemini analiza el video en tiempo real y detecta cuando el operador METE un producto al trolley (basado en movimientos)

4. **De JSON complejo a boolean simple**
   - ANTES: JSON con array de items, cantidades, confianza
   - AHORA: Para cada producto predeterminado en la base de datos, Gemini solo retorna `true` si detectó ese producto específico en la imagen/video

5. **Actualización incremental a base de datos**
   - ANTES: Se guardaban todos los items de cada scan
   - AHORA: Cada vez que Gemini detecta un producto (true), se envía inmediatamente a la base de datos/Prisma

---

## TAREAS DE TRANSFORMACIÓN

### 1. ACTUALIZAR TODA LA DOCUMENTACIÓN

#### 1.1 Archivos a BORRAR completamente:
```
/docs/ops/qr-labeling.md
/docs/ops/hardware-mounting.md (específico para teléfonos fijos)
/docs/api/vision-json-schema.md (específico para OpenAI)
```

#### 1.2 Archivos a REESCRIBIR completamente:

**`/docs/overview.md`**
- Cambiar de "Smart Trolley con 3 teléfonos fijos" a "Sistema de detección en tiempo real con cámara de pecho"
- Actualizar problema: Ya no se trata de validar trolleys armados, sino de registrar en tiempo real lo que se mete
- Cambiar tecnología: De OpenAI Vision a Google Gemini Robotics-ER 1.5
- Actualizar beneficios: Enfocarse en trazabilidad en tiempo real durante el picking

**`/docs/architecture/context-architecture.md`**
- Eliminar referencias a 3 teléfonos separados
- Cambiar a 1 dispositivo móvil por operador
- Actualizar diagrama de arquitectura:
  - De: `[📱 Shelf 1] [📱 Shelf 2] [📱 Shelf 3] --> API`
  - A: `[📱 Cámara de pecho (Video stream)] --> API --> Gemini --> DB`
- Cambiar flujo de "captura cada 5s" a "streaming continuo"

**`/docs/architecture/data-model.md`**
- **Eliminar tabla `shelves`** (ya no hay repisas separadas)
- **Simplificar tabla `scans`**: Ya no guardar `shelf_id`, cambiar a `video_timestamp`
- **Simplificar tabla `scan_items`**: 
  - Cambiar `detected_quantity` a solo presencia (boolean implícito)
  - Agregar `detected_at` timestamp para cada detección individual
  - Eliminar `confidence` score (o mantenerlo pero simplificado)
- **Actualizar `flight_requirements`**:
  - Ya no es "expected_quantity" por trolley
  - Es una lista de productos que deben estar
- **Tabla nueva: `product_detections`**:
  - `detection_id` (PK)
  - `trolley_id` (FK)
  - `product_id` (FK)
  - `detected_at` (timestamp exacto)
  - `video_frame_id` (opcional, referencia al frame del video)
  - `operator_id` (FK a users)

**`/docs/architecture/sequence-scan.md`**
- Reescribir completamente el flujo:
  1. Operador inicia la app
  2. App comienza a grabar video continuamente
  3. Video se transmite a backend en chunks pequeños (cada 1-2 segundos)
  4. Backend envía frames a Gemini API
  5. Gemini analiza movimientos del operador
  6. Cuando detecta que se está metiendo un producto:
     - Identifica qué producto es (por apariencia visual/texto)
     - Retorna `{ "product": "coca_cola_350ml", "detected": true }`
  7. Backend busca product_id en DB
  8. Inserta registro en `product_detections`
  9. Emite evento WebSocket a dashboard
  10. Dashboard actualiza contador en tiempo real

**`/docs/api/contracts.md`**
- **Eliminar endpoint**: `POST /scan` (ya no aplica)
- **Nuevo endpoint**: `POST /video/stream`
  - Content-Type: `video/mp4` o chunks de video
  - O mejor: WebSocket bidireccional para streaming
- **Nuevo endpoint**: `GET /trolleys/:id/realtime-status`
  - Retorna productos detectados en tiempo real
- **Actualizar WebSocket events**:
  - Nuevo evento: `product_detected`
    ```json
    {
      "event": "product_detected",
      "trolley_id": 456,
      "product_id": 1,
      "product_name": "Coca-Cola 350ml",
      "detected_at": "2025-10-26T10:15:34.123Z",
      "operator_id": 5
    }
    ```

**`/docs/flows/technical-scan.md`**
- Cambiar nombre a `technical-detection-flow.md`
- Reescribir flujo técnico:
  - De captura de imagen cada 5s a streaming de video
  - De llamada a OpenAI a llamada a Gemini
  - De procesamiento batch a detección event-driven

**`README.md`**
- Actualizar descripción ejecutiva
- Cambiar "3 Android phones" a "1 chest-mounted camera per operator"
- Actualizar stack tecnológico: Gemini API en lugar de OpenAI

#### 1.3 Archivos a ACTUALIZAR (no reescribir completo):

**`/docs/setup/mobile-expo-setup.md`**
- Agregar dependencias para video recording:
  - `expo-camera` con modo video
  - `expo-av` para manejo de video
  - WebSocket client para streaming
- Actualizar permisos: Cámara + Micrófono (opcional)
- Configuración de streaming de video

**`/docs/setup/api-express-setup.md`**
- Agregar integración con Gemini API
- Variables de entorno:
  ```
  GEMINI_API_KEY=your_gemini_api_key
  GEMINI_MODEL=gemini-robotics-er-1.5
  ```
- Eliminar referencias a OpenAI

**`/docs/setup/env-variables.md`**
- Cambiar `OPENAI_API_KEY` a `GEMINI_API_KEY`
- Agregar `GEMINI_MODEL=gemini-robotics-er-1.5`
- Agregar variables para streaming:
  ```
  VIDEO_STREAM_CHUNK_SIZE=1024
  VIDEO_FRAME_RATE=15
  DETECTION_CONFIDENCE_THRESHOLD=0.7
  ```

**`/prisma/schema.prisma`**
- Eliminar modelo `Shelf`
- Actualizar modelo `Scan`:
  ```prisma
  model Scan {
    scanId       Int       @id @default(autoincrement())
    videoPath    String?   @map("video_path")  // Cambiar de imagePath
    startedAt    DateTime  @default(now()) @map("started_at")
    endedAt      DateTime? @map("ended_at")
    status       String    @default("recording")
    metadata     Json?
    
    trolleyId    Int?
    operatorId   Int?      // Cambiar de scannedBy
    
    trolley      Trolley?  @relation(fields: [trolleyId], references: [trolleyId])
    operator     User?     @relation(fields: [operatorId], references: [userId])
    detections   ProductDetection[]
    
    @@map("scans")
  }
  ```
- Nuevo modelo `ProductDetection`:
  ```prisma
  model ProductDetection {
    detectionId   Int      @id @default(autoincrement())
    detectedAt    DateTime @default(now()) @map("detected_at")
    confidence    Decimal? @db.Decimal(5, 4)
    videoFrameId  String?  @map("video_frame_id")
    
    scanId     Int
    productId  Int
    
    scan       Scan     @relation(fields: [scanId], references: [scanId], onDelete: Cascade)
    product    Product  @relation(fields: [productId], references: [productId])
    
    @@map("product_detections")
  }
  ```
- Actualizar modelo `Product` para incluir relación:
  ```prisma
  detections  ProductDetection[]
  ```

---

### 2. TRANSFORMAR LA APLICACIÓN MÓVIL

#### 2.1 Cambios en `/apps/mobile-shelf/`

**Eliminar archivos:**
- `/screens/SelectPhoneScreen.js` (ya no hay múltiples teléfonos fijos)
- `/screens/ManualCameraScreen.js` (ya no se toman fotos manuales)
- `/utils/imageCompressor.js` (ya no se comprimen imágenes estáticas)
- `/utils/uploadScan.js` (cambiar por uploadVideoStream.js)

**Crear nuevos archivos:**

**`/screens/LiveRecordingScreen.js`**
```javascript
// Pantalla principal que:
// 1. Muestra vista de cámara en vivo
// 2. Graba video continuamente
// 3. Envía chunks de video al backend vía WebSocket
// 4. Muestra feedback en tiempo real de productos detectados
// 5. Contador de productos detectados
// Componentes:
// - Vista de cámara fullscreen
// - Overlay con contador de productos
// - Indicador de conexión (verde/rojo)
// - Botón para pausar/reanudar
// - Lista de últimos 5 productos detectados
```

**`/screens/OperatorSetupScreen.js`**
```javascript
// Pantalla inicial donde:
// 1. Operador escanea QR del trolley al que va a cargar
// 2. Selecciona su usuario
// 3. Verifica que cámara esté funcionando
// 4. Inicia sesión de picking
```

**`/utils/videoStreamer.js`**
```javascript
// Utility para:
// 1. Capturar video desde la cámara
// 2. Dividir en chunks de 1-2 segundos
// 3. Enviar vía WebSocket al backend
// 4. Manejo de reconexión automática
// 5. Buffer local si pierde conexión
```

**`/utils/websocketClient.js`**
```javascript
// Cliente WebSocket que:
// 1. Conecta con backend
// 2. Envía video chunks
// 3. Escucha eventos de product_detected
// 4. Maneja reconexión automática
```

**Actualizar `App.js`:**
```javascript
// Nueva navegación:
// 1. OperatorSetupScreen (inicial)
// 2. LiveRecordingScreen (principal)
// Eliminar AutoCameraScreen
```

**Actualizar `package.json`:**
```json
{
  "dependencies": {
    "expo-camera": "~14.0.0",
    "expo-av": "~13.0.0",
    "socket.io-client": "^4.5.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "expo-keep-awake": "~12.0.0"
  }
}
```

---

### 3. TRANSFORMAR EL BACKEND API

#### 3.1 Cambios en `/apps/api/`

**Crear nuevos archivos:**

**`/services/geminiService.js`**
```javascript
// Servicio para interactuar con Gemini API
// Funciones:
// - analyzeVideoFrame(frameBuffer, productCatalog)
//   - Envía frame a Gemini
//   - Prompt específico para detección de productos por apariencia
//   - Retorna: { detected: true/false, product_name: "...", confidence: 0.85 }
// - buildGeminiPrompt(productCatalog)
//   - Construye prompt optimizado para Gemini
//   - Incluye lista de productos a detectar
//   - Instrucciones sobre detección por movimiento
```

**Ejemplo de prompt para Gemini:**
```javascript
const GEMINI_PROMPT = `
Eres un sistema de visión para detectar productos de catering aéreo en tiempo real.

TAREA: Analiza este frame de video de un operador cargando un trolley. 
Detecta si la persona está METIENDO alguno de estos productos al trolley:

PRODUCTOS A DETECTAR (detecta por apariencia visual y texto en el producto):
1. Coca-Cola 350ml (lata roja con logo blanco)
2. Coca-Cola Zero 350ml (lata negra)
3. Sprite 350ml (lata verde)
4. Pepsi 350ml (lata azul)
5. Agua Natural 500ml (botella transparente)
6. Lays Original 100gr (bolsa amarilla con logo rojo)
7. Lays Queso 100gr (bolsa naranja)
8. Doritos Nacho 100gr (bolsa roja con logo amarillo)

IMPORTANTE:
- NO detectes códigos de barras o SKUs
- SOLO detecta por la apariencia visual del producto y texto visible
- SOLO retorna "detected: true" si ves al operador METIENDO el producto
- Si solo está moviendo el producto o ya está en el trolley: "detected: false"
- Si detectas el producto, identifica cuál es de la lista

FORMATO DE RESPUESTA (JSON):
Para cada producto detectado:
{
  "product_name": "coca_cola_350ml",
  "detected": true,
  "confidence": 0.95,
  "action": "placing_in_trolley"
}

Si no detectas ningún producto siendo colocado:
{
  "detected": false
}
`;
```

**`/routes/videoStream.js`**
```javascript
// Endpoint WebSocket para recibir video streaming
// Ruta: ws://api/video/stream
// Funciones:
// 1. Recibir chunks de video del móvil
// 2. Extraer frames clave (cada 500ms o según movimiento)
// 3. Enviar frame a Gemini
// 4. Procesar respuesta de Gemini
// 5. Si detectó producto:
//    - Buscar product_id en DB
//    - Insertar en product_detections
//    - Emitir evento a dashboard
```

**`/routes/detections.js`**
```javascript
// REST endpoints para detecciones
// GET /trolleys/:id/detections
//   - Retorna todas las detecciones del trolley
// GET /trolleys/:id/summary
//   - Retorna resumen: productos únicos detectados, cantidades
// POST /detections/:id/confirm
//   - Permite confirmar/rechazar una detección manual
```

**Actualizar `/routes/index.js`:**
```javascript
// Eliminar: POST /scan
// Agregar: WebSocket /video/stream
// Agregar: /detections routes
```

**Actualizar `package.json`:**
```json
{
  "dependencies": {
    "@google-ai/generativelanguage": "^2.0.0",
    "google-auth-library": "^9.0.0",
    "socket.io": "^4.5.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.0",
    "fluent-ffmpeg": "^2.1.2"
  }
}
```

---

### 4. ACTUALIZAR DASHBOARD

#### 4.1 Cambios en `/apps/dashboard/`

**Crear/Actualizar componentes:**

**`/components/RealtimeDetectionFeed.jsx`**
```jsx
// Componente que muestra:
// 1. Stream de detecciones en tiempo real (últimas 10)
// 2. Cada detección con:
//    - Producto detectado
//    - Timestamp
//    - Operador
//    - Badge de confianza
// 3. Auto-scroll cuando llega nueva detección
```

**`/components/TrolleyProgress.jsx`**
```jsx
// Componente que muestra:
// 1. Lista de productos requeridos para el trolley
// 2. Para cada producto:
//    - Nombre
//    - Cantidad requerida
//    - Cantidad detectada (en tiempo real)
//    - Badge: verde (completo), amarillo (parcial), rojo (faltante)
// 3. Barra de progreso general
```

**`/components/LiveVideoPreview.jsx`** (Opcional)
```jsx
// Muestra preview del video del operador
// Solo para supervisión/debugging
```

**Actualizar `/pages/trolley/[id].jsx`:**
```jsx
// Cambiar de mostrar "shelf status" a:
// 1. Progreso general del trolley
// 2. Feed de detecciones en tiempo real
// 3. Lista de productos pendientes
// 4. Tiempo transcurrido desde inicio
```

**WebSocket connection:**
```javascript
// Conectar a ws://api/ws
// Escuchar evento: 'product_detected'
// Actualizar UI en tiempo real sin reload
```

---

### 5. MIGRACIÓN DE BASE DE DATOS

**Crear nueva migración:**
```bash
npx prisma migrate dev --name transform_to_video_detection
```

**SQL de migración:**
```sql
-- 1. Eliminar tabla shelves
DROP TABLE IF EXISTS shelves CASCADE;

-- 2. Crear tabla product_detections
CREATE TABLE product_detections (
  detection_id SERIAL PRIMARY KEY,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confidence DECIMAL(5,4),
  video_frame_id VARCHAR(255),
  scan_id INTEGER REFERENCES scans(scan_id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(product_id),
  operator_id INTEGER REFERENCES users(user_id)
);

-- 3. Actualizar tabla scans
ALTER TABLE scans DROP COLUMN IF EXISTS shelf_id;
ALTER TABLE scans RENAME COLUMN image_path TO video_path;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
ALTER TABLE scans ALTER COLUMN status SET DEFAULT 'recording';

-- 4. Actualizar tabla scan_items (deprecar o eliminar)
-- Opción 1: Eliminar completamente
-- DROP TABLE scan_items CASCADE;
-- Opción 2: Mantener pero marcar como legacy
ALTER TABLE scan_items ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT true;

-- 5. Índices para optimización
CREATE INDEX idx_detections_trolley ON product_detections(scan_id);
CREATE INDEX idx_detections_product ON product_detections(product_id);
CREATE INDEX idx_detections_timestamp ON product_detections(detected_at DESC);
```

---

### 6. ACTUALIZAR CATÁLOGO DE PRODUCTOS

**Cambiar de SKUs a descripción visual:**

**Antes (en `products` table):**
```sql
INSERT INTO products (sku, name, category) VALUES
('COK-REG-330', 'Coca-Cola Regular 330ml', 'Bebidas');
```

**Ahora:**
```sql
-- Agregar campos para detección visual
ALTER TABLE products ADD COLUMN visual_description TEXT;
ALTER TABLE products ADD COLUMN detection_keywords TEXT[];

INSERT INTO products (name, visual_description, detection_keywords, category) VALUES
(
  'Coca-Cola 350ml',
  'Lata roja con logo blanco de Coca-Cola, tamaño 350ml',
  ARRAY['coca', 'cola', 'lata roja', 'logo blanco'],
  'Bebidas'
),
(
  'Sprite 350ml',
  'Lata verde con logo Sprite en blanco y amarillo, tamaño 350ml',
  ARRAY['sprite', 'lata verde', 'limón'],
  'Bebidas'
),
(
  'Lays Original 100gr',
  'Bolsa de papas Lays amarilla con logo rojo, 100 gramos',
  ARRAY['lays', 'papas', 'bolsa amarilla', 'original'],
  'Snacks'
);
```

---

### 7. TESTING DEL NUEVO SISTEMA

**Crear scripts de prueba:**

**`/apps/api/test/gemini-integration.test.js`**
```javascript
// Test de integración con Gemini API
// 1. Enviar frame de prueba con coca-cola visible
// 2. Verificar que retorna detected: true
// 3. Verificar que identifica producto correcto
```

**`/apps/mobile-shelf/test/video-streaming.test.js`**
```javascript
// Test de streaming de video
// 1. Simular grabación
// 2. Verificar que chunks se envían correctamente
// 3. Verificar reconexión automática
```

---

### 8. DOCUMENTACIÓN FINAL

**Crear nuevos documentos:**

**`/docs/gemini-integration.md`**
- Cómo funciona Gemini Robotics-ER 1.5
- Configuración de API key
- Estructura de prompts
- Manejo de respuestas
- Rate limits y costos

**`/docs/video-streaming-guide.md`**
- Arquitectura de streaming de video
- Formato de chunks
- Manejo de buffer
- Optimizaciones de ancho de banda
- Troubleshooting

**`/docs/operator-manual.md`**
- Guía para operadores
- Cómo montar la cámara en el pecho
- Cómo iniciar sesión de picking
- Qué hacer si se pierde conexión
- Mejores prácticas para detección óptima

**Actualizar:**
- `README.md` - Descripción general del nuevo sistema
- `/docs/planning/milestones.md` - Actualizar hitos con nuevo alcance
- `/docs/demo/demo-script.md` - Nuevo script de demo
- `/docs/demo/success-criteria.md` - Nuevos criterios de éxito

---

## NUEVOS CRITERIOS DE ÉXITO

1. **Video streaming funcional**
   - ✅ App móvil graba video continuamente
   - ✅ Video se transmite al backend en tiempo real
   - ✅ Latencia < 2 segundos

2. **Detección con Gemini**
   - ✅ Gemini detecta productos por apariencia visual
   - ✅ Gemini identifica movimiento de "meter al trolley"
   - ✅ Precisión > 85% en productos comunes

3. **Actualización en tiempo real**
   - ✅ Cada detección se guarda en DB inmediatamente
   - ✅ Dashboard se actualiza en < 1 segundo
   - ✅ Sin pérdida de detecciones

4. **Experiencia del operador**
   - ✅ Setup en < 30 segundos
   - ✅ Cámara no interfiere con trabajo
   - ✅ Feedback visual claro

---

## RESUMEN DE CAMBIOS TECNOLÓGICOS

| Componente | Antes | Ahora |
|------------|-------|-------|
| **Dispositivos** | 3 teléfonos fijos por trolley | 1 cámara de pecho por operador |
| **Captura** | Fotos cada 5 segundos | Video continuo en tiempo real |
| **IA** | OpenAI GPT-4 Vision | Google Gemini Robotics-ER 1.5 |
| **Detección** | Lectura de SKUs/QR | Detección visual de productos |
| **Formato** | JSON con array completo | Boolean por producto |
| **Datos** | Scans batch | Detecciones event-driven |
| **DB** | scans + scan_items + shelves | scans + product_detections |
| **Latencia** | 6-7 segundos | < 2 segundos |
| **Interfaz móvil** | 3 pantallas (setup, auto, manual) | 2 pantallas (setup, recording) |

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Fase 1: Preparación** (2-3 horas)
   - Actualizar documentación
   - Crear nuevos schemas de Prisma
   - Ejecutar migraciones de DB

2. **Fase 2: Backend** (4-5 horas)
   - Integración con Gemini API
   - WebSocket para video streaming
   - Endpoints de detecciones
   - Testing de Gemini

3. **Fase 3: Mobile App** (5-6 horas)
   - Nueva UI de grabación en vivo
   - Video streaming
   - WebSocket client
   - Testing de conexión

4. **Fase 4: Dashboard** (3-4 horas)
   - Componentes de tiempo real
   - WebSocket integration
   - Testing end-to-end

5. **Fase 5: Testing & Refinamiento** (2-3 horas)
   - Pruebas con productos reales
   - Ajuste de prompts de Gemini
   - Optimización de latencia
   - Documentación final

**Tiempo total estimado: 16-21 horas**

---

## NOTAS IMPORTANTES

1. **Gemini Robotics-ER 1.5** está optimizado para:
   - Detección de objetos en movimiento
   - Análisis de video en tiempo real
   - Comprensión de acciones humanas
   - Bajo latencia

2. **NO** usar para:
   - Lectura de códigos de barras
   - Detección de SKUs
   - OCR de textos pequeños

3. **Estrategia de prompting**:
   - Ser muy específico sobre la acción (meter al trolley)
   - Describir productos por apariencia visual
   - Incluir keywords del producto
   - Solicitar respuesta simple (true/false)

4. **Optimización de costos**:
   - No enviar cada frame (solo 1-2 por segundo)
   - Usar detección de movimiento pre-procesada
   - Cache de frames similares
   - Batch pequeños cuando sea posible

---

## CHECKLIST FINAL

Antes de considerar completa la transformación:

- [ ] Toda mención a "SKU" eliminada o actualizada
- [ ] Toda mención a "OpenAI" o "ChatGPT" reemplazada por "Gemini"
- [ ] Tabla `shelves` eliminada de DB
- [ ] Tabla `product_detections` creada
- [ ] App móvil graba video en tiempo real
- [ ] Video se transmite vía WebSocket
- [ ] Gemini API integrada y funcionando
- [ ] Dashboard muestra detecciones en tiempo real
- [ ] Documentación actualizada
- [ ] Tests básicos pasando
- [ ] Demo funcionando end-to-end

---

## CONTACTO Y SOPORTE

Para preguntas sobre esta transformación:
- Revisar `/docs/gemini-integration.md`
- Revisar `/docs/video-streaming-guide.md`
- Consultar documentación oficial de Gemini API

---

**Última actualización**: 2025-10-25
**Versión del prompt**: 1.0
**Estado**: Listo para implementación

