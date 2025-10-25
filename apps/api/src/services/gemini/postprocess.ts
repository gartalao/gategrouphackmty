import { DetectedItem, Box2D, TrackedObject, ProductMatch } from './types';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/**
 * Calculate Intersection over Union (IoU) between two boxes
 */
export function calculateIoU(box1: Box2D, box2: Box2D): number {
  const x1 = Math.max(box1.x0, box2.x0);
  const y1 = Math.max(box1.y0, box2.y0);
  const x2 = Math.min(box1.x1, box2.x1);
  const y2 = Math.min(box1.y1, box2.y1);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  
  const area1 = (box1.x1 - box1.x0) * (box1.y1 - box1.y0);
  const area2 = (box2.x1 - box2.x0) * (box2.y1 - box2.y0);
  
  const union = area1 + area2 - intersection;
  
  return union > 0 ? intersection / union : 0;
}

/**
 * Non-Maximum Suppression to remove duplicate detections
 */
export function applyNMS(items: DetectedItem[], iouThreshold: number = 0.5): DetectedItem[] {
  if (items.length === 0) return [];

  // Sort by confidence descending
  const sorted = [...items].sort((a, b) => b.confidence - a.confidence);
  const keep: DetectedItem[] = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    keep.push(current);

    // Remove overlapping boxes
    const remaining = sorted.filter((item) => {
      const iou = calculateIoU(current.box_2d, item.box_2d);
      return iou < iouThreshold;
    });

    sorted.length = 0;
    sorted.push(...remaining);
  }

  return keep;
}

/**
 * Check if a box is within a Region of Interest
 */
export function isWithinROI(box: Box2D, roi: Box2D): boolean {
  const centerX = (box.x0 + box.x1) / 2;
  const centerY = (box.y0 + box.y1) / 2;

  return (
    centerX >= roi.x0 &&
    centerX <= roi.x1 &&
    centerY >= roi.y0 &&
    centerY <= roi.y1
  );
}

/**
 * Simple object tracker using IoU and label matching
 */
export class ObjectTracker {
  private trackedObjects: Map<string, TrackedObject> = new Map();
  private nextId: number = 1;
  private maxAge: number = 3000; // 3 seconds

  track(detections: DetectedItem[], timestamp: number): TrackedObject[] {
    const updated: TrackedObject[] = [];

    // Remove old tracks
    for (const [id, obj] of this.trackedObjects.entries()) {
      if (timestamp - obj.lastSeen > this.maxAge) {
        this.trackedObjects.delete(id);
      }
    }

    // Match detections to existing tracks
    for (const detection of detections) {
      let bestMatch: TrackedObject | null = null;
      let bestIoU: number = 0;

      // Find best matching track
      for (const track of this.trackedObjects.values()) {
        if (track.label === detection.label) {
          const iou = calculateIoU(detection.box_2d, track.box_2d);
          if (iou > bestIoU && iou > 0.3) {
            bestIoU = iou;
            bestMatch = track;
          }
        }
      }

      if (bestMatch) {
        // Update existing track
        bestMatch.box_2d = detection.box_2d;
        bestMatch.confidence = detection.confidence;
        bestMatch.lastSeen = timestamp;
        bestMatch.frameCount++;
        bestMatch.isNew = false; // Already tracked
        updated.push(bestMatch);
      } else {
        // Create new track
        const newTrack: TrackedObject = {
          id: `track_${this.nextId++}`,
          label: detection.label,
          brand: detection.brand,
          box_2d: detection.box_2d,
          confidence: detection.confidence,
          firstSeen: timestamp,
          lastSeen: timestamp,
          frameCount: 1,
          isNew: true, // Newly detected object
        };
        this.trackedObjects.set(newTrack.id, newTrack);
        updated.push(newTrack);
      }
    }

    return updated;
  }

  /**
   * Get newly entered objects (appeared recently and moving into the shelf)
   */
  getNewEntries(): TrackedObject[] {
    return Array.from(this.trackedObjects.values()).filter(
      (obj) => obj.isNew && obj.frameCount >= 2 && obj.frameCount <= 5
    );
  }

  reset(): void {
    this.trackedObjects.clear();
  }
}

/**
 * Resolve detected label to a product in the database
 */
export async function resolveProduct(
  label: string,
  brand?: string
): Promise<ProductMatch | null> {
  const products = await prisma.product.findMany();

  const normalizedLabel = label.toLowerCase().trim();
  const normalizedBrand = brand?.toLowerCase().trim();

  const matches: ProductMatch[] = [];

  for (const product of products) {
    const productName = product.name.toLowerCase();
    const productBrand = product.brand?.toLowerCase();
    const productSku = product.sku.toLowerCase();

    let score = 0;

    // Exact name match
    if (productName === normalizedLabel) {
      score += 1.0;
    }
    // Partial name match
    else if (productName.includes(normalizedLabel) || normalizedLabel.includes(productName)) {
      score += 0.7;
    }
    // SKU contains label
    else if (productSku.includes(normalizedLabel.replace(/\s+/g, '-'))) {
      score += 0.6;
    }

    // Brand match bonus
    if (normalizedBrand && productBrand) {
      if (productBrand === normalizedBrand) {
        score += 0.3;
      } else if (productBrand.includes(normalizedBrand) || normalizedBrand.includes(productBrand)) {
        score += 0.15;
      }
    }

    // Synonym/category matching
    const synonyms: Record<string, string[]> = {
      'coca-cola': ['coke', 'cola', 'coca cola'],
      'water': ['agua', 'h2o'],
      'pretzel': ['pretzels'],
      'chips': ['potato chips', 'papas'],
      'juice': ['jugo', 'zumo'],
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (productName.includes(key)) {
        for (const synonym of values) {
          if (normalizedLabel.includes(synonym)) {
            score += 0.4;
            break;
          }
        }
      }
    }

    if (score > 0.3) {
      matches.push({
        productId: product.productId,
        sku: product.sku,
        name: product.name,
        brand: product.brand || undefined,
        matchScore: Math.min(score, 1.0),
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  if (matches.length > 0) {
    logger.debug(
      { label, brand, topMatch: matches[0], matchCount: matches.length },
      'Product resolved'
    );
    return matches[0];
  }

  logger.warn({ label, brand }, 'No product match found');
  return null;
}

/**
 * Convert point-based detection to box (if Gemini returns points instead of boxes)
 */
export function pointsToBox(points: number[][], padding: number = 20): Box2D {
  if (points.length === 0) {
    return { y0: 0, x0: 0, y1: 100, x1: 100 };
  }

  const ys = points.map((p) => p[0]);
  const xs = points.map((p) => p[1]);

  return {
    y0: Math.max(0, Math.min(...ys) - padding),
    x0: Math.max(0, Math.min(...xs) - padding),
    y1: Math.min(1000, Math.max(...ys) + padding),
    x1: Math.min(1000, Math.max(...xs) + padding),
  };
}

