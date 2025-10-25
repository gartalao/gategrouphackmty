import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.get('/kpis/overview', asyncHandler(async (req, res) => {
  const date = req.query.date as string | undefined;
  const flightId = req.query.flight_id ? parseInt(req.query.flight_id as string) : undefined;
  const trolleyId = req.query.trolley_id ? parseInt(req.query.trolley_id as string) : undefined;

  // Build date filter
  let dateFilter: any = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    dateFilter = {
      scannedAt: {
        gte: startDate,
        lt: endDate,
      },
    };
  }

  // Get all scans for the filter
  const scans = await prisma.scan.findMany({
    where: {
      ...dateFilter,
      ...(trolleyId && { trolleyId }),
      status: 'completed',
    },
    include: {
      scanItems: true,
      trolley: {
        include: {
          flight: true,
        },
      },
    },
  });

  // Filter by flight if needed
  const filteredScans = flightId
    ? scans.filter((s) => s.trolley?.flightId === flightId)
    : scans;

  const totalScans = filteredScans.length;
  const completedScans = filteredScans.filter((s) => s.status === 'completed').length;
  const failedScans = filteredScans.filter((s) => s.status === 'failed').length;

  // Calculate average confidence
  let totalConfidence = 0;
  let confidenceCount = 0;

  filteredScans.forEach((scan) => {
    scan.scanItems.forEach((item) => {
      totalConfidence += Number(item.confidence);
      confidenceCount++;
    });
  });

  const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  // Get alerts
  const alerts = await prisma.alert.findMany({
    where: {
      ...(date && {
        createdAt: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        },
      }),
    },
  });

  const activeAlerts = alerts.filter((a) => a.status === 'active').length;
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  // Group alerts by type
  const alertsByType = alerts.reduce((acc: any, alert) => {
    acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
    return acc;
  }, {});

  res.json({
    date: date || new Date().toISOString().split('T')[0],
    flight_id: flightId || null,
    trolley_id: trolleyId || null,
    metrics: {
      scans: {
        total: totalScans,
        completed: completedScans,
        failed: failedScans,
        processing: totalScans - completedScans - failedScans,
      },
      confidence: {
        average: Number(avgConfidence.toFixed(4)),
      },
      alerts: {
        total_created: alerts.length,
        active: activeAlerts,
        resolved: resolvedAlerts,
        critical: criticalAlerts,
        by_type: alertsByType,
      },
    },
    generated_at: new Date().toISOString(),
  });
}));

export default router;

