import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/error';
import { analyzeImageWithVision } from '../services/vision';
import { calculateDiffs } from '../services/diff';
import { generateAlerts } from '../services/alerts';
import { md5Hash } from '../lib/hash';
import { getIO } from '../lib/socket';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { ScanResponse } from '../types/contracts';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images allowed'));
    }
  },
});

router.post('/scan', upload.single('image'), asyncHandler(async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    throw new AppError(400, 'No image file provided');
  }

  const flightId = parseInt(req.body.flight_id);
  const trolleyId = parseInt(req.body.trolley_id);
  const shelfId = parseInt(req.body.shelf_id);

  if (isNaN(flightId) || isNaN(trolleyId) || isNaN(shelfId)) {
    throw new AppError(400, 'Invalid flight_id, trolley_id, or shelf_id');
  }

  // Validate relationships
  const shelf = await prisma.shelf.findUnique({
    where: { shelfId },
    include: { trolley: true },
  });

  if (!shelf) {
    throw new AppError(404, 'Shelf not found');
  }

  if (shelf.trolleyId !== trolleyId) {
    throw new AppError(400, 'Shelf does not belong to specified trolley');
  }

  const trolley = await prisma.trolley.findUnique({
    where: { trolleyId },
  });

  if (!trolley) {
    throw new AppError(404, 'Trolley not found');
  }

  if (trolley.flightId !== flightId) {
    throw new AppError(400, 'Trolley is not assigned to specified flight');
  }

  // Normalize image with Sharp
  const normalizedImage = await sharp(req.file.buffer)
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  const imageHash = md5Hash(normalizedImage);

  // Create storage directory structure
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const storageDir = path.join(env.STORAGE_DIR, String(year), month, day);

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const filename = `${imageHash}.jpg`;
  const imagePath = path.join(storageDir, filename);
  const relativeImagePath = path.join(String(year), month, day, filename);

  // Save image
  fs.writeFileSync(imagePath, normalizedImage);

  logger.info({ imagePath: relativeImagePath, size: normalizedImage.length }, 'Image saved');

  // Create scan record
  const scan = await prisma.scan.create({
    data: {
      trolleyId,
      shelfId,
      imagePath: relativeImagePath,
      scannedBy: 1, // TODO: Get from auth
      status: 'processing',
      metadata: {
        size_kb: Math.round(normalizedImage.length / 1024),
        format: 'jpeg',
        hash: imageHash,
      },
    },
  });

  logger.info({ scanId: scan.scanId, trolleyId, shelfId }, 'Scan created');

  // Analyze with Vision LLM
  let visionResult;
  try {
    visionResult = await analyzeImageWithVision(imagePath);
  } catch (error) {
    // Mark scan as failed
    await prisma.scan.update({
      where: { scanId: scan.scanId },
      data: {
        status: 'failed',
        metadata: {
          error: (error as Error).message,
        },
      },
    });
    throw new AppError(503, 'Vision analysis failed: ' + (error as Error).message);
  }

  // Get products from database
  const products = await prisma.product.findMany();
  const productMap = new Map(products.map((p) => [p.sku, p]));

  // Insert scan items
  const detectedItems: Array<{ sku: string; quantity: number; confidence: number }> = [];

  for (const item of visionResult.items) {
    const product = productMap.get(item.sku);

    if (!product) {
      logger.warn({ sku: item.sku }, 'Unknown SKU detected by Vision LLM, skipping');
      continue;
    }

    await prisma.scanItem.create({
      data: {
        scanId: scan.scanId,
        productId: product.productId,
        detectedQuantity: item.quantity,
        confidence: item.confidence,
        notes: item.notes || null,
      },
    });

    detectedItems.push({
      sku: item.sku,
      quantity: item.quantity,
      confidence: item.confidence,
    });
  }

  // Calculate average confidence
  const confidenceAvg = detectedItems.length > 0
    ? detectedItems.reduce((sum, item) => sum + item.confidence, 0) / detectedItems.length
    : 0;

  // Calculate diffs
  const diffs = await calculateDiffs(trolleyId, shelfId, detectedItems);

  // Generate alerts
  await generateAlerts(scan.scanId, diffs, confidenceAvg);

  // Update scan status
  await prisma.scan.update({
    where: { scanId: scan.scanId },
    data: { status: 'completed' },
  });

  // Get created alerts
  const scanItems = await prisma.scanItem.findMany({
    where: { scanId: scan.scanId },
    include: { alerts: true },
  });

  const alerts = scanItems.flatMap((si) => si.alerts);

  // Emit WebSocket events
  const io = getIO();
  const room = `trolley:${trolleyId}`;

  io.to(room).emit('scan_processed', {
    scan_id: scan.scanId,
    trolley_id: trolleyId,
    shelf_id: shelfId,
    flight_id: flightId,
    items: detectedItems.map((i) => ({ sku: i.sku, qty: i.quantity, confidence: i.confidence })),
    diffs,
    confidence_avg: confidenceAvg,
    image_url: `/storage/${relativeImagePath}`,
    timestamp: new Date().toISOString(),
  });

  for (const alert of alerts) {
    io.to(room).emit('alert_created', {
      alert_id: alert.alertId,
      scan_id: scan.scanId,
      type: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      shelf_id: shelfId,
      trolley_id: trolleyId,
      created_at: alert.createdAt,
    });
  }

  const duration = Date.now() - startTime;
  logger.info({ scanId: scan.scanId, duration, itemsCount: detectedItems.length }, 'Scan completed');

  const response: ScanResponse = {
    scan_id: scan.scanId,
    status: alerts.length > 0 ? 'alert' : 'ok',
    items: detectedItems.map((i) => ({ sku: i.sku, qty: i.quantity, confidence: i.confidence })),
    diffs,
    confidence_avg: Number(confidenceAvg.toFixed(4)),
    image_url: `/storage/${relativeImagePath}`,
  };

  res.json(response);
}));

export default router;

