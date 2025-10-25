# Setup de Dashboard Web (Next.js)

Guía conceptual para la configuración del dashboard web que muestra KPIs, alertas y estado de trolleys en tiempo real.

**Nota**: Este documento es solo documentación. No contiene código real.

---

## Resumen del Dashboard

**Propósito**: Panel de control centralizado para supervisores y operadores.

**Características clave**:
- ✅ Vista en tiempo real de trolleys activos
- ✅ KPIs y métricas de exactitud
- ✅ Panel de alertas con priorización
- ✅ Actualización automática vía WebSocket
- ✅ Responsive (desktop y tablet)

---

## Tecnologías

| Tecnología | Uso | Por Qué |
|------------|-----|---------|
| **Next.js 14** | Framework React | SSR, routing file-based, optimizado |
| **Tailwind CSS** | Estilos | Desarrollo rápido, utility-first |
| **Socket.io Client** | WebSocket | Actualizaciones en tiempo real |
| **Recharts** | Gráficas | Fácil de usar, responsive |
| **React Query** | Data fetching | Caché automático, refetch inteligente |
| **TypeScript** (opcional) | Type safety | Menos bugs, mejor DX |

---

## Estructura de Páginas

### Rutas Principales

```
/                       → Landing / Login
/dashboard              → Vista general de todos los trolleys
/flights/[id]           → Detalle de un vuelo específico
/trolleys/[id]          → Detalle de un trolley en tiempo real
/kpis                   → Dashboard de métricas
/alerts                 → Panel de alertas activas
/history                → Historial de scans y trolleys
```

### Estructura de Archivos (Next.js App Router)

```
app/
├─ page.tsx                    → / (landing)
├─ dashboard/
│  └─ page.tsx                 → /dashboard
├─ flights/
│  └─ [id]/
│     └─ page.tsx              → /flights/:id
├─ trolleys/
│  └─ [id]/
│     └─ page.tsx              → /trolleys/:id
├─ kpis/
│  └─ page.tsx                 → /kpis
├─ alerts/
│  └─ page.tsx                 → /alerts
└─ history/
   └─ page.tsx                 → /history
```

---

## Página: `/dashboard` (Vista General)

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Smart Trolley Dashboard                    [User: Admin] ▼ │
├────────────────────────────────────────────────────────────┤
│ 🔔 Alertas Activas: 3                [Última act: 10:15:34]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Trolleys Activos                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐ │
│  │ TRLLY-001       │ │ TRLLY-002       │ │ TRLLY-003    │ │
│  │ Flight: AA2345  │ │ Flight: AM0876  │ │ Flight: DL123│ │
│  │                 │ │                 │ │              │ │
│  │ Shelf 1: 🟢     │ │ Shelf 1: 🟢     │ │ Shelf 1: 🟡  │ │
│  │ Shelf 2: 🟡     │ │ Shelf 2: 🟢     │ │ Shelf 2: 🔴  │ │
│  │ Shelf 3: 🟢     │ │ Shelf 3: 🟢     │ │ Shelf 3: 🟢  │ │
│  │                 │ │                 │ │              │ │
│  │ Progress: 75%   │ │ Progress: 100%  │ │ Progress: 45%│ │
│  └─────────────────┘ └─────────────────┘ └──────────────┘ │
│                                                            │
│  KPIs Rápidos                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ Accuracy     │ │ Avg Time     │ │ Confidence       │   │
│  │   92.5%      │ │   7m 32s     │ │    0.87          │   │
│  │   🟢         │ │   🟢         │ │    🟢            │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
│                                                            │
│  Panel de Alertas Recientes                                │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 🔴 TRLLY-003 Shelf 2: Faltante 4 Aguas (crítico)      ││
│  │ 🟡 TRLLY-001 Shelf 2: Confianza media en Pretzels     ││
│  │ 🟡 TRLLY-003 Shelf 1: Excedente 2 Coca-Colas          ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

### Componentes

**TrolleyCard**:
- Muestra estado de cada shelf (semáforo)
- Progress bar de completitud
- Link a detalle del trolley

**AlertPanel**:
- Lista de alertas ordenadas por severidad
- Filtros: Todas / Críticas / Advertencias
- Botón "Resolver" para marcar como atendida

**KPICards**:
- Métricas clave con colores de estado
- Actualización en tiempo real vía WebSocket

---

## Página: `/trolleys/[id]` (Detalle de Trolley)

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ ← Volver          Trolley TRLLY-001 - Flight AA2345       │
├────────────────────────────────────────────────────────────┤
│ Status: In Progress          Último scan: Hace 3 segundos  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Shelf 1 (Top)                                   🟢 Verde  │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Última imagen:                                         ││
│  │ [   Thumbnail de imagen capturada   ]                 ││
│  │                                                        ││
│  │ Confianza: 0.92        Scans hoy: 45                  ││
│  │                                                        ││
│  │ Items detectados:                                      ││
│  │ ✅ COK-REG-330: 24/24  (confidence: 0.95)              ││
│  │ ✅ WTR-REG-500: 30/30  (confidence: 0.92)              ││
│  └────────────────────────────────────────────────────────┘│
│                                                            │
│  Shelf 2 (Middle)                              🟡 Amarillo │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Última imagen:                                         ││
│  │ [   Thumbnail de imagen capturada   ]                 ││
│  │                                                        ││
│  │ Confianza: 0.76        Scans hoy: 42                  ││
│  │                                                        ││
│  │ Items detectados:                                      ││
│  │ ⚠️ SNK-PRT-50: 11/12  (confidence: 0.75) - FALTANTE 1  ││
│  │ ✅ SNK-CHI-40: 8/8    (confidence: 0.88)               ││
│  └────────────────────────────────────────────────────────┘│
│                                                            │
│  Shelf 3 (Bottom)                              🟢 Verde    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ ...                                                    ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

### Funcionalidades

- **Auto-refresh**: Actualiza datos cada 5s con React Query
- **WebSocket updates**: Cambios inmediatos al recibir eventos
- **Expandir shelf**: Click para ver detalles completos
- **Ver imagen completa**: Modal con imagen en tamaño real

---

## Página: `/kpis` (Métricas y Analítica)

### Secciones

#### 1. Filtros de Fecha

```
Fecha: [2025-10-26 ▼]  Vuelo: [Todos ▼]  Trolley: [Todos ▼]
```

#### 2. KPIs Principales (Cards)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Accuracy     │ │ Avg Time     │ │ Throughput   │ │ Alerts       │
│   92.5%      │ │   7m 32s     │ │   6/hora     │ │   12 activas │
│   +2.3% ↑    │ │   -30s ↓     │ │   +0.5 ↑     │ │   +3 ↑       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

#### 3. Gráficas

**Scans por Hora** (Line Chart):
```
Scans
40│         ╱╲
35│        ╱  ╲      ╱╲
30│    ╱╲ ╱    ╲    ╱  ╲
25│   ╱  ╲      ╲  ╱    ╲
20│  ╱    ╲      ╲╱      ╲
  └────────────────────────
   10h  11h  12h  13h  14h
```

**Confianza por Repisa** (Bar Chart):
```
Conf
1.0│     ██
0.9│  ██ ██ ██
0.8│  ██ ██ ██
0.7│  ██ ██ ██
    ────────────
    Top Mid Bot
```

**Alertas por Tipo** (Pie Chart):
- Missing Item: 48%
- Quantity Mismatch: 32%
- Low Confidence: 12%
- Excess Item: 8%

#### 4. Top 5 SKUs con Más Errores (Table)

| SKU | Nombre | Alertas | Avg Confidence |
|-----|--------|---------|----------------|
| COK-REG-330 | Coca-Cola Regular 330ml | 5 | 0.82 |
| SNK-PRT-50 | Pretzels 50g | 4 | 0.71 |
| JUC-ORA-250 | Jugo Naranja 250ml | 3 | 0.65 |

---

## Suscripción a WebSocket

### Setup de Socket.io Client

**Archivo**: `lib/socket.ts`

```typescript
import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL;

export const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('auth_token')
  },
  autoConnect: false
});

// Conectar al montar la app
socket.connect();

// Escuchar eventos
socket.on('scan_processed', (data) => {
  console.log('Nuevo scan procesado:', data);
  // Actualizar UI
});

socket.on('alert_created', (data) => {
  console.log('Nueva alerta:', data);
  // Mostrar notificación
  // Actualizar panel de alertas
});
```

### Uso en Componentes

**Ejemplo en componente TrolleyDetail**:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

export default function TrolleyDetail({ trolleyId }) {
  const [lastScan, setLastScan] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Suscribirse a eventos de este trolley
    socket.emit('subscribe_trolley', { trolley_id: trolleyId });

    // Handler para scans nuevos
    const handleScanProcessed = (data) => {
      if (data.trolley_id === trolleyId) {
        setLastScan(data);
        // Refetch data del trolley
      }
    };

    // Handler para alertas nuevas
    const handleAlertCreated = (data) => {
      if (data.trolley_id === trolleyId) {
        setAlerts((prev) => [data, ...prev]);
        // Mostrar toast notification
      }
    };

    socket.on('scan_processed', handleScanProcessed);
    socket.on('alert_created', handleAlertCreated);

    return () => {
      socket.off('scan_processed', handleScanProcessed);
      socket.off('alert_created', handleAlertCreated);
    };
  }, [trolleyId]);

  // Renderizar UI con lastScan y alerts
}
```

---

## Fetching de Datos con React Query

### Setup

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000  // Considerar datos frescos por 5s
    }
  }
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Ejemplo de Query

```typescript
// hooks/useTrolleyStatus.ts
import { useQuery } from '@tanstack/react-query';

async function fetchTrolleyStatus(trolleyId: string) {
  const res = await fetch(`${API_URL}/trolleys/${trolleyId}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error('Failed to fetch trolley status');
  return res.json();
}

export function useTrolleyStatus(trolleyId: string) {
  return useQuery({
    queryKey: ['trolley', trolleyId],
    queryFn: () => fetchTrolleyStatus(trolleyId),
    refetchInterval: 5000  // Refetch cada 5s
  });
}

// Uso en componente
const { data, isLoading, error } = useTrolleyStatus('456');
```

---

## Estilos con Tailwind CSS

### Configuración

**Archivo**: `tailwind.config.ts`

```typescript
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'trolley-green': '#10b981',
        'trolley-yellow': '#f59e0b',
        'trolley-red': '#ef4444'
      }
    }
  },
  plugins: []
};
```

### Componente de Ejemplo

```tsx
function ShelfCard({ status, position }) {
  const statusColors = {
    green: 'bg-trolley-green',
    yellow: 'bg-trolley-yellow',
    red: 'bg-trolley-red'
  };

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Shelf {position}</h3>
        <div className={`w-4 h-4 rounded-full ${statusColors[status]}`} />
      </div>
      {/* Resto del contenido */}
    </div>
  );
}
```

---

## Notificaciones y Toasts

### Librería Recomendada

**react-hot-toast**: Simple y ligera

```bash
npm install react-hot-toast
```

**Uso**:

```typescript
import toast from 'react-hot-toast';

// Al recibir alerta crítica
socket.on('alert_created', (data) => {
  if (data.severity === 'critical') {
    toast.error(data.message, {
      duration: 10000,  // 10 segundos
      position: 'top-right',
      icon: '🔴'
    });
  } else {
    toast(data.message, { icon: '⚠️' });
  }
});
```

---

## Autenticación

### Flujo de Login

1. Usuario ingresa `username` y `password`
2. Frontend llama `POST /api/auth/login`
3. Backend retorna `{ token, user }`
4. Frontend guarda token en `localStorage`
5. Todas las requests incluyen `Authorization: Bearer {token}`

### Protección de Rutas

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('auth_token');
  
  if (!token && !request.url.includes('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/trolleys/:path*', '/kpis/:path*']
};
```

---

## Despliegue

### Opciones de Hosting

#### 1. Vercel (Recomendado para Next.js)

**Ventajas**:
- Optimizado para Next.js (empresa creadora)
- Deploy automático desde Git
- Free tier generoso
- CDN global

**Pasos**:
1. Push a GitHub/GitLab
2. Conectar repo en [vercel.com](https://vercel.com)
3. Configurar variables de entorno:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
4. Deploy automático

**Tiempo**: ~5 minutos

---

#### 2. Render

**Ventajas**:
- Alternativa a Vercel
- Free tier disponible
- Fácil de configurar

---

#### 3. Localhost (Para Hackathon)

**Durante el hack**, puede ser más simple correr localmente:

```bash
cd apps/dashboard
npm run dev
```

**Acceso**:
- Desde computadora local: `http://localhost:3000`
- Desde tablet en misma WiFi: `http://192.168.1.100:3000`

---

## Checklist de Setup

- [ ] Instalar Node.js y npm
- [ ] Crear proyecto Next.js: `npx create-next-app@latest dashboard`
- [ ] Configurar Tailwind CSS (incluido por defecto)
- [ ] Instalar dependencias:
  - `socket.io-client`
  - `@tanstack/react-query`
  - `recharts`
  - `react-hot-toast`
- [ ] Crear estructura de páginas (ver arriba)
- [ ] Implementar componentes: TrolleyCard, AlertPanel, KPICard
- [ ] Configurar WebSocket connection
- [ ] Implementar queries a API con React Query
- [ ] Crear layout con navbar y sidebar
- [ ] Probar en localhost
- [ ] Deployar a Vercel (opcional)

---

## Troubleshooting

### WebSocket no conecta

**Solución**: Verificar que `NEXT_PUBLIC_WS_URL` esté correcto y backend tenga CORS habilitado para el origen del dashboard.

### Datos no actualizan en tiempo real

**Solución**: Verificar que los handlers de `socket.on()` estén invalidando las queries de React Query con `queryClient.invalidateQueries()`.

---

## Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.io Client API](https://socket.io/docs/v4/client-api/)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Variables de Entorno](env-variables.md) — Configuración de URLs
- [Contratos de API](../api/contracts.md) — Endpoints disponibles

