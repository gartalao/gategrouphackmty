# Setup de API Backend (Express)

Guía conceptual para la configuración del servidor backend que maneja scans, Vision LLM, y WebSocket.

**Nota**: Este documento es solo documentación. No contiene código real.

---

## Resumen del Backend

**Propósito**: Servidor central que coordina captura de imágenes, análisis con Vision LLM, cálculo de diferencias, y emisión de eventos.

**Responsabilidades**:
- ✅ Recibir uploads de imágenes desde mobile apps
- ✅ Almacenar imágenes en filesystem o S3
- ✅ Llamar a Vision LLM (OpenAI/Anthropic)
- ✅ Guardar resultados en Postgres
- ✅ Calcular diffs contra flight_requirements
- ✅ Generar alertas
- ✅ Emitir eventos vía WebSocket al dashboard
- ✅ Proveer endpoints REST para consultas

---

## Tecnologías

| Tecnología | Uso | Por Qué |
|------------|-----|---------|
| **Node.js 18+** | Runtime | Ampliamente usado, buen ecosistema |
| **Express** | Web framework | Minimalista, flexible, rápido setup |
| **Multer** | Upload de archivos | Manejo de multipart/form-data |
| **pg (node-postgres)** | Driver de PostgreSQL | Oficial, connection pooling |
| **Socket.io** | WebSocket | Bidireccional, fallback a polling |
| **dotenv** | Variables de entorno | Estándar de facto |
| **bcrypt** | Hash de passwords | Seguro para almacenar contraseñas |
| **jsonwebtoken** | Autenticación JWT | Tokens stateless |
| **Ajv** | Validación JSON Schema | Validar respuestas de Vision LLM |

---

## Estructura de Directorios

```
apps/api/
├─ src/
│  ├─ index.js              → Entry point, inicializa servidor
│  ├─ config/
│  │  ├─ db.js              → Configuración de Postgres connection pool
│  │  └─ socket.js          → Configuración de Socket.io
│  ├─ routes/
│  │  ├─ auth.js            → POST /auth/login
│  │  ├─ flights.js         → GET /flights/:id, /flights/:id/requirements
│  │  ├─ scans.js           → POST /scan
│  │  ├─ trolleys.js        → GET /trolleys/:id/status
│  │  └─ kpis.js            → GET /kpis/overview
│  ├─ controllers/
│  │  ├─ scanController.js  → Lógica de procesamiento de scans
│  │  └─ visionController.js → Llamadas a Vision LLM
│  ├─ middlewares/
│  │  ├─ auth.js            → Verificación de JWT
│  │  └─ upload.js          → Configuración de Multer
│  ├─ services/
│  │  ├─ visionService.js   → Integración con OpenAI/Anthropic
│  │  ├─ diffService.js     → Cálculo de diferencias
│  │  └─ alertService.js    → Generación de alertas
│  └─ utils/
│     ├─ logger.js          → Winston logger
│     └─ validators.js      → Validadores de input
├─ storage/                 → Almacenamiento de imágenes (local)
│  └─ scans/
│     └─ {flight_id}/
│        └─ {trolley_id}/
│           └─ {timestamp}_{shelf_id}.jpg
├─ .env                     → Variables de entorno
├─ package.json
└─ README.md
```

---

## Configuración de Express

### `src/index.js` (Entry Point)

**Conceptualmente**:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const { pool } = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
});

// Middlewares globales
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hacer io accesible en todas las rutas
app.set('io', io);

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/flights', require('./routes/flights'));
app.use('/api/scan', require('./routes/scans'));
app.use('/api/trolleys', require('./routes/trolleys'));
app.use('/api/kpis', require('./routes/kpis'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('subscribe_trolley', ({ trolley_id }) => {
    socket.join(`trolley_${trolley_id}`);
    socket.emit('subscribed', { trolley_id });
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
```

---

## Conexión a Base de Datos

### `src/config/db.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // Neon requiere SSL
  max: 10,  // Máximo 10 conexiones concurrentes
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Test de conexión al iniciar
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error de conexión a DB:', err);
  } else {
    console.log('✅ Conectado a Postgres:', res.rows[0].now);
  }
});

module.exports = { pool };
```

---

## Endpoint: POST /scan (Core del Sistema)

### `src/routes/scans.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const { handleScan } = require('../controllers/scanController');

router.post('/', authenticateJWT, upload.single('image'), handleScan);

module.exports = router;
```

---

### `src/middlewares/upload.js` (Multer Config)

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { flight_id, trolley_id } = req.body;
    const dir = path.join(__dirname, '../../storage/scans', flight_id, trolley_id);
    
    // Crear directorio si no existe
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { shelf_id } = req.body;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}_${shelf_id}.jpg`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos JPEG y PNG'));
    }
  }
});

module.exports = { upload };
```

---

### `src/controllers/scanController.js`

```javascript
const { pool } = require('../config/db');
const { analyzeImageWithVision } = require('../services/visionService');
const { calculateDiffs } = require('../services/diffService');
const { generateAlerts } = require('../services/alertService');

async function handleScan(req, res) {
  const { flight_id, trolley_id, shelf_id, captured_by } = req.body;
  const imagePath = req.file.path;
  const io = req.app.get('io');
  
  try {
    // 1. Validar campos
    if (!flight_id || !trolley_id || !shelf_id) {
      return res.status(400).json({ error: 'Campos faltantes' });
    }
    
    // 2. Insertar scan en DB con status='processing'
    const scanResult = await pool.query(
      `INSERT INTO scans (trolley_id, shelf_id, image_path, scanned_at, scanned_by, status, metadata)
       VALUES ($1, $2, $3, NOW(), (SELECT id FROM users WHERE username=$4), 'processing', $5)
       RETURNING id`,
      [trolley_id, shelf_id, imagePath, captured_by, JSON.stringify({ size_kb: req.file.size / 1024 })]
    );
    
    const scanId = scanResult.rows[0].id;
    
    // 3. Respuesta inmediata (202 Accepted)
    res.status(202).json({
      scan_id: scanId,
      status: 'processing',
      message: 'Scan recibido y en proceso',
      timestamp: new Date().toISOString()
    });
    
    // 4. Procesamiento asíncrono en background
    processScansAsync(scanId, imagePath, trolley_id, shelf_id, flight_id, io);
    
  } catch (error) {
    console.error('Error en handleScan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function processScanAsync(scanId, imagePath, trolleyId, shelfId, flightId, io) {
  try {
    // 5. Llamar a Vision LLM
    const visionResult = await analyzeImageWithVision(imagePath);
    
    // 6. Insertar scan_items
    for (const item of visionResult.items) {
      const productResult = await pool.query(
        'SELECT id FROM products WHERE sku = $1',
        [item.sku]
      );
      
      if (productResult.rows.length === 0) {
        console.warn(`SKU desconocido: ${item.sku}`);
        continue;
      }
      
      const productId = productResult.rows[0].id;
      
      await pool.query(
        `INSERT INTO scan_items (scan_id, product_id, detected_quantity, confidence, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [scanId, productId, item.quantity, item.confidence, item.notes]
      );
    }
    
    // 7. Actualizar status del scan
    await pool.query('UPDATE scans SET status = $1 WHERE id = $2', ['completed', scanId]);
    
    // 8. Calcular diffs
    const diffs = await calculateDiffs(flightId, trolleyId);
    
    // 9. Generar alertas
    const alerts = await generateAlerts(diffs, scanId, shelfId, trolleyId);
    
    // 10. Emitir eventos WebSocket
    io.to(`trolley_${trolleyId}`).emit('scan_processed', {
      scan_id: scanId,
      trolley_id: trolleyId,
      shelf_id: shelfId,
      items_detected: visionResult.items.length,
      avg_confidence: visionResult.items.reduce((s, i) => s + i.confidence, 0) / visionResult.items.length,
      timestamp: new Date().toISOString()
    });
    
    for (const alert of alerts) {
      io.to(`trolley_${trolleyId}`).emit('alert_created', alert);
    }
    
    console.log(`✅ Scan ${scanId} procesado exitosamente`);
    
  } catch (error) {
    console.error(`❌ Error procesando scan ${scanId}:`, error);
    await pool.query('UPDATE scans SET status = $1 WHERE id = $2', ['failed', scanId]);
  }
}

module.exports = { handleScan };
```

---

## Integración con Vision LLM

### `src/services/visionService.js`

```javascript
const fs = require('fs');
const Ajv = require('ajv');

const VISION_PROMPT = `Eres un sistema de detección de productos...`;  // Ver vision-json-schema.md

const ajv = new Ajv();
const schema = { /* JSON Schema completo */ };
const validate = ajv.compile(schema);

async function analyzeImageWithVision(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  
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
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Respuesta inválida de OpenAI');
  }
  
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  
  // Validar contra schema
  const valid = validate(parsed);
  if (!valid) {
    throw new Error(`JSON inválido del LLM: ${JSON.stringify(validate.errors)}`);
  }
  
  return parsed;
}

module.exports = { analyzeImageWithVision };
```

---

## Cálculo de Diferencias

### `src/services/diffService.js`

```javascript
const { pool } = require('../config/db');

async function calculateDiffs(flightId, trolleyId) {
  // 1. Obtener requirements
  const reqsResult = await pool.query(
    `SELECT fr.product_id, p.sku, fr.expected_quantity, fr.priority
     FROM flight_requirements fr
     JOIN products p ON p.id = fr.product_id
     WHERE fr.flight_id = $1 AND fr.trolley_id = $2`,
    [flightId, trolleyId]
  );
  
  // 2. Obtener actuales (último scan de cada shelf)
  const actualsResult = await pool.query(
    `WITH latest_scans AS (
       SELECT DISTINCT ON (shelf_id) id
       FROM scans
       WHERE trolley_id = $1 AND status = 'completed'
       ORDER BY shelf_id, scanned_at DESC
     )
     SELECT si.product_id, SUM(si.detected_quantity) as total, AVG(si.confidence) as conf
     FROM scan_items si
     JOIN latest_scans ls ON ls.id = si.scan_id
     GROUP BY si.product_id`,
    [trolleyId]
  );
  
  // 3. Calcular diffs
  const diffs = reqsResult.rows.map(req => {
    const actual = actualsResult.rows.find(a => a.product_id === req.product_id);
    
    return {
      product_id: req.product_id,
      sku: req.sku,
      expected: req.expected_quantity,
      actual: actual ? parseInt(actual.total) : 0,
      diff: (actual ? parseInt(actual.total) : 0) - req.expected_quantity,
      avg_confidence: actual ? parseFloat(actual.conf) : 0,
      priority: req.priority
    };
  });
  
  return diffs;
}

module.exports = { calculateDiffs };
```

---

## Generación de Alertas

### `src/services/alertService.js`

```javascript
const { pool } = require('../config/db');

async function generateAlerts(diffs, scanId, shelfId, trolleyId) {
  const alerts = [];
  
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
    }
    
    // Caso 3: Baja confianza
    if (diff.avg_confidence < 0.60) {
      shouldAlert = true;
      alertType = 'low_confidence';
      severity = 'critical';
      message = `${diff.sku}: Confianza baja (${diff.avg_confidence.toFixed(2)})`;
    }
    
    if (shouldAlert) {
      // Insertar en DB
      const result = await pool.query(
        `INSERT INTO alerts (scan_item_id, alert_type, severity, message, status)
         VALUES (
           (SELECT id FROM scan_items WHERE scan_id = $1 AND product_id = $2 LIMIT 1),
           $3, $4, $5, 'active'
         )
         RETURNING *`,
        [scanId, diff.product_id, alertType, severity, message]
      );
      
      alerts.push({
        alert_id: result.rows[0].id,
        type: alertType,
        severity,
        sku: diff.sku,
        message,
        shelf_id: shelfId,
        trolley_id: trolleyId,
        created_at: result.rows[0].created_at
      });
    }
  }
  
  return alerts;
}

module.exports = { generateAlerts };
```

---

## Middleware de Autenticación JWT

### `src/middlewares/auth.js`

```javascript
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token faltante' });
  }
  
  const token = authHeader.split(' ')[1];  // "Bearer TOKEN"
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;  // { userId, username, role }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { authenticateJWT };
```

---

## Otros Endpoints

### GET /trolleys/:id/status

```javascript
router.get('/:id/status', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT 
      t.trolley_code, t.status, f.flight_number,
      json_agg(
        json_build_object(
          'shelf_id', sh.id,
          'position', sh.position,
          'last_scan', (SELECT MAX(scanned_at) FROM scans WHERE shelf_id = sh.id),
          'avg_confidence', (/* subquery */)
        )
      ) as shelves
    FROM trolleys t
    JOIN flights f ON f.id = t.flight_id
    JOIN shelves sh ON sh.trolley_id = t.id
    WHERE t.id = $1
    GROUP BY t.id, f.flight_number
  `, [id]);
  
  res.json(result.rows[0]);
});
```

---

## Logging

### `src/utils/logger.js` (Winston)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
```

**Uso**:
```javascript
const logger = require('./utils/logger');

logger.info('Scan procesado', { scan_id: 123, trolley_id: 456 });
logger.error('Error en Vision LLM', { error: error.message });
```

---

## Pruebas (Testing)

### Estructura de Tests

```
tests/
├─ unit/
│  ├─ diffService.test.js
│  └─ visionService.test.js
├─ integration/
│  └─ scan.test.js
└─ setup.js
```

### Ejemplo con Jest

```javascript
// tests/unit/diffService.test.js
const { calculateDiffs } = require('../../src/services/diffService');

describe('Diff Service', () => {
  it('debe calcular diffs correctamente', async () => {
    const diffs = await calculateDiffs(1, 456);
    
    expect(diffs).toHaveLength(5);
    expect(diffs[0]).toHaveProperty('diff');
    expect(diffs[0].diff).toBe(-1);  // Esperando faltante de 1
  });
});
```

---

## Deployment

### Opciones de Hosting

#### 1. Render (Free Tier)

**Pasos**:
1. Push código a GitHub
2. Conectar repo en [render.com](https://render.com)
3. Configurar como "Web Service"
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Variables de entorno: Agregar todas las del `.env`

---

#### 2. Railway

Similar a Render, con mejor DX para proyectos Node.js

---

#### 3. VPS (DigitalOcean/Linode)

Para control completo:
```bash
# En servidor
git clone <repo>
cd apps/api
npm install
pm2 start src/index.js --name smart-trolley-api
```

---

## Checklist de Setup

- [ ] Instalar Node.js 18+
- [ ] Crear directorio `apps/api`
- [ ] `npm init -y`
- [ ] Instalar dependencias:
  - express, cors, dotenv
  - multer, pg, bcrypt, jsonwebtoken
  - socket.io, ajv
- [ ] Crear estructura de carpetas (ver arriba)
- [ ] Configurar `.env` con todas las variables
- [ ] Implementar endpoint POST /scan
- [ ] Integrar con Vision LLM
- [ ] Implementar cálculo de diffs y alertas
- [ ] Configurar WebSocket
- [ ] Probar con Postman/curl
- [ ] Deploy a Render/Railway (opcional)

---

## Troubleshooting

### Error: "ENOENT: no such file or directory, open './storage/...'"

**Solución**: Crear directorio `storage/scans` manualmente o asegurar que `fs.mkdirSync(..., { recursive: true })` esté funcionando.

### Error: "PostgreSQL connection refused"

**Solución**: Verificar que `DATABASE_URL` en `.env` sea correcto y que Neon DB esté activo.

---

## Referencias

- [Express Documentation](https://expressjs.com)
- [Socket.io Server API](https://socket.io/docs/v4/server-api/)
- [Node-Postgres (pg) Docs](https://node-postgres.com)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Variables de Entorno](env-variables.md) — Configuración completa
- [Contratos de API](../api/contracts.md) — Especificación de endpoints
- [JSON Schema para Visión](../api/vision-json-schema.md) — Integración con LLM

