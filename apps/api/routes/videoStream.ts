const { PrismaClient } = require('../../../generated/prisma');
const { VideoStreamService } = require('../services/videoStreamService');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.DETECTION_CONFIDENCE_THRESHOLD || '0.70');
const PRODUCT_COOLDOWN_MS = parseInt(process.env.PRODUCT_COOLDOWN_MS || '1200', 10);

// Initialize VideoStreamService
const videoStreamService = new VideoStreamService({
  apiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  threshold: CONFIDENCE_THRESHOLD,
  frameInterval: 1000, // Process 1 frame per second
});

// Cooldown tracking: { scanId_productId: lastDetectedTimestamp }
const detectionCooldowns = new Map();

/**
 * Verify JWT token from handshake
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Check if product is in cooldown
 */
function isInCooldown(scanId, productId) {
  const key = `${scanId}_${productId}`;
  const lastDetected = detectionCooldowns.get(key);
  if (!lastDetected) return false;

  const elapsed = Date.now() - lastDetected;
  return elapsed < PRODUCT_COOLDOWN_MS;
}

/**
 * Set cooldown for product
 */
function setCooldown(scanId, productId) {
  const key = `${scanId}_${productId}`;
  detectionCooldowns.set(key, Date.now());
}

/**
 * Initialize WebSocket server
 */
function initializeVideoStream(io) {
  const wsNamespace = io.of('/ws');

  wsNamespace.use((socket, next) => {
    // Authenticate via query token
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    const user = verifyToken(token);
    if (!user) {
      return next(new Error('Authentication error: invalid token'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  });

  wsNamespace.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[WS] User ${user.username} connected (${socket.id})`);

    // EVENT: start_scan
    socket.on('start_scan', async (payload, ack) => {
      try {
        const { trolleyId, operatorId } = payload;

        // Create new scan
        const scan = await prisma.scan.create({
          data: {
            trolleyId,
            operatorId,
            status: 'recording',
            startedAt: new Date(),
          },
        });

        // Initialize video stream for this scan
        videoStreamService.startStream(`scan_${scan.scanId}`, {
          trolleyId,
          operatorId,
          scanId: scan.scanId,
        });

        // Join trolley room for broadcasts
        socket.join(`trolley_${trolleyId}`);

        console.log(`[WS] Scan ${scan.scanId} started for trolley ${trolleyId} (video stream initialized)`);

        ack?.({ scanId: scan.scanId, status: 'recording' });
      } catch (error) {
        console.error('[WS] Error starting scan:', error);
        ack?.({ error: 'Failed to start scan' });
      }
    });

    // EVENT: frame - Real-time video frame processing
    socket.on('frame', async (payload) => {
      try {
        const { scanId, frameId, jpegBase64 } = payload;

        // Get scan to verify it exists
        const scan = await prisma.scan.findUnique({
          where: { scanId },
          include: { trolley: true },
        });

        if (!scan || scan.status !== 'recording') {
          console.warn(`[WS] Invalid or ended scan: ${scanId}`);
          return;
        }

        // Get product catalog
        const products = await prisma.product.findMany({
          select: {
            productId: true,
            name: true,
            visualDescription: true,
            detectionKeywords: true,
          },
        });

        // Process frame with video stream service (includes context and throttling)
        const { result, shouldStore } = await videoStreamService.processFrame(
          `scan_${scanId}`,
          jpegBase64,
          products
        );

        if (!result.detected || !result.product_name || !shouldStore) {
          // No detection or duplicate, skip storing but might emit for UI
          if (result.detected && result.product_name) {
            console.log(`[WS] Frame processed but not stored (duplicate/low confidence)`);
          }
          return;
        }

        // Find matching product by name (case-insensitive)
        const product = products.find(
          (p) => p.name.toLowerCase() === result.product_name?.toLowerCase()
        );

        if (!product) {
          console.warn(`[WS] Product not found in catalog: ${result.product_name}`);
          return;
        }

        // Check cooldown
        if (isInCooldown(scanId, product.productId)) {
          console.log(`[WS] Product ${product.name} in cooldown, skipping storage`);
          return;
        }

        // Insert detection
        const detection = await prisma.productDetection.create({
          data: {
            scanId,
            productId: product.productId,
            operatorId: scan.operatorId || undefined,
            confidence: result.confidence || 0,
            videoFrameId: frameId,
            detectedAt: new Date(),
          },
          include: {
            product: true,
          },
        });

        // Set cooldown
        setCooldown(scanId, product.productId);

        // Emit to trolley room
        wsNamespace.to(`trolley_${scan.trolleyId}`).emit('product_detected', {
          event: 'product_detected',
          trolley_id: scan.trolleyId,
          scan_id: scanId,
          product_id: product.productId,
          product_name: product.name,
          detected_at: detection.detectedAt,
          operator_id: scan.operatorId,
          confidence: result.confidence,
          frame_id: frameId,
        });

        console.log(
          `[WS] ✓ Product detected: ${product.name} (confidence: ${result.confidence.toFixed(2)})`
        );
      } catch (error) {
        console.error('[WS] Error processing frame:', error);
      }
    });

    // EVENT: end_scan
    socket.on('end_scan', async (payload, ack) => {
      try {
        const { scanId } = payload;

        // Get stream stats before stopping
        const stats = videoStreamService.getStreamStats(`scan_${scanId}`);
        
        // Stop video stream
        videoStreamService.stopStream(`scan_${scanId}`);

        const updated = await prisma.scan.update({
          where: { scanId },
          data: {
            endedAt: new Date(),
            status: 'completed',
          },
        });

        console.log(`[WS] Scan ${scanId} ended (processed ${stats?.frameCount || 0} frames)`);

        ack?.({ 
          status: 'completed', 
          endedAt: updated.endedAt,
          frameCount: stats?.frameCount || 0,
        });
      } catch (error) {
        console.error('[WS] Error ending scan:', error);
        ack?.({ error: 'Failed to end scan' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WS] User ${user.username} disconnected (${socket.id})`);
    });
  });

  console.log('[WS] Video stream namespace initialized at /ws');
}

module.exports = { initializeVideoStream };

