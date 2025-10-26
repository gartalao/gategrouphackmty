/**
 * Script de prueba para verificar cálculo de ventas
 * 
 * Uso:
 * node test-sales-calculation.js <scanId>
 * 
 * Ejemplo:
 * node test-sales-calculation.js 32
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function testSalesCalculation(scanId) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST DE CÁLCULO DE VENTAS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    scanId = parseInt(scanId);
    
    // 1. Obtener scan de carga
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
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!scan) {
      console.error(`❌ Scan ${scanId} no encontrado`);
      return;
    }

    console.log(`📦 SCAN DE CARGA #${scanId}`);
    console.log(`   Trolley: ${scan.trolley?.trolleyCode || 'N/A'}`);
    console.log(`   Operador: ${scan.operator?.fullName || scan.operator?.username || 'N/A'}`);
    console.log(`   Fecha: ${scan.startedAt.toLocaleString()}`);
    console.log(`   Estado: ${scan.status}`);
    console.log('');

    // 2. Productos cargados
    const loadedProducts = scan.detections.map((d) => ({
      id: d.product.productId,
      name: d.product.name,
      category: d.product.category,
      price: d.product.unitPrice ? parseFloat(d.product.unitPrice.toString()) : 0,
    }));

    console.log(`📦 PRODUCTOS CARGADOS (${loadedProducts.length}):`);
    loadedProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id}) - $${p.price}`);
    });
    console.log('');

    // 3. Productos retornados
    if (!scan.returnScan) {
      console.log('⚠️  NO HAY RETURN SCAN todavía');
      console.log('   Para crear uno:');
      console.log(`   1. Clic en "🔄 Escanear Retorno" en la webapp`);
      console.log(`   2. Escanea los productos que QUEDARON`);
      console.log(`   3. Vuelve a ejecutar este script`);
      console.log('');
      return;
    }

    const returnedProducts = scan.returnScan.detections.map((d) => ({
      id: d.product.productId,
      name: d.product.name,
      category: d.product.category,
    }));

    console.log(`🔄 PRODUCTOS RETORNADOS (${returnedProducts.length}):`);
    if (returnedProducts.length === 0) {
      console.log('   ✅ ¡TODO SE VENDIÓ! (no quedó nada)');
    } else {
      returnedProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
      });
    }
    console.log('');

    // 4. CALCULAR VENDIDOS
    const loadedIds = new Set(loadedProducts.map((p) => p.id));
    const returnedIds = new Set(returnedProducts.map((p) => p.id));
    const soldIds = [...loadedIds].filter((id) => !returnedIds.has(id));

    const soldProducts = loadedProducts.filter((p) => soldIds.includes(p.id));

    console.log(`💰 PRODUCTOS VENDIDOS (${soldProducts.length}):`);
    if (soldProducts.length === 0) {
      console.log('   ❌ Nada se vendió (todo regresó)');
    } else {
      let totalRevenue = 0;
      soldProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ✅ ${p.name} - $${p.price}`);
        totalRevenue += p.price;
      });
      console.log('');
      console.log(`   💵 REVENUE TOTAL: $${totalRevenue.toFixed(2)} MXN`);
      
      const saleRate = ((soldProducts.length / loadedProducts.length) * 100).toFixed(2);
      console.log(`   📈 TASA DE VENTA: ${saleRate}%`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Cálculo completado exitosamente');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 5. Comparación visual
    console.log('📊 COMPARACIÓN VISUAL:\n');
    console.log('Cargados    Retornados    Vendidos');
    console.log('─────────────────────────────────────');
    
    loadedProducts.forEach((loaded) => {
      const wasReturned = returnedIds.has(loaded.id);
      const wasSold = soldIds.includes(loaded.id);
      
      const status = wasSold ? '✅ VENDIDO' : '❌ RETORNADO';
      console.log(`${loaded.name.padEnd(30)} → ${status}`);
    });
    
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
const scanId = process.argv[2];

if (!scanId) {
  console.log('\n❌ Uso: node test-sales-calculation.js <scanId>');
  console.log('   Ejemplo: node test-sales-calculation.js 32\n');
  
  // Mostrar scans disponibles
  (async () => {
    const scans = await prisma.scan.findMany({
      where: { status: 'completed' },
      orderBy: { scanId: 'desc' },
      take: 5,
      select: {
        scanId: true,
        startedAt: true,
        returnScan: {
          select: { returnScanId: true },
        },
      },
    });
    
    console.log('📋 Últimos scans completados:');
    scans.forEach((s) => {
      const hasReturn = s.returnScan ? '✅ Con retorno' : '⏳ Sin retorno';
      console.log(`   • Scan #${s.scanId} - ${s.startedAt.toLocaleDateString()} - ${hasReturn}`);
    });
    console.log('');
    
    await prisma.$disconnect();
    process.exit(0);
  })();
} else {
  testSalesCalculation(scanId);
}

