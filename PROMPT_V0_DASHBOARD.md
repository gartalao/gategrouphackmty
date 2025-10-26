# 📊 Prompt para v0 - Dashboard de Monitoreo de Trolleys

## 🎯 Contexto del Proyecto

Eres un desarrollador construyendo un **Dashboard de Monitoreo en Tiempo Real** para un sistema de detección automática de productos en trolleys de catering aéreo. El sistema usa visión artificial (Gemini AI) para escanear productos mediante cámara y registrarlos en una base de datos PostgreSQL.

---

## 🏗️ Stack Técnico (DEBE COINCIDIR)

```json
{
  "frontend": {
    "framework": "React 18.2.0",
    "language": "TypeScript 5.2.2",
    "bundler": "Vite 5.0.8",
    "styling": "TailwindCSS 3.4.0",
    "icons": "lucide-react 0.294.0",
    "dates": "date-fns 2.30.0",
    "websocket": "socket.io-client 4.7.5"
  },
  "backend_connection": {
    "api_base": "http://localhost:3001/api",
    "websocket": "ws://localhost:3001/ws"
  },
  "database": "PostgreSQL (Neon) vía Prisma"
}
```

---

## 📋 Schema de Base de Datos (PostgreSQL)

```prisma
model User {
  userId       Int       @id @default(autoincrement())
  username     String    @unique
  fullName     String?
  role         String    @default("operator")
  createdAt    DateTime  @default(now())
  scans        Scan[]
  detections   ProductDetection[]
}

model Product {
  productId          Int       @id @default(autoincrement())
  name               String
  visualDescription  String?
  category           String?
  brand              String?
  unitPrice          Decimal?
  imageUrl           String?
  detections         ProductDetection[]
  flightRequirements FlightRequirement[]
}

model Flight {
  flightId      Int       @id @default(autoincrement())
  flightNumber  String    @unique
  departureTime DateTime
  origin        String
  destination   String
  status        String    @default("scheduled")
  trolleys      Trolley[]
  flightRequirements FlightRequirement[]
}

model Trolley {
  trolleyId    Int       @id @default(autoincrement())
  trolleyCode  String    @unique
  status       String    @default("empty") // "empty" | "loading" | "loaded" | "in-transit"
  assignedAt   DateTime?
  flightId     Int?
  flight       Flight?
  scans        Scan[]
  flightRequirements FlightRequirement[]
}

model FlightRequirement {
  requirementId    Int      @id @default(autoincrement())
  expectedQuantity Int      // Cantidad esperada de producto
  priority         String   @default("normal") // "critical" | "normal" | "low"
  flightId   Int
  trolleyId  Int
  productId  Int
  flight     Flight
  trolley    Trolley
  product    Product
}

model Scan {
  scanId       Int       @id @default(autoincrement())
  startedAt    DateTime  @default(now())
  endedAt      DateTime?
  status       String    @default("recording") // "recording" | "completed"
  trolleyId    Int?
  operatorId   Int?
  trolley      Trolley?
  operator     User?
  detections   ProductDetection[]
}

model ProductDetection {
  detectionId   Int      @id @default(autoincrement())
  detectedAt    DateTime @default(now())
  confidence    Decimal? // 0.70 - 1.00
  scanId        Int
  productId     Int
  operatorId    Int?
  scan          Scan
  product       Product
  operator      User?
}
```

---

## 🔌 API Endpoints Disponibles

### 1. **GET /api/trolleys/:id/realtime-status**
Obtiene el estado en tiempo real del trolley activo.

**Response:**
```json
{
  "trolley_id": 1,
  "active_scan": {
    "scan_id": 42,
    "started_at": "2025-10-26T00:15:30.000Z",
    "operator_id": 1
  },
  "products": [
    {
      "product_id": 15,
      "product_name": "Coca-Cola Regular Lata",
      "category": "Bebidas",
      "count": 1
    },
    {
      "product_id": 18,
      "product_name": "Sprite Lata",
      "category": "Bebidas", 
      "count": 1
    }
  ],
  "total_detections": 2
}
```

### 2. **GET /api/trolleys/:id/detections**
Obtiene histórico paginado de detecciones.

**Query params:** `?page=1&limit=50`

**Response:**
```json
{
  "trolley_id": 1,
  "detections": [
    {
      "detection_id": 123,
      "product": {
        "id": 15,
        "name": "Coca-Cola Regular Lata",
        "category": "Bebidas"
      },
      "detected_at": "2025-10-26T00:16:45.000Z",
      "confidence": 0.95,
      "scan": {
        "id": 42,
        "started_at": "2025-10-26T00:15:30.000Z",
        "status": "recording"
      },
      "operator": {
        "id": 1,
        "username": "operator1",
        "full_name": "Juan Pérez"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### 3. **GET /api/scans/:id/summary**
Obtiene resumen de un scan específico.

**Response:**
```json
{
  "scan": {
    "id": 42,
    "started_at": "2025-10-26T00:15:30.000Z",
    "ended_at": "2025-10-26T00:25:30.000Z",
    "status": "completed",
    "trolley": {
      "trolleyId": 1,
      "trolleyCode": "TRL-001"
    },
    "operator": {
      "userId": 1,
      "username": "operator1",
      "fullName": "Juan Pérez"
    }
  },
  "products": [
    {
      "product_id": 15,
      "product_name": "Coca-Cola Regular Lata",
      "category": "Bebidas",
      "count": 1,
      "avg_confidence": 0.95
    }
  ],
  "total_detections": 8,
  "unique_products": 8
}
```

---

## 🎨 Requerimientos del Dashboard

### **Página Principal: Dashboard de Monitoreo**

Crea un dashboard moderno y profesional con las siguientes secciones:

#### 1. **Header Superior**
- Logo/título: "🚀 Smart Trolley Dashboard"
- Fecha/hora actual en tiempo real
- Selector de Trolley (dropdown con opciones: Trolley 1, Trolley 2, Trolley 3)
- Indicador de conexión WebSocket (verde = conectado, rojo = desconectado)

#### 2. **KPIs Cards (Primera Fila - 4 Cards)**

**Card 1: Productos Detectados**
- Título: "Productos Únicos"
- Número grande: Cantidad de productos únicos detectados en scan activo
- Subtítulo: "en sesión actual"
- Icono: 📦
- Color: Azul

**Card 2: Total de Detecciones**
- Título: "Total Escaneados"
- Número grande: Total de detecciones (suma de counts)
- Subtítulo: "items procesados"
- Icono: ✅
- Color: Verde

**Card 3: Confianza Promedio**
- Título: "Confianza AI"
- Número grande: Promedio de confidence (ej: "94%")
- Subtítulo: "precisión del sistema"
- Icono: 🎯
- Color: Púrpura

**Card 4: Tiempo de Sesión**
- Título: "Tiempo Activo"
- Número grande: Duración desde startedAt (ej: "5m 32s" o "Inactivo")
- Subtítulo: "sesión de escaneo"
- Icono: ⏱️
- Color: Naranja

#### 3. **Sección Principal (Grid 2 Columnas)**

**Columna Izquierda (60% ancho):**

**3.1. Checklist de Productos con Progreso**

Título: "📋 Productos Escaneados - Tiempo Real"

Para cada producto detectado, mostrar:
```
┌─────────────────────────────────────────────────────┐
│ ✅ Coca-Cola Regular Lata                           │
│    Categoría: Bebidas                               │
│    Detectado hace: 2 min                            │
│    Confianza: 95%                                   │
│    [████████████████████████] 95%                   │
└─────────────────────────────────────────────────────┘
```

Características:
- Checkbox verde ✅ cuando detectado
- Nombre del producto en negrita
- Categoría en gris
- Timestamp relativo ("hace 2 min")
- Barra de progreso con color según confidence:
  - 90-100%: Verde
  - 70-89%: Amarillo
  - <70%: Rojo
- Ordenar por: más reciente primero
- Máximo 10 items, scroll si hay más
- Animación suave al agregar nuevo item

**Columna Derecha (40% ancho):**

**3.2. Estadísticas por Categoría**

Título: "📊 Distribución por Categoría"

Mostrar tarjetas agrupadas:
```
┌─────────────────────┐
│ 🥤 Bebidas          │
│ 6 productos         │
│ 75% del total       │
└─────────────────────┘

┌─────────────────────┐
│ 🍪 Snacks           │
│ 2 productos         │
│ 25% del total       │
└─────────────────────┘
```

**3.3. Actividad Reciente**

Título: "🕐 Últimas Detecciones"

Feed en tiempo real:
```
┌─────────────────────────────────────┐
│ 🟢 Coca-Cola detectada              │
│    95% confianza • hace 30s         │
├─────────────────────────────────────┤
│ 🟢 Sprite detectada                 │
│    92% confianza • hace 1m          │
├─────────────────────────────────────┤
│ 🟢 Doritos detectados               │
│    88% confianza • hace 2m          │
└─────────────────────────────────────┘
```

#### 4. **Footer / Estado de Sesión**

Barra inferior con:
- Estado: "🔴 Grabando" o "⏸️ Detenido"
- Operador: "Operador: Juan Pérez"
- Scan ID: "#42"
- Botón: "Ver Historial Completo" → abre modal

---

## 🔄 Actualización en Tiempo Real (WebSocket)

**Conéctate al WebSocket en `ws://localhost:3001/ws`**

### Eventos a Escuchar:

**1. product_detected**
```typescript
interface ProductDetectedEvent {
  event: 'product_detected';
  trolley_id: number;
  product_id: number;
  product_name: string;
  detected_at: string; // ISO timestamp
  operator_id: number;
  confidence: number; // 0.70 - 1.00
  box_2d?: number[];
}

socket.on('product_detected', (event: ProductDetectedEvent) => {
  // 1. Agregar producto a checklist si no existe
  // 2. Actualizar contador de KPIs
  // 3. Agregar a actividad reciente
  // 4. Mostrar notificación toast (opcional)
  // 5. Animación de entrada suave
});
```

### Polling de Fallback (si WebSocket no disponible):

```typescript
// Cada 3 segundos
setInterval(() => {
  fetch(`http://localhost:3001/api/trolleys/${selectedTrolleyId}/realtime-status`)
    .then(res => res.json())
    .then(data => {
      // Actualizar estado
    });
}, 3000);
```

---

## 🎨 Especificaciones de Diseño

### Paleta de Colores (TailwindCSS)
```css
Background Principal: bg-gray-900
Background Cards: bg-gray-800
Texto Principal: text-white
Texto Secundario: text-gray-400
Bordes: border-gray-700

Acentos:
- Verde (success): bg-green-600, text-green-500
- Azul (info): bg-blue-600, text-blue-500
- Púrpura (AI): bg-purple-600, text-purple-500
- Naranja (warning): bg-orange-600, text-orange-500
- Rojo (error/recording): bg-red-600, text-red-500
```

### Tipografía
```css
Títulos: font-bold text-xl
Subtítulos: font-semibold text-lg
Números KPI: font-bold text-4xl
Texto normal: font-normal text-sm
```

### Espaciado
```css
Cards: p-6, rounded-lg
Grid gap: gap-6
Spacing entre secciones: space-y-6
```

### Iconos (lucide-react)
- Package, CheckCircle, Target, Clock
- TrendingUp, Activity, Users, Wifi

---

## 📦 Estructura de Componentes Recomendada

```typescript
components/
├── Dashboard.tsx              // Componente principal
├── KPICard.tsx               // Card reutilizable para KPIs
├── ProductChecklist.tsx      // Lista de productos con checkboxes
├── CategoryStats.tsx         // Estadísticas por categoría
├── RecentActivity.tsx        // Feed de actividad reciente
├── WebSocketIndicator.tsx   // Indicador de conexión
└── TrolleySelector.tsx       // Dropdown selector

hooks/
├── useTrolleyData.ts        // Hook para fetch de datos
├── useWebSocket.ts          // Hook para WebSocket
└── useRealtimeUpdates.ts    // Hook para actualizaciones

utils/
├── formatters.ts            // Funciones para formatear datos
└── api.ts                   // Cliente API
```

---

## 🚀 Funcionalidades Esperadas

### ✅ Debe Tener:
1. **Auto-refresh:** Dashboard se actualiza solo vía WebSocket
2. **Responsive:** Funciona en desktop (prioridad) y tablet
3. **Performance:** Manejar 100+ detecciones sin lag
4. **Animaciones:** Transiciones suaves al agregar items
5. **Error Handling:** Mostrar mensajes si API falla
6. **Loading States:** Skeletons mientras carga

### 🎯 Nice to Have:
1. Gráfica de línea con detecciones por minuto
2. Exportar reporte a PDF
3. Filtros por categoría
4. Modo oscuro/claro toggle
5. Notificaciones sonoras al detectar

---

## 📝 Código de Ejemplo - Uso de API

```typescript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

interface RealtimeData {
  trolley_id: number;
  active_scan: {
    scan_id: number;
    started_at: string;
    operator_id: number;
  } | null;
  products: Array<{
    product_id: number;
    product_name: string;
    category: string;
    count: number;
  }>;
  total_detections: number;
}

export function Dashboard() {
  const [selectedTrolley, setSelectedTrolley] = useState(1);
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch inicial
    fetch(`http://localhost:3001/api/trolleys/${selectedTrolley}/realtime-status`)
      .then(res => res.json())
      .then(setData);

    // WebSocket
    const socket = io('http://localhost:3001/ws');

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('product_detected', (event) => {
      // Solo actualizar si es del trolley seleccionado
      if (event.trolley_id === selectedTrolley) {
        // Refetch o actualizar localmente
        fetch(`http://localhost:3001/api/trolleys/${selectedTrolley}/realtime-status`)
          .then(res => res.json())
          .then(setData);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedTrolley]);

  // Calcular KPIs
  const uniqueProducts = data?.products.length || 0;
  const totalDetections = data?.total_detections || 0;
  const avgConfidence = 0.94; // Calcular del API si está disponible
  const sessionTime = data?.active_scan
    ? calculateDuration(data.active_scan.started_at)
    : 'Inactivo';

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            🚀 Smart Trolley Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTrolley}
              onChange={(e) => setSelectedTrolley(Number(e.target.value))}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              <option value={1}>Trolley 1</option>
              <option value={2}>Trolley 2</option>
              <option value={3}>Trolley 3</option>
            </select>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Productos Únicos"
            value={uniqueProducts}
            subtitle="en sesión actual"
            icon="📦"
            color="blue"
          />
          <KPICard
            title="Total Escaneados"
            value={totalDetections}
            subtitle="items procesados"
            icon="✅"
            color="green"
          />
          <KPICard
            title="Confianza AI"
            value={`${Math.round(avgConfidence * 100)}%`}
            subtitle="precisión del sistema"
            icon="🎯"
            color="purple"
          />
          <KPICard
            title="Tiempo Activo"
            value={sessionTime}
            subtitle="sesión de escaneo"
            icon="⏱️"
            color="orange"
          />
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <ProductChecklist products={data?.products || []} />
          </div>
          <div className="space-y-6">
            <CategoryStats products={data?.products || []} />
            <RecentActivity trolleyId={selectedTrolley} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ✨ Output Esperado de v0

Genera un dashboard React + TypeScript + TailwindCSS completamente funcional que:

1. ✅ Use el stack especificado (React 18, Vite, TypeScript, Tailwind)
2. ✅ Se conecte a la API en `http://localhost:3001`
3. ✅ Muestre los 4 KPIs en cards
4. ✅ Tenga checklist de productos con checkboxes y barras de progreso
5. ✅ Actualice en tiempo real vía WebSocket
6. ✅ Muestre estadísticas por categoría
7. ✅ Tenga feed de actividad reciente
8. ✅ Sea responsive y con diseño moderno dark theme
9. ✅ Incluya manejo de errores y loading states
10. ✅ Tenga animaciones suaves

---

## 🎯 Prompt Final para v0

**"Crea un Dashboard de Monitoreo en Tiempo Real para un sistema de detección automática de productos usando React 18 + TypeScript + Vite + TailwindCSS. El dashboard debe conectarse a una API REST en http://localhost:3001/api y WebSocket en ws://localhost:3001/ws. Debe mostrar 4 KPIs en cards (Productos Únicos, Total Escaneados, Confianza AI, Tiempo Activo), una checklist de productos detectados con checkboxes y barras de progreso de confianza, estadísticas agrupadas por categoría, y un feed de actividad reciente. Usa dark theme (bg-gray-900/800), iconos de lucide-react, y actualiza en tiempo real al escuchar eventos 'product_detected' del WebSocket. Incluye selector de trolley, indicador de conexión WebSocket, y manejo de errores."**

---

## 📚 Referencias

- API Base: `http://localhost:3001`
- WebSocket: `ws://localhost:3001/ws`
- Evento principal: `product_detected`
- Stack: React + TypeScript + Vite + Tailwind + Socket.IO

¡Buena suerte con el dashboard! 🚀

