const { PrismaClient } = require('../../../generated/prisma');
const { analyzeFrame } = require('../services/geminiService');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.DETECTION_CONFIDENCE_THRESHOLD || '0.70');
const PRODUCT_COOLDOWN_MS = parseInt(process.env.PRODUCT_COOLDOWN_MS || '1200', 10);

// Cooldown tracking: { scanId_productId: lastDetectedTimestamp }
const detectionCooldowns = new Map();

// Rate limit tracking for Gemini API (Premium: 120 RPM limit = 2 RPS)
const geminiRequestTimestamps = [];
const GEMINI_RPM_LIMIT = 120; // Premium plan: 120 requests por minuto
const GEMINI_WINDOW_MS = 60000; // 1 minuto

// Tracking de productos actualmente visibles en cada scan
// scanId -> Set([productId1, productId2, ...])
const currentlyVisibleProducts = new Map();

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
 * Verifica si un producto es NUEVO en el frame actual
 * (no estaba visible en el frame anterior)
 */
function isNewProduct(scanId, productId) {
  const visibleSet = currentlyVisibleProducts.get(scanId);
  if (!visibleSet) {
    return true; // Primera detección en este scan
  }
  return !visibleSet.has(productId); // Nuevo si no estaba antes
}

/**
 * Marca producto como actualmente visible
 */
function markProductAsVisible(scanId, productId) {
  let visibleSet = currentlyVisibleProducts.get(scanId);
  if (!visibleSet) {
    visibleSet = new Set();
    currentlyVisibleProducts.set(scanId, visibleSet);
  }
  visibleSet.add(productId);
}

/**
 * Actualiza productos visibles basado en detección actual
 * Remueve los que ya no están presentes
 */
function updateVisibleProducts(scanId, detectedProductIds) {
  const visibleSet = currentlyVisibleProducts.get(scanId) || new Set();
  
  // Remover productos que ya no se detectan
  const removedProducts = [];
  for (const productId of visibleSet) {
    if (!detectedProductIds.includes(productId)) {
      removedProducts.push(productId);
    }
  }
  
  removedProducts.forEach(pid => visibleSet.delete(pid));
  
  if (removedProducts.length > 0) {
    console.log(`[WS] 🗑️ Productos removidos del frame:`, removedProducts.length);
  }
  
  // Agregar nuevos productos detectados
  detectedProductIds.forEach(pid => visibleSet.add(pid));
  
  currentlyVisibleProducts.set(scanId, visibleSet);
}

/**
 * Limpia tracking de productos visibles al finalizar scan
 */
function cleanupVisibleProducts(scanId) {
  currentlyVisibleProducts.delete(scanId);
  console.log(`[WS] 🧹 Tracking de productos visibles limpiado para scan ${scanId}`);
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

        // Con Premium (120 RPM) el rate limit check es menos restrictivo
        // Verificamos solo para evitar excesos extremos
        const requestsInLastMinute = geminiRequestTimestamps.filter(ts => Date.now() - ts < GEMINI_WINDOW_MS).length;
        console.log(`[WS] 📊 Rate actual: ${requestsInLastMinute}/${GEMINI_RPM_LIMIT} RPM`);

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

        // Procesar MÚLTIPLES productos si all_items existe
        const itemsToProcess = result.all_items || [{name: result.product_name, confidence: result.confidence}];
        console.log('[WS] 📦 Items detectados en frame actual:', itemsToProcess.length);

        // Identificar productIds detectados en este frame
        const detectedProductIds = [];
        const newProductsToInsert = [];

        // Mapear nombres a productos del catálogo
        for (const item of itemsToProcess) {
          const productName = item.name || result.product_name;
          const product = products.find(
            (p) => p.name.toLowerCase() === productName.toLowerCase()
          );
          
          if (product) {
            detectedProductIds.push(product.productId);
            
            // Verificar si es NUEVO (no estaba visible antes)
            if (isNewProduct(scanId, product.productId)) {
              newProductsToInsert.push({
                product,
                confidence: item.confidence || result.confidence || 0.9,
                box: item.box || result.box_2d || null,
              });
            } else {
              console.log(`[WS] ♻️ ${product.name} ya está visible - NO se registra de nuevo`);
            }
          } else {
            console.warn(`[WS] ⚠️ Product not found in catalog: ${productName}`);
          }
        }

        console.log(`[WS] 🆕 Productos NUEVOS a registrar: ${newProductsToInsert.length}/${itemsToProcess.length}`);

        // Actualizar tracking: marcar productos actualmente detectados
        // Los que desaparecieron se remueven automáticamente
        updateVisibleProducts(scanId, detectedProductIds);

        // Insertar SOLO productos NUEVOS en la base de datos
        for (const {product, confidence, box} of newProductsToInsert) {
          try {
            // Insert detection
            const detection = await prisma.productDetection.create({
              data: {
                scanId,
                productId: product.productId,
                operatorId: scan.operatorId || undefined,
                confidence: confidence,
                videoFrameId: frameId,
                detectedAt: new Date(),
              },
              include: {
                product: true,
              },
            });

            // Emit to trolley room
            wsNamespace.to(`trolley_${scan.trolleyId}`).emit('product_detected', {
              event: 'product_detected',
              trolley_id: scan.trolleyId,
              product_id: product.productId,
              product_name: product.name,
              detected_at: detection.detectedAt,
              operator_id: scan.operatorId,
              confidence: confidence,
              box_2d: box,
            });

            console.log(
              `[WS] ✅ Producto NUEVO registrado: ${product.name} (confidence: ${confidence.toFixed(2)})`
            );
          } catch (itemError) {
            console.error('[WS] ❌ Error registrando producto:', itemError.message);
          }
        }
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

        // Limpiar tracking de productos visibles
        cleanupVisibleProducts(scanId);

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

