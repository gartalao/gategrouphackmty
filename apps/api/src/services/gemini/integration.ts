import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getGeminiDetector } from './detector';
import { resolveProduct } from './postprocess';
import { GeminiDetectionResult, TrackedObject } from './types';

export interface ProcessedDetection {
  sku: string;
  productId: number;
  quantity: number;
  confidence: number;
  notes?: string;
}

/**
 * Process Gemini detections and map to products in database
 */
export async function processGeminiDetections(
  result: GeminiDetectionResult,
  shelfId: number
): Promise<ProcessedDetection[]> {
  const processedItems: ProcessedDetection[] = [];

  // Group detections by label (count quantities)
  const grouped = new Map<string, { items: typeof result.items; totalConfidence: number }>();

  for (const item of result.items) {
    const key = `${item.label}_${item.brand || ''}`;
    if (!grouped.has(key)) {
      grouped.set(key, { items: [], totalConfidence: 0 });
    }
    const group = grouped.get(key)!;
    group.items.push(item);
    group.totalConfidence += item.confidence;
  }

  // Resolve each group to a product
  for (const [key, group] of grouped.entries()) {
    const firstItem = group.items[0];
    const quantity = group.items.length;
    const avgConfidence = group.totalConfidence / quantity;

    // Try to match to a product in database
    const match = await resolveProduct(firstItem.label, firstItem.brand);

    if (match && match.matchScore >= 0.5) {
      processedItems.push({
        sku: match.sku,
        productId: match.productId,
        quantity,
        confidence: avgConfidence * match.matchScore, // Adjust confidence by match quality
        notes: match.matchScore < 0.8 ? `Fuzzy match (score: ${match.matchScore.toFixed(2)})` : undefined,
      });
    } else {
      logger.warn(
        {
          label: firstItem.label,
          brand: firstItem.brand,
          quantity,
          shelfId,
        },
        'No product match found - will be marked as mismatch'
      );
      // We'll handle this as a mismatch in diff calculation
    }
  }

  logger.info(
    {
      shelfId,
      totalDetections: result.items.length,
      uniqueProducts: processedItems.length,
    },
    'Detections processed'
  );

  return processedItems;
}

/**
 * Detect objects in an image file using Gemini
 */
export async function detectAndProcess(
  imagePath: string,
  shelfId: number
): Promise<ProcessedDetection[]> {
  const detector = getGeminiDetector();
  const result = await detector.detectFrameWithRetry(imagePath);
  return processGeminiDetections(result, shelfId);
}

/**
 * Count total quantity for a specific product across all detections
 */
export function countProductQuantity(
  detections: ProcessedDetection[],
  productId: number
): number {
  return detections
    .filter((d) => d.productId === productId)
    .reduce((sum, d) => sum + d.quantity, 0);
}

/**
 * Calculate average confidence for all detections
 */
export function calculateAverageConfidence(detections: ProcessedDetection[]): number {
  if (detections.length === 0) return 0;

  const totalConfidence = detections.reduce((sum, d) => sum + d.confidence * d.quantity, 0);
  const totalQuantity = detections.reduce((sum, d) => sum + d.quantity, 0);

  return totalQuantity > 0 ? totalConfidence / totalQuantity : 0;
}

