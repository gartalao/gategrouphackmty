# Contratos de API

Este documento especifica todos los endpoints REST y WebSocket del backend del MVP Smart Trolley.

**Base URL**: `http://localhost:3001/api` (desarrollo) o `https://api.smarttrolley.com/api` (producción)

## Autenticación

Todos los endpoints (excepto `/auth/login`) requieren **JWT Bearer Token** en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### POST /auth/login

Autentica un usuario y retorna un token JWT.

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "operator01",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoib3BlcmF0b3IwMSIsInJvbGUiOiJvcGVyYXRvciIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxNjMwMDg2NDAwfQ.abc123",
  "user": {
    "id": 1,
    "username": "operator01",
    "full_name": "Juan Pérez",
    "role": "operator"
  },
  "expires_in": 86400
}
```

**Errores**:
- `401 Unauthorized`: Credenciales inválidas
- `400 Bad Request`: Campos faltantes

---

## Flights

### GET /flights/:id

Obtiene información detallada de un vuelo específico.

**Request**:
```http
GET /api/flights/123
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "flight_number": "AA2345",
  "departure_time": "2025-10-26T14:30:00Z",
  "origin": "MEX",
  "destination": "JFK",
  "status": "scheduled",
  "trolleys": [
    {
      "id": 456,
      "trolley_code": "TRLLY-001",
      "status": "in_progress",
      "total_shelves": 3
    }
  ],
  "created_at": "2025-10-25T08:00:00Z"
}
```

**Errores**:
- `404 Not Found`: Vuelo no existe
- `401 Unauthorized`: Token inválido

---

### GET /flights/:id/requirements

Obtiene los requisitos de productos para todos los trolleys de un vuelo.

**Request**:
```http
GET /api/flights/123/requirements
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "flight_id": 123,
  "flight_number": "AA2345",
  "requirements": [
    {
      "trolley_id": 456,
      "trolley_code": "TRLLY-001",
      "products": [
        {
          "product_id": 1,
          "sku": "COK-REG-330",
          "name": "Coca-Cola Regular 330ml",
          "expected_quantity": 24,
          "priority": "normal"
        },
        {
          "product_id": 2,
          "sku": "WTR-REG-500",
          "name": "Agua Natural 500ml",
          "expected_quantity": 30,
          "priority": "critical"
        }
      ]
    }
  ]
}
```

**Errores**:
- `404 Not Found`: Vuelo no existe o no tiene requisitos

---

## Scans

### POST /scan

**Endpoint principal** para subir una imagen capturada por el teléfono Android.

**Request**:
```http
POST /api/scan
Authorization: Bearer {token}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

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
Content-Disposition: form-data; name="shelf_id"

1
------WebKitFormBoundary
Content-Disposition: form-data; name="captured_by"

user_001
------WebKitFormBoundary--
```

**Campos del FormData**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `image` | File | ✅ | Imagen JPEG/PNG, máx 10 MB |
| `flight_id` | Integer | ✅ | ID del vuelo |
| `trolley_id` | Integer | ✅ | ID del trolley |
| `shelf_id` | Integer | ✅ | ID de la repisa (1-3) |
| `captured_by` | String | ✅ | Username del operador |

**Response** (202 Accepted):
```json
{
  "scan_id": 789,
  "status": "processing",
  "message": "Scan recibido y en proceso de análisis",
  "timestamp": "2025-10-26T10:15:31.234Z",
  "image_path": "/storage/scans/123/456/2025-10-26T10-15-30-123Z_1.jpg"
}
```

**Response** (tras procesamiento completo, vía WebSocket):
```json
{
  "event": "scan_processed",
  "scan_id": 789,
  "trolley_id": 456,
  "shelf_id": 1,
  "status": "completed",
  "items_detected": [
    {
      "scan_item_id": 1001,
      "product_id": 1,
      "sku": "COK-REG-330",
      "name": "Coca-Cola Regular 330ml",
      "detected_quantity": 23,
      "confidence": 0.8750,
      "notes": null
    },
    {
      "scan_item_id": 1002,
      "product_id": 2,
      "sku": "WTR-REG-500",
      "name": "Agua Natural 500ml",
      "detected_quantity": 30,
      "confidence": 0.9200,
      "notes": null
    }
  ],
  "avg_confidence": 0.8975,
  "processing_time_ms": 3542,
  "timestamp": "2025-10-26T10:15:34.776Z"
}
```

**Errores**:
- `400 Bad Request`: Campos faltantes o formato inválido
- `401 Unauthorized`: Token inválido o expirado
- `413 Payload Too Large`: Imagen > 10 MB
- `422 Unprocessable Entity`: `flight_id`, `trolley_id` o `shelf_id` no válidos
- `500 Internal Server Error`: Error al guardar imagen o conectar con DB
- `503 Service Unavailable`: Vision LLM no disponible

**Notas**:
- El endpoint retorna inmediatamente con `202 Accepted`
- El procesamiento continúa en background (2-5 segundos)
- Resultado completo se emite vía WebSocket (ver sección WebSocket)

---

## Trolleys

### GET /trolleys/:id/status

Obtiene el estado actual de un trolley, incluyendo scans recientes y alertas activas.

**Request**:
```http
GET /api/trolleys/456/status
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "trolley_id": 456,
  "trolley_code": "TRLLY-001",
  "flight_id": 123,
  "flight_number": "AA2345",
  "status": "in_progress",
  "shelves": [
    {
      "shelf_id": 1,
      "shelf_number": 1,
      "position": "top",
      "last_scan_at": "2025-10-26T10:15:30Z",
      "total_scans": 12,
      "avg_confidence": 0.8875,
      "status": "green",
      "active_alerts": 0
    },
    {
      "shelf_id": 2,
      "shelf_number": 2,
      "position": "middle",
      "last_scan_at": "2025-10-26T10:15:28Z",
      "total_scans": 11,
      "avg_confidence": 0.7650,
      "status": "yellow",
      "active_alerts": 1
    },
    {
      "shelf_id": 3,
      "shelf_number": 3,
      "position": "bottom",
      "last_scan_at": "2025-10-26T10:15:25Z",
      "total_scans": 10,
      "avg_confidence": 0.9100,
      "status": "green",
      "active_alerts": 0
    }
  ],
  "summary": {
    "total_scans": 33,
    "avg_confidence": 0.8542,
    "active_alerts": 1,
    "requirements_met": 8,
    "requirements_pending": 4,
    "overall_status": "yellow"
  },
  "alerts": [
    {
      "alert_id": 501,
      "type": "quantity_mismatch",
      "severity": "warning",
      "message": "COK-REG-330: esperados 24, detectados 23 (diff: -1)",
      "shelf_id": 2,
      "created_at": "2025-10-26T10:15:34Z",
      "status": "active"
    }
  ]
}
```

**Errores**:
- `404 Not Found`: Trolley no existe
- `401 Unauthorized`: Token inválido

---

## KPIs

### GET /kpis/overview

Obtiene métricas agregadas del sistema para un período específico.

**Request**:
```http
GET /api/kpis/overview?date=2025-10-26&flight_id=123
Authorization: Bearer {token}
```

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | String (YYYY-MM-DD) | ❌ | Fecha específica (default: hoy) |
| `flight_id` | Integer | ❌ | Filtrar por vuelo específico |
| `trolley_id` | Integer | ❌ | Filtrar por trolley específico |

**Response** (200 OK):
```json
{
  "date": "2025-10-26",
  "flight_id": 123,
  "metrics": {
    "accuracy": {
      "percentage": 92.5,
      "scans_correct": 37,
      "scans_total": 40,
      "trend": "+2.3%"
    },
    "avg_time_per_trolley": {
      "seconds": 420,
      "formatted": "7m 00s",
      "trend": "-30s"
    },
    "confidence": {
      "average": 0.8675,
      "by_shelf": {
        "top": 0.8950,
        "middle": 0.8200,
        "bottom": 0.8875
      }
    },
    "errors": {
      "total": 3,
      "by_type": {
        "missing_item": 1,
        "excess_item": 0,
        "quantity_mismatch": 1,
        "low_confidence": 1
      },
      "by_sku": [
        { "sku": "COK-REG-330", "errors": 2 },
        { "sku": "SNK-PRT-50", "errors": 1 }
      ]
    },
    "alerts": {
      "total_created": 5,
      "active": 1,
      "resolved": 4,
      "critical": 0,
      "avg_resolution_time_seconds": 78
    },
    "scans": {
      "total": 40,
      "processing": 0,
      "completed": 38,
      "failed": 2
    }
  },
  "generated_at": "2025-10-26T10:30:00Z"
}
```

**Errores**:
- `400 Bad Request`: Formato de fecha inválido
- `401 Unauthorized`: Token inválido

---

## WebSocket

### Conexión: /ws

Endpoint para comunicación en tiempo real entre backend y dashboard.

**URL**: `ws://localhost:3001/ws` o `wss://api.smarttrolley.com/ws`

**Autenticación**: Enviar token en query string al conectar:
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Eventos Emitidos por el Servidor

#### 1. `scan_processed`

Emitido cuando un scan se completa exitosamente.

**Payload**:
```json
{
  "event": "scan_processed",
  "scan_id": 789,
  "trolley_id": 456,
  "shelf_id": 1,
  "items_detected": 2,
  "avg_confidence": 0.8975,
  "timestamp": "2025-10-26T10:15:34Z"
}
```

**Handler sugerido** (JavaScript):
```javascript
socket.on('scan_processed', (data) => {
  console.log(`Scan ${data.scan_id} procesado en shelf ${data.shelf_id}`);
  updateShelfLastScan(data.shelf_id, data.timestamp);
  updateConfidenceBadge(data.shelf_id, data.avg_confidence);
});
```

---

#### 2. `alert_created`

Emitido cuando se genera una nueva alerta por discrepancia o baja confianza.

**Payload**:
```json
{
  "event": "alert_created",
  "alert_id": 501,
  "type": "quantity_mismatch",
  "severity": "warning",
  "sku": "COK-REG-330",
  "message": "COK-REG-330: esperados 24, detectados 23 (diff: -1)",
  "shelf_id": 2,
  "trolley_id": 456,
  "created_at": "2025-10-26T10:15:34Z"
}
```

**Handler sugerido**:
```javascript
socket.on('alert_created', (data) => {
  console.log(`Nueva alerta: ${data.message}`);
  prependAlertToPanel(data);
  if (data.severity === 'critical') {
    setShelfStatus(data.shelf_id, 'red');
    playAlertSound();
  } else {
    setShelfStatus(data.shelf_id, 'yellow');
  }
});
```

---

### Eventos Enviados por el Cliente (Opcional para MVP)

#### `subscribe_trolley`

El cliente puede suscribirse a eventos de un trolley específico.

**Envío**:
```javascript
socket.emit('subscribe_trolley', { trolley_id: 456 });
```

**Confirmación**:
```json
{
  "event": "subscribed",
  "trolley_id": 456,
  "message": "Suscripción exitosa"
}
```

---

## Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| **200 OK** | Éxito | GET requests exitosos |
| **201 Created** | Recurso creado | POST que crea entidad nueva |
| **202 Accepted** | Aceptado para procesamiento | POST /scan (procesamiento asíncrono) |
| **400 Bad Request** | Request inválido | Campos faltantes, formato incorrecto |
| **401 Unauthorized** | No autenticado | Token faltante o inválido |
| **403 Forbidden** | Sin permisos | Usuario no tiene acceso al recurso |
| **404 Not Found** | Recurso no existe | ID de flight/trolley inexistente |
| **413 Payload Too Large** | Payload muy grande | Imagen > 10 MB |
| **422 Unprocessable Entity** | Entidad no procesable | Datos válidos pero lógicamente incorrectos |
| **500 Internal Server Error** | Error del servidor | Bug en backend, error de DB |
| **503 Service Unavailable** | Servicio no disponible | Vision LLM caído, DB no responde |

---

## Seguridad

### Generación de JWT

**Algoritmo**: HS256 (HMAC con SHA-256)

**Claims**:
```json
{
  "userId": 1,
  "username": "operator01",
  "role": "operator",
  "iat": 1630000000,
  "exp": 1630086400
}
```

**Secret**: Almacenado en variable de entorno `JWT_SECRET`

**Expiración**: 24 horas (86400 segundos)

### Rate Limiting (Opcional para MVP)

Para producción futura:
- **Login**: 5 intentos por minuto por IP
- **Scans**: 20 requests por minuto por usuario
- **KPIs**: 60 requests por minuto

### CORS

Permitir orígenes:
- `http://localhost:3000` (Next.js dev)
- `https://dashboard.smarttrolley.com` (producción)

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://dashboard.smarttrolley.com'],
  credentials: true
}));
```

---

## Ejemplos de Uso con `curl`

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"operator01","password":"securePassword123"}'
```

### Obtener Flight
```bash
curl -X GET http://localhost:3001/api/flights/123 \
  -H "Authorization: Bearer eyJhbGci..."
```

### Subir Scan
```bash
curl -X POST http://localhost:3001/api/scan \
  -H "Authorization: Bearer eyJhbGci..." \
  -F "image=@shelf_1.jpg" \
  -F "flight_id=123" \
  -F "trolley_id=456" \
  -F "shelf_id=1" \
  -F "captured_by=user_001"
```

### Obtener KPIs
```bash
curl -X GET "http://localhost:3001/api/kpis/overview?date=2025-10-26&flight_id=123" \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## Referencias

- [Modelo de Datos](../architecture/data-model.md) — Estructura de DB que alimenta estos endpoints
- [JSON Schema para Visión](vision-json-schema.md) — Formato de respuesta del LLM
- [Secuencia de Scan](../architecture/sequence-scan.md) — Flujo completo de POST /scan

