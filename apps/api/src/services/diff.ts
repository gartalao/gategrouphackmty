import { prisma } from '../lib/prisma';
import { DiffResult } from '../types/contracts';
import { logger } from '../lib/logger';

export async function calculateDiffs(
  trolleyId: number,
  shelfId: number,
  detectedItems: Array<{ sku: string; quantity: number; confidence: number }>
): Promise<DiffResult[]> {
  // Get requirements for this trolley
  const requirements = await prisma.flightRequirement.findMany({
    where: { trolleyId },
    include: {
      product: true,
    },
  });

  const diffs: DiffResult[] = [];

  // Build map of detected items
  const detectedMap = new Map<string, { quantity: number; confidence: number }>();
  detectedItems.forEach((item) => {
    detectedMap.set(item.sku, { quantity: item.quantity, confidence: item.confidence });
  });

  // Calculate diffs for required items
  for (const req of requirements) {
    const detected = detectedMap.get(req.product.sku);
    const detectedQty = detected ? detected.quantity : 0;
    const diff = detectedQty - req.expectedQuantity;

    let type: 'missing' | 'extra' | 'match' | 'mismatch' = 'match';
    if (diff < 0) {
      type = 'missing';
    } else if (diff > 0) {
      type = 'extra';
    }

    diffs.push({
      sku: req.product.sku,
      required: req.expectedQuantity,
      detected: detectedQty,
      diff,
      type,
      priority: req.priority,
    });

    // Remove from detected map so we can find mismatches
    if (detected) {
      detectedMap.delete(req.product.sku);
    }
  }

  // Any remaining items in detectedMap are mismatches (not expected in requirements)
  for (const [sku, data] of detectedMap.entries()) {
    diffs.push({
      sku,
      required: 0,
      detected: data.quantity,
      diff: data.quantity,
      type: 'mismatch',
    });
  }

  logger.info(
    {
      trolleyId,
      shelfId,
      diffsCount: diffs.length,
      missingCount: diffs.filter((d) => d.type === 'missing').length,
      extraCount: diffs.filter((d) => d.type === 'extra').length,
      mismatchCount: diffs.filter((d) => d.type === 'mismatch').length,
    },
    'Diffs calculated'
  );

  return diffs;
}

