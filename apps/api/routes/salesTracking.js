const express = require('express');
const { PrismaClient } = require('../../../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

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
            : '0.00',
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

/**
 * GET /api/scans (Listar todos los scans completados)
 */
router.get('/scans', async (req, res) => {
  try {
    const scans = await prisma.scan.findMany({
      where: {
        status: 'completed',
      },
      include: {
        trolley: {
          select: {
            trolleyId: true,
            trolleyCode: true,
          },
        },
        operator: {
          select: {
            userId: true,
            username: true,
            fullName: true,
          },
        },
        returnScan: {
          select: {
            returnScanId: true,
            status: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 50, // Últimos 50 scans
    });

    res.json({
      scans: scans.map((s) => ({
        scan_id: s.scanId,
        trolley: s.trolley,
        operator: s.operator,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        has_return_scan: !!s.returnScan,
        return_scan_status: s.returnScan?.status || null,
      })),
      total: scans.length,
    });
  } catch (error) {
    console.error('Error getting scans:', error);
    res.status(500).json({ error: 'Failed to get scans' });
  }
});

module.exports = router;

