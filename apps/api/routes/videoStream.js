const { PrismaClient } = require('../../../generated/prisma');
const { analyzeFrame } = require('../services/geminiService');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.DETECTION_CONFIDENCE_THRESHOLD || '0.70');
const PRODUCT_COOLDOWN_MS = parseInt(process.env.PRODUCT_COOLDOWN_MS || '1200', 10);

// Cooldown tracking: { scanId_productId: lastDetectedTimestamp }
const detectionCooldowns = new Map();

// Rate limit tracking for Gemini API (10 RPM limit)
const geminiRequestTimestamps = [];
const GEMINI_RPM_LIMIT = 10;
const GEMINI_WINDOW_MS = 60000; // 1 minuto

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
 * Check if we're within Gemini rate limit
 */
function canMakeGeminiRequest() {
  const now = Date.now();
  
  // Remove timestamps older than 1 minute
  while (geminiRequestTimestamps.length > 0 && now - geminiRequestTimestamps[0] > GEMINI_WINDOW_MS) {
    geminiRequestTimestamps.shift();
  }
  
  const requestsInLastMinute = geminiRequestTimestamps.length;
  const canRequest = requestsInLastMinute < GEMINI_RPM_LIMIT;
  
  if (!canRequest) {
    console.warn(`[WS] ⚠️ Rate limit alcanzado: ${requestsInLastMinute}/${GEMINI_RPM_LIMIT} requests en el último minuto`);
  }
  
  return canRequest;
}

/**
 * Track Gemini request
 */
function trackGeminiRequest() {
  geminiRequestTimestamps.push(Date.now());
}

/**
 * Initialize WebSocket server
 */
function initializeVideoStream(io) {
  const wsNamespace = io.of('/ws');

  wsNamespace.use((socket, next) => {
    // Authenticate via query token (OPCIONAL para desarrollo)
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (token) {
      // Si hay token, validarlo
      const user = verifyToken(token);
      if (user) {
        socket.user = user;
        console.log(`[WS] User ${user.username} authenticated`);
      } else {
        console.warn('[WS] Invalid token provided, continuing without auth');
        socket.user = { userId: 0, username: 'guest', role: 'operator' };
      }
    } else {
      // Sin token, usar usuario guest para desarrollo
      console.log('[WS] No token provided, using guest user (dev mode)');
      socket.user = { userId: 0, username: 'guest', role: 'operator' };
    }

    next();
  });

  wsNamespace.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[WS] User ${user.username} connected (${socket.id})`);

    // EVENT: start_scan
    socket.on('start_scan', async (payload, ack) => {
      try {
        let { trolleyId, operatorId } = payload;

        // Verificar/crear trolley si no existe
        if (trolleyId) {
          const trolleyExists = await prisma.trolley.findUnique({
            where: { trolleyId },
          });

          if (!trolleyExists) {
            console.log(`[WS] Trolley ${trolleyId} no existe, usando trolley por defecto`);
            let defaultTrolley = await prisma.trolley.findFirst();
            
            if (!defaultTrolley) {
              defaultTrolley = await prisma.trolley.create({
                data: {
                  trolleyCode: `TRLLY-DEV-${Date.now()}`,
                  status: 'empty',
                },
              });
              console.log(`[WS] Trolley creado: ${defaultTrolley.trolleyCode}`);
            }
            
            trolleyId = defaultTrolley.trolleyId;
          }
        }

        // Verificar/crear operator si no existe
        if (operatorId) {
          const operatorExists = await prisma.user.findUnique({
            where: { userId: operatorId },
          });

          if (!operatorExists) {
            console.log(`[WS] Operator ${operatorId} no existe, usando operator por defecto`);
            let defaultOperator = await prisma.user.findFirst();
            
            if (!defaultOperator) {
              const hashedPassword = await require('bcrypt').hash('dev123', 10);
              defaultOperator = await prisma.user.create({
                data: {
                  username: `dev_operator_${Date.now()}`,
                  passwordHash: hashedPassword,
                  fullName: 'Dev Operator',
                  role: 'operator',
                },
              });
              console.log(`[WS] Operator creado: ${defaultOperator.username}`);
            }
            
            operatorId = defaultOperator.userId;
          }
        }

        // Create new scan
        const scan = await prisma.scan.create({
          data: {
            trolleyId: trolleyId || null,
            operatorId: operatorId || null,
            status: 'recording',
            startedAt: new Date(),
          },
        });

        // Join trolley room for broadcasts
        socket.join(`trolley_${trolleyId}`);

        console.log(`[WS] Scan ${scan.scanId} started for trolley ${trolleyId}`);

        ack?.({ scanId: scan.scanId, status: 'recording' });
      } catch (error) {
        console.error('[WS] Error starting scan:', error);
        ack?.({ error: 'Failed to start scan' });
      }
    });

    // EVENT: frame
    socket.on('frame', async (payload) => {
      try {
        console.log('[WS] 📥 Frame recibido del cliente');
        const { scanId, frameId, jpegBase64 } = payload;
        
        console.log('[WS] 📊 Datos del frame:', {
          scanId,
          frameId,
          base64Length: jpegBase64?.length || 0,
          timestamp: Date.now()
        });

        // Get scan to verify it exists
        const scan = await prisma.scan.findUnique({
          where: { scanId },
          include: { trolley: true },
        });

        if (!scan || scan.status !== 'recording') {
          console.warn(`[WS] ❌ Invalid or ended scan: ${scanId}`);
          return;
        }
        
        console.log('[WS] ✅ Scan válido, obteniendo catálogo...');

        // Get product catalog
        const products = await prisma.product.findMany({
          select: {
            productId: true,
            name: true,
            visualDescription: true,
            detectionKeywords: true,
          },
        });
        
        console.log('[WS] 📦 Productos en catálogo:', products.length);

        // Check rate limit before calling Gemini
        if (!canMakeGeminiRequest()) {
          console.warn('[WS] ⏸️ Frame descartado por rate limit de Gemini');
          return;
        }

        // Track request
        trackGeminiRequest();

        // Analyze frame with Gemini
        console.log('[WS] 🤖 Llamando a Gemini para análisis...');
        const result = await analyzeFrame(jpegBase64, products, {
          threshold: CONFIDENCE_THRESHOLD,
        });
        
        console.log('[WS] 🔍 Resultado de Gemini:', result);

        if (!result.detected || !result.product_name) {
          console.log('[WS] ⚪ No se detectó producto o confianza baja');
          return;
        }
        
        console.log('[WS] 🎯 Producto detectado:', result.product_name, 'Confianza:', result.confidence);

        // Find matching product by name (exact match, case-insensitive)
        const product = products.find(
          (p) => p.name.toLowerCase() === result.product_name.toLowerCase()
        );

        if (!product) {
          console.warn(`[WS] Product not found in catalog: ${result.product_name}`);
          console.log('[WS] Available products:', products.map(p => p.name).join(', '));
          return;
        }

        // Check cooldown
        if (isInCooldown(scanId, product.productId)) {
          console.log(`[WS] Product ${product.name} in cooldown, skipping`);
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
          product_id: product.productId,
          product_name: product.name,
          detected_at: detection.detectedAt,
          operator_id: scan.operatorId,
          confidence: result.confidence,
          box_2d: result.box_2d || null,
        });

        console.log(
          `[WS] Product detected: ${product.name} (confidence: ${result.confidence?.toFixed(2) || 'N/A'})${result.box_2d ? ' with box' : ''}`
        );
      } catch (error) {
        console.error('[WS] Error processing frame:', error);
      }
    });

    // EVENT: end_scan
    socket.on('end_scan', async (payload, ack) => {
      try {
        const { scanId } = payload;

        const updated = await prisma.scan.update({
          where: { scanId },
          data: {
            endedAt: new Date(),
            status: 'completed',
          },
        });

        console.log(`[WS] Scan ${scanId} ended`);

        ack?.({ status: 'completed', endedAt: updated.endedAt });
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

