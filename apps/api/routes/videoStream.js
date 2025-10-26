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

// Tracking de productos ya registrados en cada sesión (scan)
// scanId -> Set([productId1, productId2, ...])
// Los productos permanecen en este Set durante TODA la sesión
const alreadyRegisteredProducts = new Map();

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
 * Verifica si un producto YA FUE REGISTRADO en esta sesión
 * Una vez registrado, permanece registrado hasta que termine el scan
 */
function isAlreadyRegistered(scanId, productId) {
  const registeredSet = alreadyRegisteredProducts.get(scanId);
  if (!registeredSet) {
    return false; // Primera detección en este scan
  }
  return registeredSet.has(productId); // true si ya fue registrado
}

/**
 * Marca producto como YA REGISTRADO en esta sesión
 * NO se remueve aunque desaparezca del frame
 */
function markAsRegistered(scanId, productId) {
  let registeredSet = alreadyRegisteredProducts.get(scanId);
  if (!registeredSet) {
    registeredSet = new Set();
    alreadyRegisteredProducts.set(scanId, registeredSet);
  }
  registeredSet.add(productId);
  console.log(`[WS] ✅ Producto ${productId} marcado como registrado en sesión ${scanId}`);
}

/**
 * Limpia tracking de productos registrados al finalizar scan
 */
function cleanupRegisteredProducts(scanId) {
  const registeredSet = alreadyRegisteredProducts.get(scanId);
  const count = registeredSet ? registeredSet.size : 0;
  alreadyRegisteredProducts.delete(scanId);
  console.log(`[WS] 🧹 Tracking limpiado para scan ${scanId} (${count} productos únicos registrados)`);
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

    // EVENT: join_trolley_room (para dashboard)
    socket.on('join_trolley_room', (payload) => {
      const { trolleyId } = payload;
      if (trolleyId) {
        socket.join(`trolley_${trolleyId}`);
        console.log(`[WS] Dashboard joined trolley room: trolley_${trolleyId}`);
      }
    });

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
        const { scanId, frameId, jpegBase64, scanType } = payload;
        
        console.log('[WS] 📊 Datos del frame:', {
          scanId,
          frameId,
          scanType: scanType || 'load',
          base64Length: jpegBase64?.length || 0,
          timestamp: Date.now()
        });

        const isReturnScan = scanType === 'return';
        let scan;
        let trolleyId;

        if (isReturnScan) {
          // Es un return scan
          scan = await prisma.returnScan.findUnique({
            where: { returnScanId: scanId },
            include: { trolley: true },
          });
          trolleyId = scan?.trolleyId;
        } else {
          // Es un scan normal
          scan = await prisma.scan.findUnique({
            where: { scanId },
            include: { trolley: true },
          });
          trolleyId = scan?.trolleyId;
        }

        if (!scan || scan.status !== 'recording') {
          console.warn(`[WS] ❌ Invalid or ended ${scanType || 'load'} scan: ${scanId}`);
          return;
        }
        
        console.log(`[WS] ✅ ${isReturnScan ? 'Return' : 'Load'} scan válido, obteniendo catálogo...`);

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
        console.log('[WS] 📦 Items detectados en frame:', itemsToProcess.length);

        const newProductsToInsert = [];

        // Mapear nombres a productos del catálogo
        for (const item of itemsToProcess) {
          const productName = item.name || result.product_name;
          const product = products.find(
            (p) => p.name.toLowerCase() === productName.toLowerCase()
          );
          
          if (product) {
            // Verificar si YA FUE REGISTRADO en esta sesión
            if (isAlreadyRegistered(scanId, product.productId)) {
              console.log(`[WS] ⏭️ ${product.name} ya fue registrado en esta sesión - Se omite`);
              continue; // Saltar este producto
            }
            
            // Es NUEVO para esta sesión, agregarlo a la lista
            newProductsToInsert.push({
              product,
              confidence: item.confidence || result.confidence || 0.9,
              box: item.box || result.box_2d || null,
            });
          } else {
            console.warn(`[WS] ⚠️ Product not found in catalog: ${productName}`);
          }
        }

        console.log(`[WS] 🆕 Productos NUEVOS a registrar: ${newProductsToInsert.length}/${itemsToProcess.length}`);

        // Insertar SOLO productos que NO han sido registrados antes en esta sesión
        for (const {product, confidence, box} of newProductsToInsert) {
          try {
            let detection;

            if (isReturnScan) {
              // Guardar en return_detections
              detection = await prisma.returnDetection.create({
                data: {
                  returnScanId: scanId,
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

              // Emitir evento de return scan a TODOS los clientes conectados
              const returnEvent = {
                event: 'product_detected',
                scan_type: 'return',
                trolley_id: trolleyId,
                product_id: product.productId,
                product_name: product.name,
                detected_at: detection.detectedAt,
                operator_id: scan.operatorId,
                confidence: confidence,
                box_2d: box,
              };
              
              // Emitir a todos los clientes conectados
              wsNamespace.emit('product_detected', returnEvent);
              console.log(`[WS] 📡 Evento return product_detected emitido a TODOS los clientes: ${product.name}`);
              
              // También emitir al socket directamente (para compatibilidad)
              socket.emit('product_detected', returnEvent);

              console.log(
                `[WS] ✅ [RETURN] Producto registrado: ${product.name} (confidence: ${confidence.toFixed(2)})`
              );
            } else {
              // Guardar en product_detections (scan normal)
              detection = await prisma.productDetection.create({
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

              // Emitir evento a TODOS los clientes conectados (incluyendo dashboard)
              const productEvent = {
                event: 'product_detected',
                scan_type: 'load',
                trolley_id: trolleyId,
                product_id: product.productId,
                product_name: product.name,
                detected_at: detection.detectedAt,
                operator_id: scan.operatorId,
                confidence: confidence,
                box_2d: box,
              };
              
              // Emitir a todos los clientes conectados
              wsNamespace.emit('product_detected', productEvent);
              console.log(`[WS] 📡 Evento product_detected emitido a TODOS los clientes: ${product.name}`);
              
              // También emitir al socket directamente (para compatibilidad)
              socket.emit('product_detected', productEvent);

              console.log(
                `[WS] ✅ [LOAD] Producto registrado por PRIMERA VEZ en sesión: ${product.name} (confidence: ${confidence.toFixed(2)})`
              );
            }

            // Marcar como registrado PERMANENTEMENTE en esta sesión
            markAsRegistered(scanId, product.productId);
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

        // Limpiar tracking de productos registrados
        cleanupRegisteredProducts(scanId);

        console.log(`[WS] Scan ${scanId} ended`);

        ack?.({ status: 'completed', endedAt: updated.endedAt });
      } catch (error) {
        console.error('[WS] Error ending scan:', error);
        ack?.({ error: 'Failed to end scan' });
      }
    });

    // EVENT: start_return_scan (NUEVO)
    socket.on('start_return_scan', async (payload, ack) => {
      try {
        let { scanId, trolleyId, operatorId } = payload;
        
        console.log(`[WS] 🔄 Iniciando return scan para scanId: ${scanId}`);
        console.log(`[WS] 📊 Parámetros recibidos:`, { scanId, trolleyId, operatorId });

        // Verificar que prisma está disponible
        if (!prisma) {
          console.error('[WS] ❌ Prisma client no está disponible');
          return ack?.({ error: 'Database connection not available' });
        }

        // Verificar que el scan original existe
        console.log(`[WS] 🔍 Buscando scan original con ID: ${scanId}`);
        let originalScan;
        try {
          originalScan = await prisma.scan.findUnique({
            where: { scanId },
          });
        } catch (dbError) {
          console.error('[WS] ❌ Error consultando base de datos:', dbError);
          return ack?.({ error: `Database error: ${dbError.message}` });
        }

        if (!originalScan) {
          console.error('[WS] ❌ Original scan not found:', scanId);
          return ack?.({ error: 'Original scan not found' });
        }
        
        console.log(`[WS] ✅ Scan original encontrado:`, {
          scanId: originalScan.scanId,
          trolleyId: originalScan.trolleyId,
          operatorId: originalScan.operatorId,
          status: originalScan.status
        });

        // Verificar si ya existe un return scan para este scan
        const existingReturnScan = await prisma.returnScan.findUnique({
          where: { scanId },
        });

        if (existingReturnScan) {
          console.log('[WS] Return scan already exists, usando existente:', existingReturnScan.returnScanId);
          return ack?.({
            returnScanId: existingReturnScan.returnScanId,
            scanId,
            status: existingReturnScan.status
          });
        }

        // Crear return scan - Usar IDs del scan original para evitar problemas de DB
        const trolleyIdToUse = originalScan.trolleyId; // Usar trolley del scan original
        const operatorIdToUse = originalScan.operatorId; // Usar operator del scan original
        
        console.log(`[WS] 🔄 Creando return scan para scan original ${scanId}`);
        console.log(`[WS] 📊 Usando trolleyId: ${trolleyIdToUse}, operatorId: ${operatorIdToUse}`);
        
        const returnScan = await prisma.returnScan.create({
          data: {
            scanId,
            trolleyId: trolleyIdToUse,
            operatorId: operatorIdToUse,
            status: 'recording',
            startedAt: new Date(),
          },
        });

        // Join trolley room si hay trolleyId
        if (trolleyIdToUse) {
          socket.join(`trolley_${trolleyIdToUse}`);
        }

        console.log(`[WS] ✅ Return Scan ${returnScan.returnScanId} started for original scan ${scanId}`);

        ack?.({ 
          returnScanId: returnScan.returnScanId, 
          scanId,
          status: 'recording' 
        });
      } catch (error) {
        console.error('[WS] ❌ Error starting return scan:', error);
        console.error('[WS] 📝 Error details:', {
          message: error.message,
          stack: error.stack,
          payload: payload
        });
        ack?.({ error: `Failed to start return scan: ${error.message}` });
      }
    });

    // EVENT: end_return_scan (NUEVO)
    socket.on('end_return_scan', async (payload, ack) => {
      try {
        const { returnScanId } = payload;

        const updated = await prisma.returnScan.update({
          where: { returnScanId },
          data: {
            endedAt: new Date(),
            status: 'completed',
          },
        });

        // Limpiar tracking de productos registrados
        cleanupRegisteredProducts(returnScanId);

        console.log(`[WS] ✅ Return Scan ${returnScanId} ended`);

        ack?.({ status: 'completed', endedAt: updated.endedAt });
      } catch (error) {
        console.error('[WS] Error ending return scan:', error);
        ack?.({ error: 'Failed to end return scan' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WS] User ${user.username} disconnected (${socket.id})`);
    });
  });

  console.log('[WS] Video stream namespace initialized at /ws');
}

module.exports = { initializeVideoStream };

