import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/error';
import { TrolleyStatusResponse, ShelfStatus, DiffResult } from '../types/contracts';

const router = Router();

router.get('/trolleys/:id/status', asyncHandler(async (req, res) => {
  const trolleyId = parseInt(req.params.id);

  const trolley = await prisma.trolley.findUnique({
    where: { trolleyId },
    include: {
      flight: true,
      shelves: {
        orderBy: { shelfNumber: 'asc' },
      },
    },
  });

  if (!trolley) {
    throw new AppError(404, 'Trolley not found');
  }

  // Get latest scan per shelf
  const shelvesStatus: ShelfStatus[] = [];
  let totalScans = 0;
  let totalConfidence = 0;
  let totalActiveAlerts = 0;

  for (const shelf of trolley.shelves) {
    const latestScan = await prisma.scan.findFirst({
      where: {
        shelfId: shelf.shelfId,
        status: 'completed',
      },
      orderBy: { scannedAt: 'desc' },
      include: {
        scanItems: {
          include: {
            product: true,
            alerts: {
              where: { status: 'active' },
            },
          },
        },
      },
    });

    if (!latestScan) {
      shelvesStatus.push({
        shelf_id: shelf.shelfId,
        shelf_number: shelf.shelfNumber,
        position: shelf.position,
        color: 'red',
        last_scan_at: null,
        avg_confidence: 0,
        active_alerts: 0,
        diffs: [],
      });
      continue;
    }

    totalScans++;

    // Calculate avg confidence for this shelf
    const avgConfidence = latestScan.scanItems.length > 0
      ? latestScan.scanItems.reduce((sum, si) => sum + Number(si.confidence), 0) / latestScan.scanItems.length
      : 0;

    totalConfidence += avgConfidence;

    // Get requirements for this trolley
    const requirements = await prisma.flightRequirement.findMany({
      where: { trolleyId },
      include: { product: true },
    });

    // Calculate diffs
    const detectedMap = new Map<string, number>();
    latestScan.scanItems.forEach((si) => {
      detectedMap.set(si.product.sku, si.detectedQuantity);
    });

    const diffs: DiffResult[] = [];
    for (const req of requirements) {
      const detected = detectedMap.get(req.product.sku) || 0;
      const diff = detected - req.expectedQuantity;

      diffs.push({
        sku: req.product.sku,
        required: req.expectedQuantity,
        detected,
        diff,
        type: diff < 0 ? 'missing' : diff > 0 ? 'extra' : 'match',
        priority: req.priority,
      });
    }

    // Count active alerts
    const activeAlerts = latestScan.scanItems.reduce(
      (sum, si) => sum + si.alerts.filter((a) => a.status === 'active').length,
      0
    );
    totalActiveAlerts += activeAlerts;

    // Determine color
    let color: 'green' | 'yellow' | 'red' = 'green';
    const hasDiffs = diffs.some((d) => d.diff !== 0);
    const hasCriticalDiffs = diffs.some((d) => Math.abs(d.diff) >= 3);

    if (avgConfidence < 0.60 || hasCriticalDiffs) {
      color = 'red';
    } else if (avgConfidence < 0.80 || hasDiffs) {
      color = 'yellow';
    }

    shelvesStatus.push({
      shelf_id: shelf.shelfId,
      shelf_number: shelf.shelfNumber,
      position: shelf.position,
      color,
      last_scan_at: latestScan.scannedAt,
      avg_confidence: Number(avgConfidence.toFixed(4)),
      active_alerts: activeAlerts,
      diffs,
      image_url: `/storage/${latestScan.imagePath}`,
    });
  }

  const overallAvgConfidence = totalScans > 0 ? totalConfidence / totalScans : 0;

  // Determine overall status
  let overallStatus: 'green' | 'yellow' | 'red' = 'green';
  const hasRed = shelvesStatus.some((s) => s.color === 'red');
  const hasYellow = shelvesStatus.some((s) => s.color === 'yellow');

  if (hasRed) {
    overallStatus = 'red';
  } else if (hasYellow) {
    overallStatus = 'yellow';
  }

  const response: TrolleyStatusResponse = {
    trolley_id: trolley.trolleyId,
    trolley_code: trolley.trolleyCode,
    flight_id: trolley.flightId,
    flight_number: trolley.flight?.flightNumber || null,
    status: trolley.status,
    shelves: shelvesStatus,
    summary: {
      total_scans: totalScans,
      avg_confidence: Number(overallAvgConfidence.toFixed(4)),
      active_alerts: totalActiveAlerts,
      overall_status: overallStatus,
    },
  };

  res.json(response);
}));

export default router;

