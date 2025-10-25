# Secuencia de Scan

Este documento describe el flujo técnico completo desde que un teléfono captura una imagen hasta que el dashboard muestra alertas en tiempo real.

## Diagrama de Secuencia Completo

```mermaid
sequenceDiagram
    participant Phone as 📱 Mobile App<br/>(Shelf 1)
    participant API as 🔧 Express API
    participant FS as 💾 File Storage
    participant DB as 🗄️ Postgres
    participant LLM as 🤖 Vision LLM
    participant WS as 🌐 WebSocket
    participant Dash as 🖥️ Dashboard
    
    Note over Phone: Timer dispara cada 5s
    Phone->>Phone: Capturar foto con cámara
    Phone->>Phone: Comprimir a JPEG 1280px
    Phone->>Phone: Preparar FormData con metadata
    
    Phone->>API: POST /scan<br/>multipart/form-data
    Note over API: Validar request
    API->>API: Verificar JWT token
    API->>API: Validar campos requeridos
    
    API->>FS: Guardar imagen<br/>/scans/{flight}/{trolley}/{timestamp}_{shelf}.jpg
    FS-->>API: Path confirmado
    
    API->>DB: INSERT INTO scans<br/>(trolley_id, shelf_id, image_path,<br/>scanned_by, status='processing')
    DB-->>API: scan_id generado
    
    API-->>Phone: 202 Accepted<br/>{ scan_id, status: "processing" }
    
    Note over API: Procesamiento asíncrono
    API->>API: Leer imagen desde FS
    API->>API: Convertir a base64 o URL pública
    API->>API: Construir prompt con JSON Schema
    
    API->>LLM: POST /v1/chat/completions<br/>{ model, messages: [{ role, content: [text, image] }] }
    Note over LLM: Análisis de imagen<br/>(2-5 segundos)
    LLM-->>API: JSON response<br/>{ items: [{ sku, quantity, confidence, notes }] }
    
    API->>API: Parsear y validar JSON
    
    loop Para cada item detectado
        API->>DB: SELECT id FROM products WHERE sku = ?
        DB-->>API: product_id
        
        API->>DB: INSERT INTO scan_items<br/>(scan_id, product_id, detected_quantity,<br/>confidence, notes)
        DB-->>API: scan_item_id
    end
    
    API->>DB: UPDATE scans SET status='completed'<br/>WHERE id=scan_id
    
    Note over API: Cálculo de diferencias
    API->>DB: SELECT * FROM flight_requirements<br/>WHERE trolley_id=? AND flight_id=?
    DB-->>API: expected_quantities por SKU
    
    API->>DB: SELECT SUM(detected_quantity)<br/>FROM scan_items si<br/>JOIN scans s ON s.id=si.scan_id<br/>WHERE s.trolley_id=?<br/>GROUP BY product_id
    DB-->>API: actual_quantities por SKU
    
    loop Para cada SKU en requirements
        API->>API: diff = actual - expected
        
        alt diff != 0 OR confidence < 0.60
            API->>API: Determinar alert_type y severity
            API->>DB: INSERT INTO alerts<br/>(scan_item_id, alert_type,<br/>severity, message, status='active')
            DB-->>API: alert_id
            
            API->>WS: Emit "alert_created"<br/>{ alert_id, type, severity, message, sku }
            WS->>Dash: Push evento en tiempo real
            Dash->>Dash: Actualizar panel de alertas
            Dash->>Dash: Cambiar semáforo de shelf a 🟡 o 🔴
        end
    end
    
    API->>WS: Emit "scan_processed"<br/>{ scan_id, trolley_id, shelf_id,<br/>items_detected, avg_confidence }
    WS->>Dash: Push evento en tiempo real
    Dash->>Dash: Incrementar contador de scans
    Dash->>Dash: Actualizar timestamp "último scan"
    
    Note over Phone: Esperar 5 segundos
    Phone->>Phone: Timer dispara nuevamente
```

## Desglose Paso a Paso

### Paso 1: Captura en el Dispositivo Móvil (0-500ms)

**Trigger**: Timer de intervalo fijo de 5000ms

**Acciones**:
1. Activar cámara trasera con configuración predefinida
2. Capturar imagen en máxima resolución nativa
3. Aplicar compresión JPEG:
   - Quality: 80%
   - Max width: 1280px (height proporcional)
4. Calcular tamaño del archivo resultante
5. Preparar objeto FormData:
   ```javascript
   {
     image: <Blob>,
     flight_id: 123,
     trolley_id: 456,
     shelf_id: 1,
     captured_by: "user_001",
     metadata: JSON.stringify({
       resolution: "1280x960",
       size_kb: 342,
       format: "jpeg",
       timestamp: "2025-10-26T10:15:30.000Z"
     })
   }
   ```

**Tamaño esperado**: 200-400 KB por imagen

### Paso 2: Upload HTTP (500-2000ms)

**Endpoint**: `POST /api/scan`

**Headers**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

**Request Body** (multipart):
```
------WebKitFormBoundary
Content-Disposition: form-data; name="image"; filename="shelf_1.jpg"
Content-Type: image/jpeg

<binary JPEG data>
------WebKitFormBoundary
Content-Disposition: form-data; name="flight_id"

123
------WebKitFormBoundary
Content-Disposition: form-data; name="trolley_id"

456
------WebKitFormBoundary
...
```

**Validaciones del servidor**:
- Token JWT válido
- `flight_id` existe en DB
- `trolley_id` pertenece al flight
- `shelf_id` pertenece al trolley
- Archivo es imagen válida (JPEG/PNG)
- Tamaño < 10 MB

**Respuesta rápida (202 Accepted)**:
```json
{
  "scan_id": 789,
  "status": "processing",
  "message": "Scan recibido y en proceso",
  "timestamp": "2025-10-26T10:15:31.234Z"
}
```

**Manejo de errores**:
- `401 Unauthorized`: Token inválido
- `400 Bad Request`: Campos faltantes o inválidos
- `413 Payload Too Large`: Imagen > 10 MB
- `500 Internal Server Error`: Error de storage o DB

**Reintentos en el teléfono**:
1. Primer intento inmediato
2. Si falla, guardar en cola local (AsyncStorage)
3. Reintentar cada 30s hasta éxito
4. Máximo 3 reintentos, luego descartar

### Paso 3: Almacenamiento de Imagen (100-300ms)

**Ruta de archivo**:
```
/storage/scans/{flight_id}/{trolley_id}/{timestamp}_{shelf_id}.jpg
```

**Ejemplo**:
```
/storage/scans/123/456/2025-10-26T10-15-30-123Z_1.jpg
```

**Metadata guardada en DB**:
```sql
INSERT INTO scans (
  trolley_id, shelf_id, image_path, scanned_at, scanned_by, status, metadata
) VALUES (
  456, 1, '/storage/scans/123/456/2025-10-26T10-15-30-123Z_1.jpg',
  '2025-10-26 10:15:30', 1, 'processing',
  '{"size_kb": 342, "resolution": "1280x960", "format": "jpeg"}'::jsonb
) RETURNING id;
```

**Retorno**: `scan_id = 789`

### Paso 4: Llamada al Vision LLM (2000-5000ms)

**Preparación del prompt**:

```javascript
const prompt = `Eres un sistema de detección de productos en trolleys de catering aéreo.

Analiza esta imagen de una repisa y devuelve EXACTAMENTE este formato JSON:

{
  "items": [
    {
      "sku": "COK-REG-330",
      "quantity": 24,
      "confidence": 0.95,
      "notes": "Todos visibles claramente"
    }
  ]
}

SKUs válidos en el catálogo:
- COK-REG-330: Coca-Cola Regular 330ml (lata roja con logo blanco)
- WTR-REG-500: Agua Natural 500ml (botella transparente)
- SNK-PRT-50: Pretzels 50g (bolsa amarilla)

REGLAS:
1. Solo reporta SKUs del catálogo
2. Usa confidence entre 0.0 y 1.0
3. Si no estás seguro (confidence < 0.80), baja el score
4. Cuenta cuidadosamente las cantidades
5. Si un producto está parcialmente oculto, añade nota`;
```

**Request a OpenAI API**:
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "<prompt above>" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]
    }
  ],
  "response_format": { "type": "json_object" },
  "max_tokens": 500
}
```

**Response esperada**:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"items\":[{\"sku\":\"COK-REG-330\",\"quantity\":23,\"confidence\":0.87,\"notes\":null},{\"sku\":\"WTR-REG-500\",\"quantity\":30,\"confidence\":0.92,\"notes\":null}]}"
      }
    }
  ]
}
```

**Parseo y validación**:
```javascript
const parsed = JSON.parse(response.choices[0].message.content);
if (!parsed.items || !Array.isArray(parsed.items)) {
  throw new Error('Invalid JSON structure');
}
// Continuar con inserción en DB
```

### Paso 5: Inserción de Items Detectados (100-500ms)

Para cada item en `parsed.items`:

```sql
-- 1. Buscar product_id por SKU
SELECT id FROM products WHERE sku = 'COK-REG-330';
-- Retorna: product_id = 1

-- 2. Insertar scan_item
INSERT INTO scan_items (scan_id, product_id, detected_quantity, confidence, notes)
VALUES (789, 1, 23, 0.8700, NULL)
RETURNING id;
-- Retorna: scan_item_id = 1001
```

**Si el SKU no existe en catálogo**:
```sql
-- Opción 1: Ignorar silenciosamente y registrar en logs
-- Opción 2: Insertar como "unknown_sku" con product_id = NULL
-- Para MVP: Opción 1 (no insertar)
```

**Actualizar estado del scan**:
```sql
UPDATE scans SET status = 'completed' WHERE id = 789;
```

### Paso 6: Cálculo de Diferencias (200-500ms)

**Query para obtener requirements**:
```sql
SELECT 
  fr.product_id,
  p.sku,
  fr.expected_quantity,
  fr.priority
FROM flight_requirements fr
JOIN products p ON p.id = fr.product_id
WHERE fr.flight_id = 123 AND fr.trolley_id = 456;
```

**Query para obtener actuales**:
```sql
SELECT 
  si.product_id,
  SUM(si.detected_quantity) as total_detected,
  AVG(si.confidence) as avg_confidence
FROM scan_items si
JOIN scans s ON s.id = si.scan_id
WHERE s.trolley_id = 456 
  AND s.status = 'completed'
  AND s.scanned_at >= (NOW() - INTERVAL '10 minutes')
GROUP BY si.product_id;
```

**Cálculo de diff**:
```javascript
const diffs = requirements.map(req => {
  const actual = actuals.find(a => a.product_id === req.product_id);
  return {
    product_id: req.product_id,
    sku: req.sku,
    expected: req.expected_quantity,
    actual: actual?.total_detected || 0,
    diff: (actual?.total_detected || 0) - req.expected_quantity,
    avg_confidence: actual?.avg_confidence || 0,
    priority: req.priority
  };
});
```

### Paso 7: Generación de Alertas (100-300ms)

Para cada diff calculado:

```javascript
if (diff.diff !== 0 || diff.avg_confidence < 0.60) {
  const alert = {
    scan_item_id: scanItemId,
    alert_type: diff.diff < 0 ? 'missing_item' 
                : diff.diff > 0 ? 'excess_item' 
                : 'low_confidence',
    severity: (diff.priority === 'critical' || diff.avg_confidence < 0.60) 
              ? 'critical' : 'warning',
    message: `${diff.sku}: esperados ${diff.expected}, detectados ${diff.actual} (diff: ${diff.diff})`,
    status: 'active'
  };
  
  await db.query('INSERT INTO alerts (...) VALUES (...)', alert);
}
```

**Ejemplo de alerta generada**:
```sql
INSERT INTO alerts (scan_item_id, alert_type, severity, message, status)
VALUES (1001, 'quantity_mismatch', 'warning', 
        'COK-REG-330: esperados 24, detectados 23 (diff: -1)', 'active')
RETURNING id;
-- alert_id = 501
```

### Paso 8: Emisión en Tiempo Real (10-50ms)

**Evento 1: scan_processed**
```javascript
io.to(`trolley_${trolley_id}`).emit('scan_processed', {
  scan_id: 789,
  trolley_id: 456,
  shelf_id: 1,
  items_detected: 2,
  avg_confidence: 0.895,
  timestamp: new Date().toISOString()
});
```

**Evento 2: alert_created (si aplica)**
```javascript
io.to(`trolley_${trolley_id}`).emit('alert_created', {
  alert_id: 501,
  type: 'quantity_mismatch',
  severity: 'warning',
  sku: 'COK-REG-330',
  message: 'COK-REG-330: esperados 24, detectados 23 (diff: -1)',
  shelf_id: 1,
  created_at: new Date().toISOString()
});
```

### Paso 9: Actualización del Dashboard (50-200ms)

**Handler en el cliente**:
```javascript
socket.on('scan_processed', (data) => {
  // Actualizar contador de scans
  updateScanCount(data.shelf_id, +1);
  
  // Actualizar timestamp
  updateLastScanTime(data.shelf_id, data.timestamp);
  
  // Actualizar badge de confianza
  updateConfidenceBadge(data.shelf_id, data.avg_confidence);
});

socket.on('alert_created', (data) => {
  // Añadir alerta al panel superior
  prependAlert(data);
  
  // Actualizar semáforo de repisa
  if (data.severity === 'critical') {
    setShelfStatus(data.shelf_id, 'red');
  } else {
    setShelfStatus(data.shelf_id, 'yellow');
  }
  
  // Mostrar notificación toast
  showToast(data.message, data.severity);
});
```

## Latencias Totales

| Paso | Tiempo (ms) | Acumulado |
|------|------------|-----------|
| Captura + compresión | 500 | 500 |
| Upload HTTP | 1500 | 2000 |
| Almacenamiento | 200 | 2200 |
| Vision LLM | 3500 | 5700 |
| Insert scan_items | 300 | 6000 |
| Calcular diffs | 350 | 6350 |
| Generar alertas | 200 | 6550 |
| Emitir WebSocket | 30 | 6580 |
| Renderizar en dashboard | 100 | 6680 |

**Latencia total esperada**: **~6.5 segundos** desde captura hasta alerta visible

**Objetivo MVP**: <10 segundos

## Manejo de Errores

### Error en Upload
- **Síntoma**: Timeout o error de red
- **Acción**: Guardar en cola offline, reintentar en 30s

### Error en Vision LLM
- **Síntoma**: 429 Rate Limit, 500 Internal Error, timeout
- **Acción**: Marcar scan con `status='failed'`, reintentar después con exponential backoff

### JSON Inválido de LLM
- **Síntoma**: Parsing error
- **Acción**: Registrar respuesta raw en logs, marcar scan como failed, notificar en dashboard

### SKU Desconocido
- **Síntoma**: SKU no existe en catálogo
- **Acción**: Ignorar item, registrar en logs con mensaje "Unknown SKU detected: XYZ"

---

## Referencias

- [Arquitectura de Contexto](context-architecture.md) — Diagrama general del sistema
- [Contratos de API](../api/contracts.md) — Especificación del endpoint POST /scan
- [JSON Schema para Visión](../api/vision-json-schema.md) — Formato esperado del LLM

