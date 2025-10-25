# Smart Trolley API

Backend Express API with **Gemini Robotics-ER** real-time detection for Smart Trolley system.

## Stack

- **Runtime**: Node.js 18+
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL (Neon) via Prisma
- **Vision**: Google Gemini Robotics-ER 1.5 (with Live API support)
- **Real-time**: Socket.IO
- **Image Processing**: Sharp
- **Validation**: Zod + Ajv
- **Logging**: Pino
- **Object Tracking**: Custom IoU-based tracker with NMS

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Configure Environment

Create `.env` file with:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL_ID="gemini-robotics-er-1.5-preview"
PORT=4000
NODE_ENV=development
STORAGE_DIR=./storage
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:3000"
```

### 4. Seed Database

From project root:

```bash
node seed-database.js
```

## Development

```bash
npm run dev
```

Server will start on `http://localhost:4000`

## Build

```bash
npm run build
npm start
```

## Endpoints

### Health

- `GET /health` - Health check
- `GET /health/db` - Database connection check

### Auth

- `POST /auth/login` - Login (username: `operator01`, password: `password123`)

### Flights

- `GET /flights/:id` - Get flight details
- `GET /flights/:id/requirements` - Get flight requirements

### Scans

- `POST /scan` - Upload and process scan (multipart/form-data)
  - `image` (file): JPEG/PNG image
  - `flight_id` (number)
  - `trolley_id` (number)
  - `shelf_id` (number)

### Trolleys

- `GET /trolleys/:id/status` - Get trolley status with shelves and diffs

### KPIs

- `GET /kpis/overview?date=YYYY-MM-DD&flight_id=X` - Get metrics

### WebSocket

- Connect to: `ws://localhost:4000/ws/socket.io`
- Subscribe: `socket.emit('subscribe_trolley', { trolley_id: 1 })`
- Events: `scan_processed`, `alert_created`

## Test

```bash
# Upload a scan
curl -X POST http://localhost:4000/scan \
  -F "image=@test.jpg" \
  -F "flight_id=1" \
  -F "trolley_id=1" \
  -F "shelf_id=1"

# Get trolley status
curl http://localhost:4000/trolleys/1/status

# Get KPIs
curl "http://localhost:4000/kpis/overview?date=2025-10-26"
```

## Architecture

```
src/
├── server.ts              # Entry point
├── config/
│   └── env.ts            # Environment config
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── logger.ts         # Pino logger
│   ├── socket.ts         # Socket.IO setup
│   └── hash.ts           # Hashing utilities
├── middleware/
│   ├── error.ts          # Error handling
│   └── validate.ts       # Zod validation
├── services/
│   ├── vision.ts         # OpenAI Vision integration
│   ├── diff.ts           # Diff calculation
│   └── alerts.ts         # Alert generation
├── routes/
│   ├── health.ts
│   ├── auth.ts
│   ├── flights.ts
│   ├── scans.ts          # Main scan processing
│   ├── trolleys.ts
│   └── kpis.ts
├── schemas/
│   ├── vision/
│   │   └── schema.json   # Vision LLM JSON schema
│   └── http/
│       └── scan.schema.ts
└── types/
    └── contracts.ts      # TypeScript interfaces
```

## Flow

1. **POST /scan** receives image + metadata
2. Normalize image with Sharp (max 1280px, quality 70%)
3. Save to storage with MD5 hash filename
4. Create `scan` record in DB
5. Call OpenAI Vision API with JSON schema
6. Insert `scan_items` with detected products
7. Calculate diffs vs `flight_requirements`
8. Generate `alerts` if needed
9. Emit WebSocket events to dashboard
10. Return response with scan_id, items, diffs, confidence

## Notes

- Images stored in `./storage/YYYY/MM/DD/{md5}.jpg`
- Retries on Vision API failures (exponential backoff)
- Falls back to `gpt-4o` if `gpt-4o-mini` fails
- Validates Vision output with Ajv against JSON schema
- Unknown SKUs logged but not stored
- WebSocket rooms: `trolley:{id}`
