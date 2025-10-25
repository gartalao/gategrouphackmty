# API Backend

Servidor Express.js que maneja uploads de imágenes, integración con Vision LLM, cálculo de diferencias, y emisión de eventos en tiempo real.

**⚠️ NOTA**: Este directorio NO contiene código fuente. Esta documentación describe conceptualmente el backend del sistema Smart Trolley.

---

## Propósito

Servidor central que coordina:
- Recepción de uploads de imágenes desde apps móviles
- Análisis de imágenes con Vision LLM (OpenAI/Anthropic)
- Cálculo de diferencias vs flight_requirements
- Generación de alertas
- Emisión de eventos vía WebSocket al dashboard
- Endpoints REST para consultas de datos

---

## Stack Tecnológico (Conceptual)

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: PostgreSQL (Neon serverless)
- **ORM/Query**: pg (node-postgres)
- **WebSocket**: Socket.io
- **Upload**: Multer
- **Auth**: jsonwebtoken
- **Validation**: Ajv
- **Logging**: Winston

---

## Estructura de Directorios

```
apps/api/
├─ src/
│  ├─ index.js              → Entry point
│  ├─ config/
│  │  ├─ db.js              → Postgres connection pool
│  │  └─ socket.js          → Socket.io setup
│  ├─ routes/
│  │  ├─ auth.js            → POST /auth/login
│  │  ├─ flights.js         → GET /flights/:id
│  │  ├─ scans.js           → POST /scan
│  │  ├─ trolleys.js        → GET /trolleys/:id/status
│  │  └─ kpis.js            → GET /kpis/overview
│  ├─ controllers/
│  │  ├─ scanController.js  → Lógica de scans
│  │  └─ visionController.js→ Llamadas a Vision LLM
│  ├─ services/
│  │  ├─ visionService.js   → Integración con OpenAI
│  │  ├─ diffService.js     → Cálculo de diffs
│  │  └─ alertService.js    → Generación de alertas
│  └─ middlewares/
│     ├─ auth.js            → Verificación JWT
│     └─ upload.js          → Multer config
├─ storage/
│  └─ scans/                → Imágenes guardadas
├─ .env                     → Variables de entorno
└─ package.json
```

---

## Endpoints Principales

### Autenticación

#### POST /auth/login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"operator01","password":"password123"}'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "operator01",
    "role": "operator"
  }
}
```

---

### Scans

#### POST /scan

```bash
curl -X POST http://localhost:3001/api/scan \
  -H "Authorization: Bearer {token}" \
  -F "image=@shelf_1.jpg" \
  -F "flight_id=123" \
  -F "trolley_id=456" \
  -F "shelf_id=1" \
  -F "captured_by=operator01"
```

**Response** (202 Accepted):
```json
{
  "scan_id": 789,
  "status": "processing",
  "message": "Scan recibido y en proceso",
  "timestamp": "2025-10-26T10:15:31Z"
}
```

---

### Trolleys

#### GET /trolleys/:id/status

```bash
curl -X GET http://localhost:3001/api/trolleys/456/status \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "trolley_id": 456,
  "trolley_code": "TRLLY-001",
  "status": "in_progress",
  "shelves": [
    {
      "shelf_id": 1,
      "position": "top",
      "avg_confidence": 0.92,
      "active_alerts": 0,
      "status": "green"
    }
  ],
  "summary": {
    "avg_confidence": 0.87,
    "active_alerts": 1
  }
}
```

---

### KPIs

#### GET /kpis/overview

```bash
curl -X GET "http://localhost:3001/api/kpis/overview?date=2025-10-26" \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "metrics": {
    "accuracy": { "percentage": 92.5 },
    "avg_time_per_trolley": { "seconds": 450 },
    "avg_confidence": 0.87,
    "alerts": { "active": 3, "resolved": 15 }
  }
}
```

---

## WebSocket

### Eventos Emitidos

#### `scan_processed`

```json
{
  "event": "scan_processed",
  "scan_id": 789,
  "trolley_id": 456,
  "shelf_id": 1,
  "items_detected": 3,
  "avg_confidence": 0.89,
  "timestamp": "2025-10-26T10:15:34Z"
}
```

#### `alert_created`

```json
{
  "event": "alert_created",
  "alert_id": 501,
  "type": "missing_item",
  "severity": "warning",
  "sku": "COK-REG-330",
  "message": "Faltante 1 Coca-Cola",
  "shelf_id": 1,
  "trolley_id": 456
}
```

---

## Configuración

### Variables de Entorno

Ver [Variables de Entorno](../../docs/setup/env-variables.md).

**Archivo**: `.env`

```bash
PORT=3001
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
OPENAI_API_KEY=sk-proj-...
JWT_SECRET=your_secret_key_here
STORAGE_DIR=./storage/scans
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

---

## Flujo de Procesamiento de Scan

```
[Mobile App] POST /scan
  ↓
[Multer] Guarda imagen en /storage
  ↓
[DB] INSERT scan (status='processing')
  ↓
[Response 202] Retorna scan_id
  ↓
[Background] Procesar async:
  ├─ [Vision LLM] Analizar imagen
  ├─ [Parse] Validar JSON
  ├─ [DB] INSERT scan_items
  ├─ [DB] UPDATE scan status='completed'
  ├─ [Diff Service] Calcular diferencias
  ├─ [Alert Service] Generar alertas
  └─ [WebSocket] Emitir eventos
     ↓
  [Dashboard] Recibe y actualiza UI
```

---

## Integración con Vision LLM

### OpenAI API

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: VISION_PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    }],
    response_format: { type: 'json_object' },
    max_tokens: 1000
  })
});
```

### Validación de Response

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();
const validate = ajv.compile(VISION_JSON_SCHEMA);

const parsed = JSON.parse(response.choices[0].message.content);

if (!validate(parsed)) {
  throw new Error('Invalid JSON from Vision LLM');
}

// Continuar con parsed.items
```

---

## Base de Datos

### Connection Pool

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});
```

### Queries de Ejemplo

```javascript
// Insertar scan
const result = await pool.query(
  'INSERT INTO scans (trolley_id, shelf_id, image_path, status) VALUES ($1, $2, $3, $4) RETURNING id',
  [trolleyId, shelfId, imagePath, 'processing']
);

// Calcular diffs
const diffs = await pool.query(`
  SELECT 
    fr.product_id,
    fr.expected_quantity,
    COALESCE(SUM(si.detected_quantity), 0) as actual_quantity,
    COALESCE(SUM(si.detected_quantity), 0) - fr.expected_quantity as diff
  FROM flight_requirements fr
  LEFT JOIN scan_items si ON si.product_id = fr.product_id
  WHERE fr.trolley_id = $1
  GROUP BY fr.product_id, fr.expected_quantity
`, [trolleyId]);
```

---

## Seguridad

### JWT Middleware

```javascript
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
```

### CORS

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

---

## Logging

### Winston Setup

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Uso
logger.info('Scan processed', { scan_id: 789, trolley_id: 456 });
logger.error('Vision LLM error', { error: error.message });
```

---

## Testing

### Health Check

```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":"2025-10-26T10:00:00Z"}
```

### Database Connection

```bash
curl http://localhost:3001/health/db
# Response: {"db":"connected","timestamp":"2025-10-26T10:00:00Z"}
```

---

## Deployment

### Render

1. Conectar repo de GitHub
2. Seleccionar "Web Service"
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Agregar variables de entorno
6. Deploy

### Railway

Similar a Render, con mejor DX para Node.js

---

## Troubleshooting

### Error: "Database connection refused"

- Verificar `DATABASE_URL` en `.env`
- Verificar que Neon DB está activo
- Verificar que incluye `?sslmode=require`

### Error: "OpenAI rate limit"

- Verificar tier de cuenta de OpenAI
- Implementar exponential backoff
- Usar API key de backup

### WebSocket no emite eventos

- Verificar que `io.emit()` se llama correctamente
- Verificar que dashboard está conectado
- Revisar logs de Socket.io

---

## Referencias

- [API Express Setup](../../docs/setup/api-express-setup.md) — Guía completa
- [Contratos de API](../../docs/api/contracts.md) — Especificación de endpoints
- [Variables de Entorno](../../docs/setup/env-variables.md) — Configuración
- [JSON Schema para Visión](../../docs/api/vision-json-schema.md) — Integración con LLM

