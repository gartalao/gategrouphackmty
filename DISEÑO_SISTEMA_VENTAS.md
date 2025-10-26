# 🛒 Sistema de Rastreo de Ventas - Diseño Completo

## 🎯 Objetivo

Implementar sistema de doble escaneo para calcular automáticamente productos vendidos durante vuelos.

---

## 📊 Flujo del Sistema

```
1. ANTES DEL VUELO - Scan de Carga
   ↓
   Operador escanea productos que carga al trolley
   ↓
   [Coca-Cola, Doritos, Takis] → Tabla: product_detections
   ↓
   Trolley sale al vuelo

2. DESPUÉS DEL VUELO - Scan de Retorno
   ↓
   Operador escanea productos que QUEDAN en el trolley
   ↓
   [Coca-Cola] → Tabla: return_detections
   ↓
   Sistema calcula automáticamente

3. CÁLCULO AUTOMÁTICO
   ↓
   Productos Vendidos = Cargados - Retornados
   ↓
   [Doritos, Takis] → Tabla/Vista: sold_products
```

---

## 🗄️ Cambios en Base de Datos (Prisma Schema)

### **Agregar a `prisma/schema.prisma`:**

```prisma
// ---------- RETURN SCANS ----------
// Escaneo de productos que QUEDAN después del vuelo
model ReturnScan {
  returnScanId  Int       @id @default(autoincrement())
  scanId        Int       @unique // Referencia al scan de carga original
  startedAt     DateTime  @default(now()) @map("started_at")
  endedAt       DateTime? @map("ended_at")
  status        String    @default("recording") // "recording" | "completed"
  
  // Relations
  trolleyId     Int?
  operatorId    Int?
  
  scan          Scan      @relation(fields: [scanId], references: [scanId])
  trolley       Trolley?  @relation(fields: [trolleyId], references: [trolleyId])
  operator      User?     @relation(fields: [operatorId], references: [userId])
  detections    ReturnDetection[]
  
  @@map("return_scans")
}

// ---------- RETURN DETECTIONS ----------
// Productos detectados que QUEDARON en el trolley
model ReturnDetection {
  returnDetectionId Int      @id @default(autoincrement())
  detectedAt        DateTime @default(now()) @map("detected_at")
  confidence        Decimal? @db.Decimal(5, 4)
  videoFrameId      String?  @map("video_frame_id")
  
  // Relations
  returnScanId  Int
  productId     Int
  operatorId    Int?
  
  returnScan    ReturnScan @relation(fields: [returnScanId], references: [returnScanId], onDelete: Cascade)
  product       Product    @relation(fields: [productId], references: [productId])
  operator      User?      @relation(fields: [operatorId], references: [userId])
  
  @@unique([returnScanId, productId, detectedAt])
  @@index([returnScanId])
  @@index([productId])
  @@map("return_detections")
}

// Actualizar modelos existentes con nuevas relaciones:

model User {
  // ... campos existentes
  returnScans       ReturnScan[]
  returnDetections  ReturnDetection[]
}

model Product {
  // ... campos existentes
  returnDetections  ReturnDetection[]
}

model Trolley {
  // ... campos existentes
  returnScans       ReturnScan[]
}

model Scan {
  // ... campos existentes
  returnScan        ReturnScan? // Un scan de carga puede tener un scan de retorno
}
```

---

## 🔧 Backend - Nuevos Endpoints

### **Archivo: `apps/api/routes/salesTracking.js`** (NUEVO)

```javascript
const express = require('express');
const { PrismaClient } = require('../../../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/scans/:scanId/calculate-sales
 * Calcula productos vendidos comparando scan de carga vs retorno
 */
router.post('/scans/:scanId/calculate-sales', async (req, res) => {
  try {
    const scanId = parseInt(req.params.scanId, 10);

    // 1. Obtener productos cargados (scan original)
    const loadedProducts = await prisma.productDetection.findMany({
      where: { scanId },
      include: { product: true },
    });

    // 2. Obtener scan de retorno
    const returnScan = await prisma.returnScan.findUnique({
      where: { scanId },
      include: {
        detections: {
          include: { product: true },
        },
      },
    });

    if (!returnScan) {
      return res.status(404).json({
        error: 'No return scan found for this scan',
      });
    }

    // 3. Crear Sets para comparación
    const loadedProductIds = new Set(
      loadedProducts.map((d) => d.productId)
    );
    const returnedProductIds = new Set(
      returnScan.detections.map((d) => d.productId)
    );

    // 4. Calcular productos vendidos (en carga pero NO en retorno)
    const soldProductIds = [...loadedProductIds].filter(
      (id) => !returnedProductIds.has(id)
    );

    // 5. Obtener detalles de productos vendidos
    const soldProducts = await prisma.product.findMany({
      where: {
        productId: { in: soldProductIds },
      },
      select: {
        productId: true,
        name: true,
        category: true,
        brand: true,
        unitPrice: true,
      },
    });

    // 6. Calcular estadísticas
    const totalRevenue = soldProducts.reduce((sum, p) => {
      return sum + (p.unitPrice ? parseFloat(p.unitPrice.toString()) : 0);
    }, 0);

    res.json({
      scan_id: scanId,
      loaded_count: loadedProducts.length,
      returned_count: returnScan.detections.length,
      sold_count: soldProducts.length,
      sold_products: soldProducts,
      total_revenue: totalRevenue,
      sale_rate: loadedProducts.length > 0
        ? ((soldProducts.length / loadedProducts.length) * 100).toFixed(2)
        : 0,
    });
  } catch (error) {
    console.error('Error calculating sales:', error);
    res.status(500).json({ error: 'Failed to calculate sales' });
  }
});

/**
 * GET /api/scans/:scanId/sales-summary
 * Obtiene resumen de ventas de un scan específico
 */
router.get('/scans/:scanId/sales-summary', async (req, res) => {
  try {
    const scanId = parseInt(req.params.scanId, 10);

    const scan = await prisma.scan.findUnique({
      where: { scanId },
      include: {
        detections: {
          include: { product: true },
        },
        returnScan: {
          include: {
            detections: {
              include: { product: true },
            },
          },
        },
        trolley: true,
        operator: {
          select: {
            userId: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    // Productos cargados
    const loaded = scan.detections.map((d) => ({
      product_id: d.product.productId,
      product_name: d.product.name,
      category: d.product.category,
      unit_price: d.product.unitPrice
        ? parseFloat(d.product.unitPrice.toString())
        : null,
    }));

    // Productos retornados
    const returned = scan.returnScan
      ? scan.returnScan.detections.map((d) => ({
          product_id: d.product.productId,
          product_name: d.product.name,
          category: d.product.category,
        }))
      : [];

    // Productos vendidos
    const loadedIds = new Set(loaded.map((p) => p.product_id));
    const returnedIds = new Set(returned.map((p) => p.product_id));
    const soldIds = [...loadedIds].filter((id) => !returnedIds.has(id));

    const sold = loaded.filter((p) => soldIds.includes(p.product_id));

    const totalRevenue = sold.reduce((sum, p) => sum + (p.unit_price || 0), 0);

    res.json({
      scan: {
        id: scan.scanId,
        started_at: scan.startedAt,
        ended_at: scan.endedAt,
        status: scan.status,
        trolley: scan.trolley,
        operator: scan.operator,
      },
      loaded_products: loaded,
      returned_products: returned,
      sold_products: sold,
      stats: {
        loaded_count: loaded.length,
        returned_count: returned.length,
        sold_count: sold.length,
        total_revenue: totalRevenue,
        sale_rate:
          loaded.length > 0
            ? ((sold.length / loaded.length) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error('Error getting sales summary:', error);
    res.status(500).json({ error: 'Failed to get sales summary' });
  }
});

/**
 * GET /api/trolleys/:id/sales-history
 * Obtiene historial de ventas de un trolley
 */
router.get('/trolleys/:id/sales-history', async (req, res) => {
  try {
    const trolleyId = parseInt(req.params.id, 10);

    const scans = await prisma.scan.findMany({
      where: {
        trolleyId,
        status: 'completed',
        returnScan: {
          isNot: null, // Solo scans con retorno
        },
      },
      include: {
        detections: {
          include: { product: true },
        },
        returnScan: {
          include: {
            detections: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    const salesHistory = scans.map((scan) => {
      const loadedIds = new Set(scan.detections.map((d) => d.productId));
      const returnedIds = new Set(
        scan.returnScan.detections.map((d) => d.productId)
      );
      const soldIds = [...loadedIds].filter((id) => !returnedIds.has(id));

      const soldProducts = scan.detections
        .filter((d) => soldIds.includes(d.productId))
        .map((d) => ({
          product_id: d.product.productId,
          product_name: d.product.name,
          unit_price: d.product.unitPrice
            ? parseFloat(d.product.unitPrice.toString())
            : null,
        }));

      const revenue = soldProducts.reduce(
        (sum, p) => sum + (p.unit_price || 0),
        0
      );

      return {
        scan_id: scan.scanId,
        date: scan.startedAt,
        loaded_count: scan.detections.length,
        sold_count: soldProducts.length,
        revenue,
      };
    });

    res.json({
      trolley_id: trolleyId,
      sales_history: salesHistory,
      total_scans: salesHistory.length,
      total_revenue: salesHistory.reduce((sum, s) => sum + s.revenue, 0),
    });
  } catch (error) {
    console.error('Error getting sales history:', error);
    res.status(500).json({ error: 'Failed to get sales history' });
  }
});

module.exports = router;
```

---

## 🎨 Frontend - Modificar LiveRecording.tsx

### **Cambios en `apps/web-camera/src/pages/LiveRecording.tsx`:**

```typescript
// Agregar estado para tipo de scan
const [scanType, setScanType] = useState<'load' | 'return'>('load');
const [originalScanId, setOriginalScanId] = useState<number | null>(null);

// Modificar función de inicio
const handleStartRecording = async (type: 'load' | 'return') => {
  try {
    console.log(`[LiveRecording] 🎬 Iniciando scan tipo: ${type}`);
    
    setScanType(type);
    detectedProductIdsRef.current.clear();
    setDetections([]);
    
    isRecordingRef.current = true;
    setIsRecording(true);
    setIsPaused(false);
    
    console.log('[LiveRecording] 🔌 Creando nueva sesión...');
    await initializeSession(type);
    
    console.log('[LiveRecording] ▶ Streaming AUTOMÁTICO iniciado');
  } catch (error) {
    console.error('[LiveRecording] ❌ Error al iniciar streaming:', error);
    setError(`Error al iniciar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    isRecordingRef.current = false;
    setIsRecording(false);
  }
};

// Modificar initializeSession para soportar tipo de scan
const initializeSession = async (type: 'load' | 'return') => {
  try {
    // ... código existente de conexión WebSocket ...
    
    // Modificar start_scan según tipo
    if (type === 'load') {
      const response = await wsService.startScan({
        trolleyId: trolleyId || 1,
        operatorId: operatorId || 1,
      });
      scanIdRef.current = response.scanId;
      setScanId(response.scanId);
    } else {
      // Scan de retorno: necesita scanId original
      if (!originalScanId) {
        throw new Error('Se requiere Scan ID original para escaneo de retorno');
      }
      
      const response = await wsService.startReturnScan({
        scanId: originalScanId,
        trolleyId: trolleyId || 1,
        operatorId: operatorId || 1,
      });
      scanIdRef.current = response.returnScanId;
      setScanId(response.returnScanId);
    }
    
    setIsConnected(true);
    setGeminiStatus('idle');
    
    // ... resto del código ...
  } catch (error) {
    // ... manejo de errores ...
  }
};
```

### **Modificar UI - Dos Botones:**

```typescript
{/* Controles - DOS BOTONES */}
<div className="mt-4 pt-3 border-t border-gray-700">
  {!isRecording ? (
    <div className="space-y-3">
      {/* Botón 1: Cargar Trolley */}
      <button
        onClick={() => handleStartRecording('load')}
        className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors font-semibold text-lg"
      >
        <Play className="w-5 h-5" />
        <span>📦 Escanear Carga de Trolley</span>
      </button>
      
      {/* Botón 2: Retorno después del vuelo */}
      <button
        onClick={() => handleStartRecording('return')}
        disabled={!originalScanId}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors font-semibold text-lg"
      >
        <ArrowDown className="w-5 h-5" />
        <span>🔄 Escanear Retorno (Productos Restantes)</span>
      </button>
      
      {!originalScanId && (
        <p className="text-xs text-gray-400 text-center">
          ℹ️ Primero escanea la carga del trolley
        </p>
      )}
    </div>
  ) : (
    <button
      onClick={handleStopRecording}
      className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-colors font-semibold text-lg"
    >
      <Square className="w-5 h-5" />
      <span>
        ⏹ Detener {scanType === 'load' ? 'Carga' : 'Retorno'}
      </span>
    </button>
  )}
</div>
```

---

## 🔌 Backend - Modificar videoStream.js

### **Agregar soporte para return scans:**

```javascript
// EVENT: start_return_scan (NUEVO)
socket.on('start_return_scan', async (payload, ack) => {
  try {
    let { scanId, trolleyId, operatorId } = payload;

    // Verificar que el scan original existe
    const originalScan = await prisma.scan.findUnique({
      where: { scanId },
    });

    if (!originalScan) {
      return ack?.({ error: 'Original scan not found' });
    }

    // Crear return scan
    const returnScan = await prisma.returnScan.create({
      data: {
        scanId,
        trolleyId: trolleyId || originalScan.trolleyId,
        operatorId: operatorId || originalScan.operatorId,
        status: 'recording',
        startedAt: new Date(),
      },
    });

    socket.join(`trolley_${trolleyId}`);

    console.log(`[WS] Return Scan ${returnScan.returnScanId} started for original scan ${scanId}`);

    ack?.({ 
      returnScanId: returnScan.returnScanId, 
      scanId,
      status: 'recording' 
    });
  } catch (error) {
    console.error('[WS] Error starting return scan:', error);
    ack?.({ error: 'Failed to start return scan' });
  }
});

// Modificar EVENT: frame para soportar return scans
socket.on('frame', async (payload) => {
  try {
    const { scanId, frameId, jpegBase64, scanType } = payload;
    
    let scan;
    let isReturnScan = scanType === 'return';
    
    if (isReturnScan) {
      // Es un return scan
      scan = await prisma.returnScan.findUnique({
        where: { returnScanId: scanId },
        include: { trolley: true },
      });
    } else {
      // Es un scan normal
      scan = await prisma.scan.findUnique({
        where: { scanId },
        include: { trolley: true },
      });
    }

    if (!scan || scan.status !== 'recording') {
      console.warn(`[WS] ❌ Invalid or ended scan: ${scanId}`);
      return;
    }

    // ... proceso de detección con Gemini (igual) ...

    // Guardar detección según tipo
    for (const {product, confidence, box} of newProductsToInsert) {
      try {
        if (isReturnScan) {
          // Guardar en return_detections
          const detection = await prisma.returnDetection.create({
            data: {
              returnScanId: scanId,
              productId: product.productId,
              operatorId: scan.operatorId || undefined,
              confidence: confidence,
              videoFrameId: frameId,
              detectedAt: new Date(),
            },
            include: { product: true },
          });

          wsNamespace.to(`trolley_${scan.trolleyId}`).emit('product_detected', {
            event: 'product_detected',
            scan_type: 'return',
            trolley_id: scan.trolleyId,
            product_id: product.productId,
            product_name: product.name,
            detected_at: detection.detectedAt,
            confidence: confidence,
          });
        } else {
          // Guardar en product_detections (código existente)
          // ... código actual ...
        }

        markAsRegistered(scanId, product.productId);
      } catch (itemError) {
        console.error('[WS] ❌ Error registrando producto:', itemError.message);
      }
    }
  } catch (error) {
    console.error('[WS] Error processing frame:', error);
  }
});

// EVENT: end_return_scan (NUEVO)
socket.on('end_return_scan', async (payload, ack) => {
  try {
    const { returnScanId } = payload;

    const updated = await prisma.returnScan.update({
      where: { returnScanId },
      data: {
        endedAt: new Date(),
        status: 'completed',
      },
    });

    cleanupRegisteredProducts(returnScanId);

    console.log(`[WS] Return Scan ${returnScanId} ended`);

    ack?.({ status: 'completed', endedAt: updated.endedAt });
  } catch (error) {
    console.error('[WS] Error ending return scan:', error);
    ack?.({ error: 'Failed to end return scan' });
  }
});
```

---

## 📊 Dashboard - Nuevos KPIs y Secciones

### **Agregar a PROMPT_V0_DASHBOARD.md:**

#### **Nuevos KPIs:**

**Card 5: Productos Vendidos**
- Título: "Vendidos"
- Número grande: Cantidad de productos vendidos
- Subtítulo: "durante el vuelo"
- Icono: 💰
- Color: Dorado

**Card 6: Tasa de Venta**
- Título: "Tasa de Venta"
- Número grande: Porcentaje (ej: "67%")
- Subtítulo: "productos vendidos"
- Icono: 📈
- Color: Verde

**Card 7: Revenue Total**
- Título: "Ingresos"
- Número grande: "$1,234 MXN"
- Subtítulo: "ventas del vuelo"
- Icono: 💵
- Color: Verde oscuro

#### **Nueva Sección: Comparación Carga vs Retorno**

```
┌────────────────────────────────────────────────┐
│ 📊 Análisis de Ventas                          │
├────────────────────────────────────────────────┤
│                                                │
│ Productos Cargados: 8                          │
│ [████████████████████████████] 100%            │
│                                                │
│ Productos Retornados: 3                        │
│ [█████████░░░░░░░░░░░░░░░░░░░] 37.5%           │
│                                                │
│ Productos Vendidos: 5                          │
│ [███████████████░░░░░░░░░░░░░] 62.5%           │
│                                                │
│ ✅ Coca-Cola (Vendida)                         │
│ ✅ Doritos (Vendida)                           │
│ ✅ Takis (Vendida)                             │
│ ❌ Sprite (Retornada)                          │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🗃️ Migración de Base de Datos

### **Pasos para aplicar cambios:**

1. **Actualizar `prisma/schema.prisma`** con las nuevas tablas
2. **Crear migración:**
```bash
cd prisma
npx prisma migrate dev --name add_return_scans_and_sales_tracking
```

3. **Generar cliente Prisma:**
```bash
npx prisma generate
```

---

## 🎯 Flujo Completo de Uso

### **Operador - Antes del Vuelo:**
1. Abre http://localhost:3002
2. Clic en **"📦 Escanear Carga de Trolley"**
3. Escanea: Coca-Cola, Doritos, Takis, Sprite, etc.
4. Clic en **"⏹ Detener Carga"**
5. Sistema guarda `scanId = 42`

### **Operador - Después del Vuelo:**
1. Abre http://localhost:3002
2. Selecciona Scan ID 42 (del vuelo anterior)
3. Clic en **"🔄 Escanear Retorno"**
4. Escanea: Sprite (lo único que quedó)
5. Clic en **"⏹ Detener Retorno"**

### **Sistema - Cálculo Automático:**
```
Cargados:   [Coca-Cola, Doritos, Takis, Sprite]
Retornados: [Sprite]
────────────────────────────────────────────────
Vendidos:   [Coca-Cola, Doritos, Takis]  ✅
Revenue:    $45.00 MXN
Tasa:       75%
```

### **Dashboard - Muestra:**
- KPI "Vendidos": 3
- KPI "Tasa de Venta": 75%
- KPI "Ingresos": $45.00
- Lista detallada de qué se vendió

---

## 📡 Nuevos Endpoints API para Dashboard

```
GET /api/scans/:scanId/sales-summary
→ Resumen completo de ventas de un scan

GET /api/trolleys/:trolleyId/sales-history
→ Historial de ventas del trolley

POST /api/scans/:scanId/calculate-sales
→ Calcula ventas comparando carga vs retorno
```

---

## ✅ Checklist de Implementación

### Backend:
- [ ] Actualizar `prisma/schema.prisma` con ReturnScan y ReturnDetection
- [ ] Crear migración de base de datos
- [ ] Crear `routes/salesTracking.js` con endpoints
- [ ] Modificar `routes/videoStream.js` para soportar return scans
- [ ] Agregar rutas a `src/index.js`

### Frontend:
- [ ] Modificar `LiveRecording.tsx` con 2 botones
- [ ] Agregar estado `scanType` ('load' | 'return')
- [ ] Modificar `websocketService.ts` con eventos de return scan
- [ ] Agregar selector de Scan ID original

### Dashboard:
- [ ] Agregar 3 nuevos KPIs (Vendidos, Tasa, Revenue)
- [ ] Crear sección "Análisis de Ventas"
- [ ] Agregar comparación visual Carga vs Retorno
- [ ] Implementar llamadas a endpoints de ventas

---

## 🎨 Mockup UI - Dos Botones

```
┌──────────────────────────────────────────────┐
│  Estado del Sistema                          │
├──────────────────────────────────────────────┤
│                                              │
│  🟢 Conectado | ⏸️ Detenido                  │
│                                              │
│  Frames Enviados: 0                          │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  ▶ 📦 Escanear Carga de Trolley      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  🔄 Escanear Retorno (Restantes)     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ℹ️ Primero escanea la carga del trolley    │
│                                              │
└──────────────────────────────────────────────┘
```

---

¿Quieres que implemente alguna parte específica primero? 🚀

