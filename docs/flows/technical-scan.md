# Flujo Técnico de Scan

Este documento describe el flujo técnico detallado de un scan, desde la captura de imagen hasta la emisión de alertas, con énfasis en tamaños de datos, tiempos, y cálculos.

## Diagrama de Flujo Técnico

```mermaid
flowchart TD
    Start([Timer: 5000ms elapsed]) --> Capture[Captura con cámara<br/>Resolución nativa]
    Capture --> Compress[Comprimir a JPEG<br/>Quality 80%, Max 1280px]
    Compress --> CheckSize{Tamaño < 10 MB?}
    
    CheckSize -->|No| Error1[Error: Image too large]
    CheckSize -->|Yes| PrepareForm[Preparar FormData]
    
    PrepareForm --> Upload[POST /scan<br/>multipart/form-data]
    Upload --> CheckNet{Red disponible?}
    
    CheckNet -->|No| Queue[Guardar en cola offline]
    Queue --> WaitRetry[Esperar 30s]
    WaitRetry --> Upload
    
    CheckNet -->|Yes| Receive[Backend recibe request]
    Receive --> Auth{JWT válido?}
    
    Auth -->|No| Error2[401 Unauthorized]
    Auth -->|Yes| Validate{Campos válidos?}
    
    Validate -->|No| Error3[400 Bad Request]
    Validate -->|Yes| SaveImg[Guardar imagen en storage]
    
    SaveImg --> InsertScan[INSERT INTO scans<br/>status='processing']
    InsertScan --> Response[202 Accepted + scan_id]
    Response --> Phone[Teléfono recibe confirmación]
    
    Phone --> WaitNext[Esperar 5 segundos]
    WaitNext --> Start
    
    InsertScan --> ReadImg[Leer imagen desde FS]
    ReadImg --> Base64[Convertir a base64]
    Base64 --> CallLLM[Llamada a Vision LLM API]
    
    CallLLM --> LLMWait[Esperar respuesta<br/>2-5 segundos]
    LLMWait --> ParseJSON{JSON válido?}
    
    ParseJSON -->|No| MarkFailed[UPDATE scans<br/>status='failed']
    ParseJSON -->|Yes| ValidateSchema{Schema correcto?}
    
    ValidateSchema -->|No| MarkFailed
    ValidateSchema -->|Yes| ProcessItems[Procesar items array]
    
    ProcessItems --> LoopItems[Para cada item]
    LoopItems --> FindSKU{SKU existe en DB?}
    
    FindSKU -->|No| LogUnknown[Log: Unknown SKU]
    FindSKU -->|Yes| InsertItem[INSERT INTO scan_items]
    
    InsertItem --> NextItem{Más items?}
    NextItem -->|Yes| LoopItems
    NextItem -->|No| UpdateComplete[UPDATE scans<br/>status='completed']
    
    UpdateComplete --> GetReqs[SELECT flight_requirements]
    GetReqs --> GetActuals[SELECT SUM detected_quantity]
    
    GetActuals --> CalcDiffs[Calcular diffs por SKU]
    CalcDiffs --> CheckDiffs{Hay diffs != 0<br/>o confidence < 0.60?}
    
    CheckDiffs -->|No| EmitScan[Emit 'scan_processed']
    CheckDiffs -->|Yes| GenAlerts[Generar alertas]
    
    GenAlerts --> InsertAlerts[INSERT INTO alerts]
    InsertAlerts --> EmitAlert[Emit 'alert_created']
    EmitAlert --> EmitScan
    
    EmitScan --> Dashboard[Dashboard actualiza UI]
    Dashboard --> End([Fin del ciclo])
```

## Detalles por Etapa

### Etapa 1: Captura y Compresión (500ms)

**Entrada**: Trigger de timer cada 5000ms

**Proceso**:
```javascript
// React Native Expo Camera
const photo = await cameraRef.current.takePictureAsync({
  quality: 0.80,
  base64: false,
  skipProcessing: false
});

// Resultado típico (antes de resize)
{
  uri: 'file:///data/.../photo_123.jpg',
  width: 3024,
  height: 4032,
  size: 2847193  // ~2.8 MB
}
```

**Compresión con Expo ImageManipulator**:
```javascript
import * as ImageManipulator from 'expo-image-manipulator';

const compressed = await ImageManipulator.manipulateAsync(
  photo.uri,
  [{ resize: { width: 1280 } }],  // Height proporcional
  { compress: 0.80, format: ImageManipulator.SaveFormat.JPEG }
);

// Resultado típico
{
  uri: 'file:///data/.../compressed_123.jpg',
  width: 1280,
  height: 1707,  // Proporcional a 4:3
  size: 342857  // ~343 KB
}
```

**Tamaños esperados**:
- Original: 2-4 MB (3000x4000px)
- Comprimido: 200-400 KB (1280x~1700px)
- Reducción: ~85-90%

---

### Etapa 2: Upload HTTP (1500ms)

**Request**:
```http
POST /api/scan HTTP/1.1
Host: api.smarttrolley.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ123
Content-Length: 351284

------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="image"; filename="scan_123.jpg"
Content-Type: image/jpeg

<342 KB de datos binarios>
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="flight_id"

123
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="trolley_id"

456
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="shelf_id"

1
------WebKitFormBoundaryXYZ123
Content-Disposition: form-data; name="captured_by"

operator01
------WebKitFormBoundaryXYZ123--
```

**Ancho de banda**:
- Upload típico: 350 KB
- Conexión WiFi (10 Mbps upload): ~280ms
- Conexión 4G (5 Mbps upload): ~560ms
- **Tiempo promedio**: 400-800ms

**Overhead de HTTP**:
- Headers: ~500 bytes
- Multipart boundaries: ~300 bytes
- **Total overhead**: <1 KB

---

### Etapa 3: Almacenamiento (200ms)

**Recepción en backend (Express + Multer)**:
```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `./storage/scans/${req.body.flight_id}/${req.body.trolley_id}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}_${req.body.shelf_id}.jpg`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG allowed'));
    }
  }
});
```

**Path final**:
```
/storage/scans/123/456/2025-10-26T10-15-30-123Z_1.jpg
```

**Insert en DB**:
```sql
INSERT INTO scans (
  trolley_id, shelf_id, image_path, scanned_at, scanned_by, status, metadata
) VALUES (
  456, 
  1, 
  '/storage/scans/123/456/2025-10-26T10-15-30-123Z_1.jpg',
  '2025-10-26 10:15:30.123',
  1,
  'processing',
  '{"size_kb": 342, "resolution": "1280x1707", "format": "jpeg"}'::jsonb
) RETURNING id;
```

**Tiempo típico**:
- Write to disk: 100-150ms (SSD)
- Insert to DB: 50-100ms
- **Total**: 150-250ms

---

### Etapa 4: Llamada a Vision LLM (3500ms)

**Preparación**:
```javascript
const imageBuffer = fs.readFileSync(imagePath);
const imageBase64 = imageBuffer.toString('base64');

// Tamaño base64: ~456 KB (33% más que binary)
const base64Size = imageBase64.length;  // ~467,809 caracteres
```

**Request a OpenAI**:
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT },
          { 
            type: 'image_url', 
            image_url: { 
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'high'
            } 
          }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
    temperature: 0.1
  })
});
```

**Tamaño del request**:
- Prompt text: ~2 KB
- Image base64: ~456 KB
- Overhead JSON: ~1 KB
- **Total request**: ~459 KB

**Tamaño del response**:
```json
{
  "id": "chatcmpl-8xYz...",
  "object": "chat.completion",
  "created": 1730000000,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"items\":[{\"sku\":\"COK-REG-330\",\"quantity\":24,\"confidence\":0.95,\"notes\":null},{\"sku\":\"WTR-REG-500\",\"quantity\":30,\"confidence\":0.92,\"notes\":null}],\"metadata\":{\"image_quality\":\"good\",\"lighting_conditions\":\"good\",\"total_items_visible\":54}}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1450,  // ~1.2K tokens de texto + imagen
    "completion_tokens": 85,
    "total_tokens": 1535
  }
}
```

**Response típico**: ~1-2 KB

**Latencia**:
- Network RTT: 100-200ms
- Processing en OpenAI: 2000-4000ms
- **Total**: 2100-4200ms

---

### Etapa 5: Procesamiento de Items (300ms)

**Parseo del JSON**:
```javascript
const content = response.choices[0].message.content;
const parsed = JSON.parse(content);  // ~5ms

// Validar con Ajv
const valid = validateSchema(parsed);  // ~10ms
if (!valid) throw new Error('Invalid schema');
```

**Loop de inserción**:
```javascript
for (const item of parsed.items) {
  // 1. Buscar product_id
  const productResult = await db.query(
    'SELECT id FROM products WHERE sku = $1',
    [item.sku]
  );  // ~30ms por query
  
  if (productResult.rows.length === 0) {
    console.warn(`Unknown SKU: ${item.sku}`);
    continue;
  }
  
  const productId = productResult.rows[0].id;
  
  // 2. Insertar scan_item
  await db.query(
    'INSERT INTO scan_items (scan_id, product_id, detected_quantity, confidence, notes) VALUES ($1, $2, $3, $4, $5)',
    [scanId, productId, item.quantity, item.confidence, item.notes]
  );  // ~40ms por insert
}

// Total: 2 items × (30ms + 40ms) = ~140ms
```

**Actualizar status del scan**:
```sql
UPDATE scans SET status = 'completed' WHERE id = 789;
-- ~20ms
```

**Total**: 150-400ms (depende de número de items)

---

### Etapa 6: Cálculo de Diferencias (350ms)

**Query de requirements**:
```sql
SELECT 
  fr.product_id,
  p.sku,
  fr.expected_quantity,
  fr.priority
FROM flight_requirements fr
JOIN products p ON p.id = fr.product_id
WHERE fr.flight_id = 123 AND fr.trolley_id = 456;

-- Resultado (ejemplo):
-- product_id | sku          | expected_quantity | priority
-- 1          | COK-REG-330  | 24                | normal
-- 2          | WTR-REG-500  | 30                | critical
-- 3          | SNK-PRT-50   | 12                | normal
```

**Tiempo**: ~50-100ms

**Query de actuales** (último scan por shelf):
```sql
WITH latest_scans AS (
  SELECT DISTINCT ON (shelf_id) 
    id, shelf_id
  FROM scans
  WHERE trolley_id = 456 AND status = 'completed'
  ORDER BY shelf_id, scanned_at DESC
)
SELECT 
  si.product_id,
  SUM(si.detected_quantity) as total_detected,
  AVG(si.confidence) as avg_confidence
FROM scan_items si
JOIN latest_scans ls ON ls.id = si.scan_id
GROUP BY si.product_id;

-- Resultado (ejemplo):
-- product_id | total_detected | avg_confidence
-- 1          | 23             | 0.8750
-- 2          | 30             | 0.9200
-- 3          | 11             | 0.7500
```

**Tiempo**: ~100-200ms

**Cálculo de diffs en memoria**:
```javascript
const diffs = requirements.map(req => {
  const actual = actuals.find(a => a.product_id === req.product_id) || { total_detected: 0, avg_confidence: 0 };
  
  return {
    product_id: req.product_id,
    sku: req.sku,
    expected: req.expected_quantity,
    actual: actual.total_detected,
    diff: actual.total_detected - req.expected_quantity,
    avg_confidence: parseFloat(actual.avg_confidence),
    priority: req.priority
  };
});

// Ejemplo de diffs:
// [
//   { product_id: 1, sku: 'COK-REG-330', expected: 24, actual: 23, diff: -1, avg_confidence: 0.8750, priority: 'normal' },
//   { product_id: 2, sku: 'WTR-REG-500', expected: 30, actual: 30, diff: 0, avg_confidence: 0.9200, priority: 'critical' },
//   { product_id: 3, sku: 'SNK-PRT-50', expected: 12, actual: 11, diff: -1, avg_confidence: 0.7500, priority: 'normal' }
// ]
```

**Tiempo**: ~10-20ms

**Total etapa**: 160-320ms

---

### Etapa 7: Generación de Alertas (200ms)

**Lógica de decisión**:
```javascript
for (const diff of diffs) {
  let shouldAlert = false;
  let alertType = null;
  let severity = 'warning';
  let message = '';
  
  // Caso 1: Faltante
  if (diff.diff < 0) {
    shouldAlert = true;
    alertType = 'missing_item';
    message = `${diff.sku}: esperados ${diff.expected}, detectados ${diff.actual} (diff: ${diff.diff})`;
    
    if (diff.priority === 'critical' || Math.abs(diff.diff) > 5) {
      severity = 'critical';
    }
  }
  
  // Caso 2: Excedente
  else if (diff.diff > 0) {
    shouldAlert = true;
    alertType = 'excess_item';
    message = `${diff.sku}: esperados ${diff.expected}, detectados ${diff.actual} (diff: +${diff.diff})`;
    
    if (diff.diff > 10) {
      severity = 'critical';
    }
  }
  
  // Caso 3: Baja confianza (incluso si diff = 0)
  if (diff.avg_confidence < 0.60) {
    shouldAlert = true;
    alertType = 'low_confidence';
    severity = 'critical';
    message = `${diff.sku}: Confianza baja (${diff.avg_confidence.toFixed(2)}). Validación manual requerida.`;
  }
  else if (diff.avg_confidence < 0.80 && !shouldAlert) {
    shouldAlert = true;
    alertType = 'low_confidence';
    severity = 'warning';
    message = `${diff.sku}: Confianza media (${diff.avg_confidence.toFixed(2)}). Revisar cuando sea posible.`;
  }
  
  if (shouldAlert) {
    await db.query(
      'INSERT INTO alerts (scan_item_id, alert_type, severity, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [scanItemId, alertType, severity, message, 'active']
    );  // ~50ms por insert
  }
}
```

**Tiempo por alerta**: ~50-70ms  
**Total** (asumiendo 2 alertas): ~100-140ms

---

### Etapa 8: Emisión WebSocket (30ms)

**Evento 1: scan_processed**
```javascript
io.to(`trolley_${trolleyId}`).emit('scan_processed', {
  scan_id: scanId,
  trolley_id: trolleyId,
  shelf_id: shelfId,
  items_detected: parsed.items.length,
  avg_confidence: avgConfidence,
  timestamp: new Date().toISOString()
});

// Payload size: ~200 bytes
```

**Evento 2: alert_created (por cada alerta)**
```javascript
for (const alert of alerts) {
  io.to(`trolley_${trolleyId}`).emit('alert_created', {
    alert_id: alert.id,
    type: alert.alert_type,
    severity: alert.severity,
    sku: alert.sku,
    message: alert.message,
    shelf_id: shelfId,
    trolley_id: trolleyId,
    created_at: alert.created_at
  });
  
  // Payload size: ~250 bytes por alerta
}
```

**Latencia de WebSocket**:
- Serialización JSON: ~5ms
- Network send: 10-20ms
- **Total**: 15-25ms por evento

**Total etapa**: 30-50ms (para 2 eventos)

---

## Resumen de Latencias

| Etapa | Tiempo (ms) | Acumulado (ms) |
|-------|-------------|----------------|
| 1. Captura + compresión | 500 | 500 |
| 2. Upload HTTP | 1500 | 2000 |
| 3. Almacenamiento | 200 | 2200 |
| 4. Vision LLM | 3500 | 5700 |
| 5. Procesamiento items | 300 | 6000 |
| 6. Cálculo de diffs | 350 | 6350 |
| 7. Generación de alertas | 200 | 6550 |
| 8. Emisión WebSocket | 30 | 6580 |
| 9. Renderizado dashboard | 100 | 6680 |

**Latencia total**: **~6.7 segundos**

**Objetivo MVP**: <10 segundos ✅

---

## Optimizaciones Posibles

### 1. Reducción de Latencia de LLM (Ahorro: ~1-2s)

**Estrategia**: Usar modelo más rápido para primera pasada
```javascript
const model = avgConfidencePrevious >= 0.85 ? 'gpt-4o-mini' : 'gpt-4o';
// Mini: 2-3s, pero menos preciso
// Full: 4-5s, más preciso
```

### 2. Batch de Queries (Ahorro: ~100-200ms)

**Actual**: 1 query por item para buscar product_id  
**Optimizado**: 1 query con `WHERE sku IN (...)`

```sql
SELECT id, sku FROM products WHERE sku IN ('COK-REG-330', 'WTR-REG-500', 'SNK-PRT-50');
-- Tiempo: ~40ms total vs ~90ms (3 × 30ms)
```

### 3. Compresión de Imagen Dinámica (Ahorro: variable)

**Estrategia**: Si confidence anterior fue alta, usar menor calidad
```javascript
const quality = lastConfidence >= 0.90 ? 0.70 : 0.80;
// Quality 70% → ~250 KB → -25% upload time
```

### 4. Edge Caching de SKUs (Ahorro: ~50ms)

**Estrategia**: Cachear product_id en el teléfono
```javascript
const cachedProductId = await AsyncStorage.getItem(`sku_${sku}`);
if (cachedProductId) {
  // No necesita query a DB
}
```

---

## Almacenamiento por Día

**Asumiendo**:
- 3 trolleys operando simultáneamente
- 8 horas de operación por día
- 3 shelves por trolley
- 12 fotos/min por shelf

**Cálculo**:
```
Fotos por día = 3 trolleys × 3 shelves × 12 fotos/min × 480 min
              = 51,840 fotos/día

Tamaño promedio = 350 KB/foto

Storage total = 51,840 × 350 KB
              = 18,144,000 KB
              = 17.3 GB/día
```

**Por semana**: 121 GB  
**Por mes**: ~520 GB

**Recomendación**: Archivar imágenes >7 días a cold storage (S3 Glacier) o eliminar si no hay auditoría pendiente.

---

## Referencias

- [Secuencia de Scan](../architecture/sequence-scan.md) — Diagrama detallado del flujo
- [Contratos de API](../api/contracts.md) — Especificación del endpoint POST /scan
- [JSON Schema para Visión](../api/vision-json-schema.md) — Formato del LLM

