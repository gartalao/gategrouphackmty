# Dashboard Web

Panel de control web (Next.js) para monitoreo en tiempo real de trolleys, KPIs y alertas.

**⚠️ NOTA**: Este directorio NO contiene código fuente. Esta documentación describe conceptualmente el dashboard web del sistema Smart Trolley.

---

## Propósito

Proporcionar visibilidad en tiempo real del estado de trolleys, exactitud de detecciones, y alertas operativas para supervisores y operadores.

---

## Características Principales

- ✅ **Vista de trolleys** con estado por shelf (verde/amarillo/rojo)
- ✅ **Panel de alertas** ordenado por severidad
- ✅ **KPIs en tiempo real** (accuracy, tiempo, confidence)
- ✅ **Gráficas** con Recharts (scans/hora, confidence/shelf)
- ✅ **Actualización automática** vía WebSocket
- ✅ **Responsive** (desktop y tablet)

---

## Stack Tecnológico (Conceptual)

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **State Management**: React Query
- **WebSocket**: Socket.io Client
- **Gráficas**: Recharts
- **Notificaciones**: react-hot-toast

---

## Rutas Principales

```
/                       → Landing / Login
/dashboard              → Vista general de trolleys
/flights/[id]           → Detalle de un vuelo
/trolleys/[id]          → Detalle de un trolley en tiempo real
/kpis                   → Dashboard de métricas
/alerts                 → Panel de alertas activas
/history                → Historial de scans
```

---

## Vistas Clave

### 1. Dashboard General (`/dashboard`)

```
┌────────────────────────────────────────┐
│ Smart Trolley Dashboard    [Usuario] ▼ │
├────────────────────────────────────────┤
│ 🔔 Alertas Activas: 3                  │
├────────────────────────────────────────┤
│ Trolleys Activos                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │TRLLY-001 │ │TRLLY-002 │ │TRLLY-003 ││
│ │AA2345    │ │AM0876    │ │DL1234    ││
│ │          │ │          │ │          ││
│ │Shelf 1🟢 │ │Shelf 1🟢 │ │Shelf 1🟡 ││
│ │Shelf 2🟡 │ │Shelf 2🟢 │ │Shelf 2🔴 ││
│ │Shelf 3🟢 │ │Shelf 3🟢 │ │Shelf 3🟢 ││
│ │75%       │ │100%      │ │45%       ││
│ └──────────┘ └──────────┘ └──────────┘│
│                                        │
│ KPIs Rápidos                           │
│ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │92.5% │ │7m 32s│ │0.87  │            │
│ │Accur.│ │Tiempo│ │Conf. │            │
│ └──────┘ └──────┘ └──────┘            │
└────────────────────────────────────────┘
```

### 2. Detalle de Trolley (`/trolleys/[id]`)

- Estado de cada shelf con semáforo
- Thumbnail de última imagen capturada
- Lista de items detectados vs esperados
- Historial de scans recientes
- Alertas activas de este trolley

### 3. KPIs (`/kpis`)

- Filtros por fecha, vuelo, trolley
- Cards con métricas principales
- Line chart de scans por hora
- Bar chart de confidence por shelf
- Pie chart de alertas por tipo
- Tabla de top SKUs con errores

---

## Integración con Backend

### REST API

```typescript
// Obtener estado de trolley
const response = await fetch(`${API_URL}/trolleys/456/status`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// { trolley_code, status, shelves: [...], summary: {...} }
```

### WebSocket

```typescript
import io from 'socket.io-client';

const socket = io(WS_URL, {
  auth: { token }
});

// Escuchar eventos
socket.on('scan_processed', (data) => {
  // Actualizar UI
  queryClient.invalidateQueries(['trolley', data.trolley_id]);
});

socket.on('alert_created', (data) => {
  // Mostrar notificación
  toast.error(data.message);
  // Actualizar panel de alertas
  setAlerts(prev => [data, ...prev]);
});
```

---

## Configuración

### Variables de Entorno

Ver [Variables de Entorno](../../docs/setup/env-variables.md).

**Archivo**: `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

**Para producción**:
```bash
NEXT_PUBLIC_API_URL=https://api.smarttrolley.com/api
NEXT_PUBLIC_WS_URL=wss://api.smarttrolley.com
```

---

## Componentes Principales

### TrolleyCard

Props:
- `trolley_id`: ID del trolley
- `trolley_code`: Código alfanumérico
- `flight_number`: Número de vuelo
- `shelves`: Array con estado de cada shelf
- `onClick`: Handler para ir a detalle

### ShelfCard

Props:
- `shelf_id`: ID de la shelf
- `position`: "top" | "middle" | "bottom"
- `status`: "green" | "yellow" | "red"
- `last_scan_at`: Timestamp
- `avg_confidence`: Confianza promedio
- `active_alerts`: Número de alertas

### AlertPanel

Props:
- `alerts`: Array de alertas
- `filter`: "all" | "critical" | "warning"
- `onResolve`: Handler para marcar como resuelta

### KPICard

Props:
- `title`: Título de la métrica
- `value`: Valor numérico
- `trend`: "+2.3%" o "-1.5%"
- `status`: "good" | "warning" | "critical"

---

## Estilos con Tailwind

### Colores del Sistema

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'trolley-green': '#10b981',
        'trolley-yellow': '#f59e0b',
        'trolley-red': '#ef4444'
      }
    }
  }
}
```

### Clases Comunes

```tsx
// Semáforo
<div className={`w-4 h-4 rounded-full ${
  status === 'green' ? 'bg-trolley-green' :
  status === 'yellow' ? 'bg-trolley-yellow' :
  'bg-trolley-red'
}`} />

// Card de KPI
<div className="border rounded-lg p-4 shadow-md bg-white">
  <h3 className="text-lg font-semibold mb-2">{title}</h3>
  <p className="text-3xl font-bold">{value}</p>
</div>
```

---

## Autenticación

### Flujo de Login

```
[Página de login]
  ↓
[Usuario ingresa username + password]
  ↓
[POST /api/auth/login]
  ↓
[Backend retorna { token, user }]
  ↓
[Guardar token en localStorage]
  ↓
[Redirigir a /dashboard]
```

### Middleware de Protección

```typescript
// middleware.ts
export function middleware(request) {
  const token = request.cookies.get('auth_token');
  
  if (!token && !request.url.includes('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## Deployment

### Vercel (Recomendado)

```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar repo en vercel.com

# 3. Configurar variables de entorno en Vercel Dashboard

# 4. Deploy automático
```

### Localhost (Para Hackathon)

```bash
npm run dev
# Abierto en http://localhost:3000

# Acceso desde tablet en misma WiFi:
# http://192.168.1.100:3000
```

---

## Testing

### Pruebas Manuales

1. **Login**: Verificar que autentica correctamente
2. **Dashboard**: Ver lista de trolleys activos
3. **Detalle**: Click en trolley, ver shelves y alertas
4. **WebSocket**: Realizar scan desde móvil, ver actualización en dashboard
5. **KPIs**: Verificar que métricas se calculan correctamente

### Métricas de Éxito

- ✅ WebSocket conectado y recibiendo eventos
- ✅ Dashboard actualiza sin refresh manual
- ✅ Tiempo de carga inicial <2s
- ✅ UI responsive en tablet (768px width)

---

## Troubleshooting

### WebSocket no conecta

- Verificar `NEXT_PUBLIC_WS_URL` es correcto
- Verificar backend tiene CORS habilitado para origen del dashboard
- Revisar logs de conexión en browser console

### Dashboard no actualiza

- Verificar que `queryClient.invalidateQueries()` se llama en handlers de WebSocket
- Verificar que React Query tiene `refetchInterval` configurado

### Gráficas no renderizan

- Verificar que datos tienen el formato correcto para Recharts
- Revisar errores en console del browser

---

## Referencias

- [Dashboard Next Setup](../../docs/setup/dashboard-next-setup.md) — Guía completa de configuración
- [Variables de Entorno](../../docs/setup/env-variables.md) — Configuración de URLs
- [Contratos de API](../../docs/api/contracts.md) — Endpoints disponibles
- [KPIs y Métricas](../../docs/kpis/kpis-metrics.md) — Definiciones de métricas

