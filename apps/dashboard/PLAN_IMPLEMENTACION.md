# 🚀 PLAN DE IMPLEMENTACIÓN - DASHBOARD SMART TROLLEY

**Fecha:** 26 de octubre de 2025  
**Estado:** 📋 PLAN COMPLETO  
**Objetivo:** Dashboard funcional con inventario de ventas y checklist en tiempo real

---

## 🎯 OBJETIVOS PRINCIPALES

### ✅ **INVENTARIO DE VENTAS**
- Mostrar qué se vendió en el vuelo (Load Scan - Return Scan)
- Cálculo automático: Vendidos = Cargados - Retornados
- Visualización clara de productos vendidos vs retornados

### ✅ **CHECKLIST EN TIEMPO REAL**
- Lista completa de productos del catálogo (20 productos)
- Actualización automática con detecciones de la cámara
- Estados visuales: Pendiente, Detectado, Confirmado
- Agrupación por categorías (Bebidas, Snacks)

### ⚠️ **REGLAS CRÍTICAS**
- **NO MODIFICAR** la lógica de Gemini
- **NO CAMBIAR** la estructura de la DB
- **USAR SOLO** los endpoints existentes
- **RESPETAR** los tipos de datos existentes

---

## 🚀 FASE 1: CONECTAR AL API REAL

### 📋 **PASO 1.1: Configurar Variables de Entorno**

**Archivo:** `apps/dashboard/.env.local`

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Development
NODE_ENV=development
```

**Comando:**
```bash
cd apps/dashboard
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:3001" >> .env.local
```

---

### 📋 **PASO 1.2: Actualizar useTrolleyData.ts**

**Archivo:** `apps/dashboard/hooks/useTrolleyData.ts`

**Cambios:**
- Reemplazar `generateMockData()` con llamadas reales al API
- Usar endpoint: `GET /api/trolleys/:id/realtime-status`
- Mantener estructura de tipos existente
- Agregar manejo de errores robusto

**Implementación:**
```typescript
const fetchData = useCallback(async () => {
  try {
    setLoading(true)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trolleys/${trolleyId}/realtime-status`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    setData(result)
    setError(null)
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error")
    console.error("[Dashboard] Error fetching trolley data:", err)
  } finally {
    setLoading(false)
  }
}, [trolleyId])
```

---

### 📋 **PASO 1.3: Actualizar useWebSocket.ts**

**Archivo:** `apps/dashboard/hooks/useWebSocket.ts`

**Cambios:**
- Conectar al WebSocket real del backend (puerto 3001)
- Escuchar eventos `product_detected` reales
- Mantener lógica de callback existente
- Agregar reconexión automática

**Implementación:**
```typescript
import { io, Socket } from 'socket.io-client'

export function useWebSocket(onProductDetected: (event: ProductDetectedEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const callbackRef = useRef(onProductDetected)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    const newSocket = io(`${wsUrl}/ws`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('[Dashboard] WebSocket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('[Dashboard] WebSocket disconnected')
      setIsConnected(false)
    })

    newSocket.on('product_detected', (event: ProductDetectedEvent) => {
      console.log('[Dashboard] Product detected:', event)
      callbackRef.current(event)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return { socket, isConnected }
}
```

---

## 🚀 FASE 2: INVENTARIO DE VENTAS

### 📋 **PASO 2.1: Crear Componente SalesInventory**

**Archivo:** `apps/dashboard/components/SalesInventory.tsx`

**Funcionalidad:**
- Mostrar productos cargados (Load Scan)
- Mostrar productos retornados (Return Scan)
- Calcular y mostrar productos vendidos
- Visualización clara con colores distintivos

**Estructura:**
```typescript
interface SalesInventoryProps {
  trolleyId: number
  loadScanId?: number
  returnScanId?: number
}

interface SalesData {
  loaded: Product[]
  returned: Product[]
  sold: Product[]
  totalLoaded: number
  totalReturned: number
  totalSold: number
}
```

---

### 📋 **PASO 2.2: Crear Hook useSalesData**

**Archivo:** `apps/dashboard/hooks/useSalesData.ts`

**Funcionalidad:**
- Obtener datos del Load Scan
- Obtener datos del Return Scan
- Calcular productos vendidos
- Manejar estados de carga y error

**Implementación:**
```typescript
export function useSalesData(trolleyId: number, loadScanId?: number, returnScanId?: number) {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSalesData = useCallback(async () => {
    if (!loadScanId) return

    try {
      setLoading(true)
      
      // Obtener productos del Load Scan
      const loadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${loadScanId}/summary`)
      const loadData = await loadResponse.json()
      
      let returnData = { products: [] }
      if (returnScanId) {
        // Obtener productos del Return Scan
        const returnResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/${returnScanId}/summary`)
        returnData = await returnResponse.json()
      }
      
      // Calcular productos vendidos
      const loadedProducts = loadData.products || []
      const returnedProducts = returnData.products || []
      const returnedIds = new Set(returnedProducts.map((p: any) => p.product_id))
      const soldProducts = loadedProducts.filter((p: any) => !returnedIds.has(p.product_id))
      
      setSalesData({
        loaded: loadedProducts,
        returned: returnedProducts,
        sold: soldProducts,
        totalLoaded: loadedProducts.length,
        totalReturned: returnedProducts.length,
        totalSold: soldProducts.length,
      })
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [loadScanId, returnScanId])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  return { salesData, loading, error, refetch: fetchSalesData }
}
```

---

### 📋 **PASO 2.3: Integrar en Dashboard**

**Archivo:** `apps/dashboard/components/Dashboard.tsx`

**Cambios:**
- Importar `SalesInventory` component
- Agregar sección de inventario de ventas
- Mostrar datos de ventas cuando estén disponibles

**Layout sugerido:**
```typescript
<div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
  <div className="col-span-2 overflow-hidden">
    <ProductChecklist products={data?.products || []} recentDetections={recentDetections} />
  </div>
  <div className="flex flex-col gap-3 overflow-hidden">
    <SalesInventory trolleyId={selectedTrolley} loadScanId={data?.active_scan?.scan_id} />
    <CategoryStats products={data?.products || []} />
    <RecentActivity trolleyId={selectedTrolley} latestDetection={latestDetection} />
  </div>
</div>
```

---

## 🚀 FASE 3: CHECKLIST EN TIEMPO REAL

### 📋 **PASO 3.1: Mejorar ProductChecklist**

**Archivo:** `apps/dashboard/components/ProductChecklist.tsx`

**Mejoras:**
- Cargar catálogo completo de productos (20 productos)
- Mostrar todos los productos con estado de detección
- Agrupar por categorías (Bebidas, Snacks)
- Animaciones de detección en tiempo real

**Estados del producto:**
```typescript
interface ChecklistItem {
  product_id: number
  product_name: string
  category: string
  status: 'pending' | 'detected' | 'confirmed'
  confidence?: number
  detected_at?: string
  count?: number
}
```

---

### 📋 **PASO 3.2: Crear Hook useProductCatalog**

**Archivo:** `apps/dashboard/hooks/useProductCatalog.ts`

**Funcionalidad:**
- Cargar catálogo completo de productos
- Mantener estado de detección por producto
- Actualizar en tiempo real con WebSocket

**Implementación:**
```typescript
export function useProductCatalog() {
  const [catalog, setCatalog] = useState<Product[]>([])
  const [detectionStates, setDetectionStates] = useState<Map<number, DetectionState>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchCatalog = useCallback(async () => {
    try {
      // Obtener catálogo de productos desde el API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)
      const products = await response.json()
      setCatalog(products)
    } catch (err) {
      console.error('[Dashboard] Error fetching catalog:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDetection = useCallback((productId: number, detection: DetectionState) => {
    setDetectionStates(prev => new Map(prev).set(productId, detection))
  }, [])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  return { catalog, detectionStates, loading, updateDetection }
}
```

---

### 📋 **PASO 3.3: Agregar Animaciones**

**Archivo:** `apps/dashboard/components/ProductChecklist.tsx`

**Animaciones:**
- Fade-in cuando se detecta un producto
- Pulse animation para productos recién detectados
- Progress bar animado para confianza
- Color transitions para estados

**CSS Classes:**
```css
.animate-detection {
  animation: detectionPulse 0.5s ease-in-out;
}

@keyframes detectionPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

---

## 🚀 FASE 4: VISTAS ADICIONALES

### 📋 **PASO 4.1: Página de Historial**

**Archivo:** `apps/dashboard/app/history/page.tsx`

**Funcionalidad:**
- Lista de scans completados
- Detalle de cada scan (productos vendidos)
- Filtros por fecha, trolley, vuelo
- Exportar datos

---

### 📋 **PASO 4.2: Página de Analytics**

**Archivo:** `apps/dashboard/app/analytics/page.tsx`

**Funcionalidad:**
- Gráficos de ventas por hora
- Top productos vendidos
- Eficiencia por trolley
- Métricas de confianza

---

### 📋 **PASO 4.3: Navegación**

**Archivo:** `apps/dashboard/components/Navigation.tsx`

**Funcionalidad:**
- Sidebar con navegación
- Breadcrumbs
- Estado de conexión WebSocket
- Información del trolley activo

---

## 🔧 CONFIGURACIÓN TÉCNICA

### 📋 **PASO 5.1: Configurar Puerto**

**Archivo:** `apps/dashboard/package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 3003",
    "build": "next build",
    "start": "next start -p 3003"
  }
}
```

---

### 📋 **PASO 5.2: Actualizar Scripts de Inicio**

**Archivo:** `start.sh` (raíz del proyecto)

```bash
# Agregar dashboard al script de inicio
echo "🚀 Starting Dashboard..."
cd apps/dashboard && npm run dev &
```

---

### 📋 **PASO 5.3: Verificación del Sistema**

**Archivo:** `verify-system.sh` (raíz del proyecto)

```bash
# Verificar dashboard
echo "🔍 Checking Dashboard..."
curl -s http://localhost:3003 > /dev/null && echo "✅ Dashboard running" || echo "❌ Dashboard not running"
```

---

## 📊 ENDPOINTS DEL API A USAR

### **REST API Endpoints:**
```typescript
// Obtener estado del trolley
GET /api/trolleys/:id/realtime-status

// Obtener detecciones del trolley
GET /api/trolleys/:id/detections

// Obtener resumen del scan
GET /api/scans/:id/summary

// Obtener catálogo de productos
GET /api/products
```

### **WebSocket Events:**
```typescript
// Escuchar detecciones en tiempo real
socket.on('product_detected', (event) => {
  // Actualizar checklist
  // Actualizar inventario
  // Mostrar notificaciones
})
```

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### **PRIORIDAD ALTA (Implementar primero):**
1. ✅ **PASO 1.1**: Configurar variables de entorno
2. ✅ **PASO 1.2**: Actualizar useTrolleyData.ts
3. ✅ **PASO 1.3**: Actualizar useWebSocket.ts
4. ✅ **PASO 2.1**: Crear SalesInventory.tsx

### **PRIORIDAD MEDIA:**
5. ✅ **PASO 2.2**: Crear useSalesData.ts
6. ✅ **PASO 2.3**: Integrar en Dashboard
7. ✅ **PASO 3.1**: Mejorar ProductChecklist

### **PRIORIDAD BAJA:**
8. ✅ **PASO 3.2**: Crear useProductCatalog.ts
9. ✅ **PASO 4.1**: Página de historial
10. ✅ **PASO 4.2**: Página de analytics

---

## 🚀 COMANDOS DE IMPLEMENTACIÓN

### **Iniciar desarrollo:**
```bash
# Terminal 1: Backend
cd apps/api && npm run dev

# Terminal 2: Web Camera
cd apps/web-camera && npm run dev

# Terminal 3: Dashboard
cd apps/dashboard && npm run dev
```

### **Verificar funcionamiento:**
```bash
# Verificar todos los servicios
./verify-system.sh

# URLs de acceso:
# Backend: http://localhost:3001
# Web Camera: http://localhost:3002
# Dashboard: http://localhost:3003
```

---

## 📋 CHECKLIST DE COMPLETADO

- [ ] **FASE 1**: Conectar al API real
  - [ ] Configurar variables de entorno
  - [ ] Actualizar useTrolleyData.ts
  - [ ] Actualizar useWebSocket.ts
- [ ] **FASE 2**: Inventario de ventas
  - [ ] Crear SalesInventory.tsx
  - [ ] Crear useSalesData.ts
  - [ ] Integrar en Dashboard
- [ ] **FASE 3**: Checklist tiempo real
  - [ ] Mejorar ProductChecklist.tsx
  - [ ] Crear useProductCatalog.ts
  - [ ] Agregar animaciones
- [ ] **FASE 4**: Vistas adicionales
  - [ ] Página de historial
  - [ ] Página de analytics
  - [ ] Navegación

---

## 🎉 RESULTADO ESPERADO

Al completar este plan tendrás:

✅ **Dashboard funcional** en puerto 3003  
✅ **Inventario de ventas** en tiempo real  
✅ **Checklist automático** que se actualiza con la cámara  
✅ **Conexión real** al API y WebSocket  
✅ **Datos reales** de la base de datos  
✅ **Interfaz moderna** y responsive  

**¡El dashboard será la cereza del pastel del sistema Smart Trolley! 🍒**

---

**Documento creado:** 26 de octubre de 2025  
**Por:** Cursor AI Assistant  
**Estado:** 📋 LISTO PARA IMPLEMENTACIÓN
