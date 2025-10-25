import { prisma } from '../lib/prisma';
import { DiffResult } from '../types/contracts';
import { logger } from '../lib/logger';

interface AlertInput {
  scanItemId: number;
  alertType: string;
  severity: 'critical' | 'warning';
  message: string;
}

export async function generateAlerts(
  scanId: number,
  diffs: DiffResult[],
  confidenceAvg: number
): Promise<void> {
  const alerts: AlertInput[] = [];

  // Get scan items to link alerts
  const scanItems = await prisma.scanItem.findMany({
    where: { scanId },
    include: { product: true },
  });

  const scanItemMap = new Map(scanItems.map((si) => [si.product.sku, si]));

  // Check for low average confidence
  if (confidenceAvg < 0.80 && confidenceAvg >= 0.60) {
    // Warning for medium confidence
    const firstItem = scanItems[0];
    if (firstItem) {
      alerts.push({
        scanItemId: firstItem.scanItemId,
        alertType: 'low_confidence',
        severity: 'warning',
        message: `Confianza promedio media (${confidenceAvg.toFixed(2)}). Revisar manualmente cuando sea posible.`,
      });
    }
  } else if (confidenceAvg < 0.60) {
    // Critical for very low confidence
    const firstItem = scanItems[0];
    if (firstItem) {
      alerts.push({
        scanItemId: firstItem.scanItemId,
        alertType: 'low_confidence',
        severity: 'critical',
        message: `Confianza promedio baja (${confidenceAvg.toFixed(2)}). Validación manual requerida.`,
      });
    }
  }

  // Check diffs
  for (const diff of diffs) {
    const scanItem = scanItemMap.get(diff.sku);

    if (diff.type === 'missing') {
      const severity = diff.priority === 'critical' || Math.abs(diff.diff) >= 3 ? 'critical' : 'warning';
      const message = `${diff.sku}: esperados ${diff.required}, detectados ${diff.detected} (diff: ${diff.diff})`;

      if (scanItem) {
        alerts.push({
          scanItemId: scanItem.scanItemId,
          alertType: 'missing_item',
          severity,
          message,
        });
      } else {
        // If no scan item exists (0 detected), create alert on first scan item
        const firstItem = scanItems[0];
        if (firstItem) {
          alerts.push({
            scanItemId: firstItem.scanItemId,
            alertType: 'missing_item',
            severity,
            message,
          });
        }
      }
    } else if (diff.type === 'extra') {
      const severity = Math.abs(diff.diff) >= 3 ? 'critical' : 'warning';
      const message = `${diff.sku}: esperados ${diff.required}, detectados ${diff.detected} (diff: +${diff.diff})`;

      if (scanItem) {
        alerts.push({
          scanItemId: scanItem.scanItemId,
          alertType: 'excess_item',
          severity,
          message,
        });
      }
    } else if (diff.type === 'mismatch') {
      const severity = diff.detected >= 3 ? 'critical' : 'warning';
      const message = `${diff.sku}: producto no esperado en este trolley (detectados ${diff.detected})`;

      if (scanItem) {
        alerts.push({
          scanItemId: scanItem.scanItemId,
          alertType: 'quantity_mismatch',
          severity,
          message,
        });
      }
    }
  }

  // Create alerts in database
  if (alerts.length > 0) {
    await prisma.alert.createMany({
      data: alerts.map((a) => ({
        scanItemId: a.scanItemId,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message,
        status: 'active',
      })),
    });

    logger.info({ scanId, alertsCount: alerts.length }, 'Alerts generated');
  } else {
    logger.info({ scanId }, 'No alerts generated');
  }
}

