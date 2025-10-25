# Smart Trolley Dashboard

Real-time monitoring dashboard for Smart Trolley system built with Next.js 14 (App Router).

## Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query
- **Real-time**: Socket.IO Client
- **Notifications**: React Hot Toast
- **Date Utils**: date-fns

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Development

```bash
npm run dev
```

Dashboard will be available at `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## Pages

### Home (`/`)

- Lists all active trolleys
- Quick navigation to trolley details
- Link to KPIs dashboard

### Trolley Detail (`/trolleys/[id]`)

- Real-time status of trolley
- 3 shelf cards (top, middle, bottom) with semáforo (green/yellow/red)
- Diff tables showing required vs detected items
- WebSocket integration for live updates
- Toast notifications for scans and alerts
- Auto-refresh every 10 seconds as fallback

### KPIs (`/kpis`)

- Scans metrics (total, completed, processing, failed)
- Average confidence score
- Alerts breakdown (total, active, resolved, critical)
- Alerts by type distribution

## Components

### `StatusPill`

Visual indicator with colored dot (green/yellow/red)

### `ShelfCard`

Displays shelf status with:
- Position and shelf number
- Status pill
- Last scan time
- Confidence percentage
- Active alerts count
- Diff table
- Thumbnail image

### `DiffTable`

Table showing SKU, required, detected, diff, and type (missing/extra/match/mismatch)

### `AlertBadge`

Badge showing alert count with severity coloring

## WebSocket Events

The dashboard listens to:

### `scan_processed`

Triggered when a scan is completed

```typescript
{
  scan_id: number
  trolley_id: number
  shelf_id: number
  flight_id: number
  items: Array<{ sku: string, qty: number, confidence: number }>
  diffs: Diff[]
  confidence_avg: number
  image_url: string
  timestamp: string
}
```

### `alert_created`

Triggered when a new alert is generated

```typescript
{
  alert_id: number
  scan_id: number
  type: string
  severity: 'critical' | 'warning'
  message: string
  shelf_id: number
  trolley_id: number
  created_at: string
}
```

## Features

- ✅ Real-time updates via WebSocket
- ✅ Auto-refresh as fallback
- ✅ Toast notifications
- ✅ Responsive design (desktop/tablet/mobile)
- ✅ Semáforo color coding (green/yellow/red)
- ✅ Confidence percentage display
- ✅ Diff calculation visualization
- ✅ Image thumbnails

## Architecture

```
app/
├── layout.tsx              # Root layout
├── globals.css             # Global styles
├── providers.tsx           # React Query & Toast providers
├── page.tsx                # Home page
├── trolleys/
│   └── [id]/
│       └── page.tsx        # Trolley detail (with WebSocket)
└── kpis/
    └── page.tsx            # KPIs dashboard

components/
├── StatusPill.tsx          # Green/yellow/red indicator
├── ShelfCard.tsx           # Shelf status card
├── DiffTable.tsx           # Items diff table
└── AlertBadge.tsx          # Alert count badge

lib/
├── api.ts                  # API fetchers & types
└── socket.ts               # Socket.IO client singleton
```

## Notes

- Dashboard subscribes to trolley rooms: `trolley:{id}`
- Query cache invalidated on WebSocket events
- Fallback polling every 10s if WebSocket fails
- Images loaded from API `/storage` endpoint
- Toast notifications persist for 5 seconds
