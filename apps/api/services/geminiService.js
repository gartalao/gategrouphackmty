const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_FAKE = process.env.GEMINI_FAKE === '1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro-vision';

let genAI = null;
let model = null;

if (!GEMINI_FAKE && GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

/**
 * Construye el prompt para Gemini con el catálogo de productos
 */
function buildPrompt(catalog) {
  const productList = catalog
    .map((p, idx) => {
      const keywords = p.detectionKeywords?.join(', ') || '';
      return `${idx + 1}. "${p.name}" - ${p.visualDescription || 'Sin descripción'} [Keywords: ${keywords}]`;
    })
    .join('\n');

  return `Eres un sistema de visión EN TIEMPO REAL para catering aéreo.

TAREA:
Analiza este FRAME de un operador cargando un trolley y decide si el operador está METIENDO alguno de los productos definidos.

REGLAS:
- Detecta por apariencia visual y texto visible en el empaque.
- NO uses códigos de barras, SKUs ni QR.
- Marca detected:true SOLO si la acción es "placing_in_trolley".
- Si el producto ya está en el trolley o solo se sostiene, responde detected:false.
- Reporta a lo sumo UN producto por frame.

PRODUCTOS A DETECTAR:
${productList}

FORMATO DE RESPUESTA ESTRICTO (solo JSON, sin markdown):
{ "detected": true|false, "product_name": "<nombre_exacto_del_producto>", "confidence": 0.0-1.0, "action": "placing_in_trolley" }

Si no detectas ningún producto siendo colocado:
{ "detected": false }`;
}

/**
 * Analiza un frame con Gemini (REAL mode)
 */
async function analyzeFrameReal(jpegBase64, catalog, opts) {
  if (!model) {
    throw new Error('Gemini model not initialized. Check GEMINI_API_KEY.');
  }

  const prompt = buildPrompt(catalog);

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: jpegBase64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parsear el JSON (Gemini a veces incluye markdown, limpiamos)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Gemini did not return valid JSON:', text);
      return { detected: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validar threshold
    if (parsed.detected && parsed.confidence && parsed.confidence < opts.threshold) {
      console.log(`Detection below threshold: ${parsed.confidence} < ${opts.threshold}`);
      return { detected: false };
    }

    return parsed;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { detected: false };
  }
}

/**
 * Analiza un frame con heurística FAKE (para testing)
 */
function analyzeFrameFake(frameId, catalog) {
  // Heurística simple basada en frameId o keywords
  const lowerId = frameId.toLowerCase();

  for (const product of catalog) {
    const keywords = product.detectionKeywords || [];
    const found = keywords.some((kw) => lowerId.includes(kw.toLowerCase()));

    if (found) {
      return {
        detected: true,
        productSlug: product.name.toLowerCase().replace(/\s+/g, '_'),
        confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
        action: 'placing_in_trolley',
      };
    }
  }

  return { detected: false };
}

/**
 * Punto de entrada principal para analizar un frame
 */
async function analyzeFrame(jpegBase64OrFrameId, catalog, opts) {
  opts = opts || { threshold: 0.7 };
  
  if (GEMINI_FAKE) {
    console.log('[FAKE MODE] Using heuristic detection');
    return analyzeFrameFake(jpegBase64OrFrameId, catalog);
  }

  return analyzeFrameReal(jpegBase64OrFrameId, catalog, opts);
}

/**
 * Resolver nombre de producto a slug
 */
function productNameToSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '');
}

module.exports = {
  buildPrompt,
  analyzeFrame,
  productNameToSlug,
};
