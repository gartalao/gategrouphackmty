import express, { Request, Response } from 'express';
import { PrismaClient } from '../../../generated/prisma';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /trolleys/:id/realtime-status
 * Returns product counts for the active scan of a trolley
 */
router.get('/trolleys/:id/realtime-status', async (req: Request, res: Response) => {
  try {
    const trolleyId = parseInt(req.params.id, 10);

    // Find active scan
    const activeScan = await prisma.scan.findFirst({
      where: {
        trolleyId,
        status: 'recording',
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!activeScan) {
      return res.json({
        trolley_id: trolleyId,
        active_scan: null,
        products: [],
      });
    }

    // Get detection counts by product
    const detections = await prisma.productDetection.groupBy({
      by: ['productId'],
      where: {
        scanId: activeScan.scanId,
      },
      _count: {
        productId: true,
      },
    });

    // Get product details
    const productIds = detections.map((d) => d.productId);
    const products = await prisma.product.findMany({
      where: {
        productId: {
          in: productIds,
        },
      },
      select: {
        productId: true,
        name: true,
        category: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.productId, p]));

    const result = detections.map((d) => {
      const product = productMap.get(d.productId);
      return {
        product_id: d.productId,
        product_name: product?.name || 'Unknown',
        category: product?.category || null,
        count: d._count.productId,
      };
    });

    res.json({
      trolley_id: trolleyId,
      active_scan: {
        scan_id: activeScan.scanId,
        started_at: activeScan.startedAt,
        operator_id: activeScan.operatorId,
      },
      products: result,
      total_detections: result.reduce((sum, p) => sum + p.count, 0),
    });
  } catch (error) {
    console.error('Error getting realtime status:', error);
    res.status(500).json({ error: 'Failed to get realtime status' });
  }
});

/**
 * GET /trolleys/:id/detections
 * Returns paginated list of all detections for a trolley
 */
router.get('/trolleys/:id/detections', async (req: Request, res: Response) => {
  try {
    const trolleyId = parseInt(req.params.id, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    // Get all scans for this trolley
    const scans = await prisma.scan.findMany({
      where: { trolleyId },
      select: { scanId: true },
    });

    const scanIds = scans.map((s) => s.scanId);

    if (scanIds.length === 0) {
      return res.json({
        trolley_id: trolleyId,
        detections: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      });
    }

    // Get detections
    const [detections, total] = await Promise.all([
      prisma.productDetection.findMany({
        where: {
          scanId: {
            in: scanIds,
          },
        },
        include: {
          product: {
            select: {
              productId: true,
              name: true,
              category: true,
            },
          },
          scan: {
            select: {
              scanId: true,
              startedAt: true,
              endedAt: true,
              status: true,
            },
          },
          operator: {
            select: {
              userId: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          detectedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.productDetection.count({
        where: {
          scanId: {
            in: scanIds,
          },
        },
      }),
    ]);

    res.json({
      trolley_id: trolleyId,
      detections: detections.map((d) => ({
        detection_id: d.detectionId,
        product: {
          id: d.product.productId,
          name: d.product.name,
          category: d.product.category,
        },
        detected_at: d.detectedAt,
        confidence: d.confidence ? parseFloat(d.confidence.toString()) : null,
        video_frame_id: d.videoFrameId,
        scan: {
          id: d.scan.scanId,
          started_at: d.scan.startedAt,
          ended_at: d.scan.endedAt,
          status: d.scan.status,
        },
        operator: d.operator
          ? {
              id: d.operator.userId,
              username: d.operator.username,
              full_name: d.operator.fullName,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting detections:', error);
    res.status(500).json({ error: 'Failed to get detections' });
  }
});

/**
 * GET /scans/:id/summary
 * Returns summary of a specific scan
 */
router.get('/scans/:id/summary', async (req: Request, res: Response) => {
  try {
    const scanId = parseInt(req.params.id, 10);

    const scan = await prisma.scan.findUnique({
      where: { scanId },
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
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    // Get detection summary
    const detections = await prisma.productDetection.groupBy({
      by: ['productId'],
      where: { scanId },
      _count: {
        productId: true,
      },
      _avg: {
        confidence: true,
      },
    });

    const productIds = detections.map((d) => d.productId);
    const products = await prisma.product.findMany({
      where: { productId: { in: productIds } },
      select: {
        productId: true,
        name: true,
        category: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.productId, p]));

    const summary = detections.map((d) => {
      const product = productMap.get(d.productId);
      return {
        product_id: d.productId,
        product_name: product?.name || 'Unknown',
        category: product?.category || null,
        count: d._count.productId,
        avg_confidence: d._avg.confidence
          ? parseFloat(d._avg.confidence.toString())
          : null,
      };
    });

    res.json({
      scan: {
        id: scan.scanId,
        started_at: scan.startedAt,
        ended_at: scan.endedAt,
        status: scan.status,
        trolley: scan.trolley,
        operator: scan.operator,
      },
      products: summary,
      total_detections: summary.reduce((sum, p) => sum + p.count, 0),
      unique_products: summary.length,
    });
  } catch (error) {
    console.error('Error getting scan summary:', error);
    res.status(500).json({ error: 'Failed to get scan summary' });
  }
});

export default router;

