import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/error';
import { detectAndProcess, calculateAverageConfidence } from '../services/gemini/integration';
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

  // Check for duplicate scan (idempotency within 20s)
  const recentScan = await prisma.scan.findFirst({
    where: {
      shelfId,
      scannedAt: {
        gte: new Date(Date.now() - 20000), // Last 20 seconds
      },
      metadata: {
        path: ['hash'],
        equals: imageHash,
      },
    },
  });

  if (recentScan) {
    logger.info({ scanId: recentScan.scanId, imageHash }, 'Duplicate scan detected, returning cached result');
    
    // Return cached result
    const scanItems = await prisma.scanItem.findMany({
      where: { scanId: recentScan.scanId },
      include: { product: true },
    });

    const items = scanItems.map((si) => ({
      sku: si.product.sku,
      qty: si.detectedQuantity,
      confidence: Number(si.confidence),
    }));

    const diffs = await calculateDiffs(trolleyId, shelfId, items.map(i => ({ 
      sku: i.sku, 
      quantity: i.qty, 
      confidence: i.confidence 
    })));

    return res.json({
      scan_id: recentScan.scanId,
      status: 'ok',
      items,
      diffs,
      confidence_avg: items.length > 0 
        ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length 
        : 0,
      cached: true,
    });
  }

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

  // Detect with Gemini
  let detections;
  try {
    detections = await detectAndProcess(imagePath, shelfId);
  } catch (error) {
    // Mark scan as failed
    await prisma.scan.update({
      where: { scanId: scan.scanId },
      data: {
        status: 'failed',
        metadata: {
          error: (error as Error).message,
          provider: 'gemini',
        },
      },
    });
    throw new AppError(503, 'Gemini detection failed: ' + (error as Error).message);
  }

  // Insert scan items
  for (const detection of detections) {
    await prisma.scanItem.create({
      data: {
        scanId: scan.scanId,
        productId: detection.productId,
        detectedQuantity: detection.quantity,
        confidence: detection.confidence,
        notes: detection.notes || null,
      },
    });
  }

  // Calculate average confidence
  const confidenceAvg = calculateAverageConfidence(detections);

  // Calculate diffs
  const itemsForDiff = detections.map((d) => ({
    sku: d.sku,
    quantity: d.quantity,
    confidence: d.confidence,
  }));

  const diffs = await calculateDiffs(trolleyId, shelfId, itemsForDiff);

  // Generate alerts
  await generateAlerts(scan.scanId, diffs, confidenceAvg);

  // Update scan status
  await prisma.scan.update({
    where: { scanId: scan.scanId },
    data: {
      status: 'completed',
      metadata: {
        ...scan.metadata as object,
        confidence_avg: confidenceAvg,
        items_detected: detections.length,
        provider: 'gemini',
      },
    },
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
    items: detections.map((d) => ({ sku: d.sku, qty: d.quantity, confidence: d.confidence })),
    diffs,
    confidence_avg: confidenceAvg,
    image_url: `/storage/${relativeImagePath}`,
    timestamp: new Date().toISOString(),
    provider: 'gemini',
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
  logger.info(
    {
      scanId: scan.scanId,
      duration,
      itemsCount: detections.length,
      provider: 'gemini',
    },
    'Scan completed with Gemini'
  );

  const response: ScanResponse = {
    scan_id: scan.scanId,
    status: alerts.length > 0 ? 'alert' : 'ok',
    items: detections.map((d) => ({ sku: d.sku, qty: d.quantity, confidence: d.confidence })),
    diffs,
    confidence_avg: Number(confidenceAvg.toFixed(4)),
    image_url: `/storage/${relativeImagePath}`,
  };

  res.json(response);
}));

export default router;

