const fetch = require('node-fetch');

const GEMINI_FAKE = process.env.GEMINI_FAKE === '1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-robotics-er-1.5-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Construye el prompt para Gemini Robotics-ER 1.5
 */
function buildPrompt(catalog) {
  const productList = catalog
    .map((p, idx) => {
      const keywords = p.detectionKeywords?.join(', ') || '';
      return `${idx + 1}. ${p.name} — ${p.visualDescription || 'Sin descripción'} — keywords: ${keywords}`;
    })
    .join('\n');

  return `Eres un sistema de visión EN TIEMPO REAL para catering aéreo.

TAREA:
Dado este FRAME de un operador cargando un trolley, decide si el operador está METIENDO alguno de los siguientes productos. Detecta por apariencia visual y texto visible. NO uses ni menciones SKUs, QR o códigos de barras.

PRODUCTOS:
${productList}

REGLAS:
- Responde detected:true SOLO si la acción visible es "placing_in_trolley" (producto entrando al trolley por la mano del operador).
- Si el producto ya está en el trolley o solo se sostiene, responde detected:false.
- Devuelve a lo sumo UN producto por frame.
- Si puedes, devuelve también "box_2d": [ymin, xmin, ymax, xmax] normalizado 0-1000 para el producto detectado.
- Prohíbe code fences. Respuesta JSON ESTRICTA y SOLO JSON.

FORMATO:
{ "detected": true|false, "product_name": "<nombre_exacto_del_producto>", "confidence": 0.0-1.0, "action": "placing_in_trolley", "box_2d": [ymin, xmin, ymax, xmax] }

Si no detectas producto:
{ "detected": false }`.trim();
}

/**
 * Parseo robusto de JSON de la respuesta de Gemini
 */
function safeParseDetection(text) {
  try {
    // Intentar parseo directo primero
    const direct = JSON.parse(text);
    if (typeof direct === 'object' && 'detected' in direct) {
      return direct;
    }
  } catch (e) {
    // Continuar con regex
  }

  // Extraer primer bloque JSON con regex
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    console.warn('[Gemini] No JSON found in response:', text.substring(0, 200));
    return { detected: false };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validar campos requeridos
    if (typeof parsed.detected !== 'boolean') {
      return { detected: false };
    }

    return parsed;
  } catch (error) {
    console.error('[Gemini] Failed to parse JSON:', error.message);
    return { detected: false };
  }
}

/**
 * Analiza un frame con Gemini Robotics-ER 1.5 REST API
 */
async function analyzeFrameReal(jpegBase64, catalog, opts) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = buildPrompt(catalog);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: jpegBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      thinkingConfig: {
        thinkingBudget: 0, // Latencia mínima
      },
    },
  };

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error:', response.status, errorText);
      return { detected: false };
    }

    const json = await response.json();

    // Extraer texto de la respuesta
    const text =
      json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

    if (!text) {
      console.warn('[Gemini] Empty response from API');
      return { detected: false };
    }

    // Parseo robusto
    const parsed = safeParseDetection(text);

    // Validar threshold
    if (parsed.detected && parsed.confidence && parsed.confidence < opts.threshold) {
      console.log(
        `[Gemini] Detection below threshold: ${parsed.confidence} < ${opts.threshold}`
      );
      return { detected: false };
    }

    // Validar acción
    if (parsed.detected && parsed.action !== 'placing_in_trolley') {
      console.log(`[Gemini] Wrong action: ${parsed.action}, expected placing_in_trolley`);
      return { detected: false };
    }

    return parsed;
  } catch (error) {
    console.error('[Gemini] Error calling API:', error.message);
    return { detected: false };
  }
}

/**
 * Analiza un frame con heurística FAKE (para testing sin API)
 */
function analyzeFrameFake(frameId, catalog) {
  const lowerId = frameId.toLowerCase();

  // Buscar matches en keywords
  for (const product of catalog) {
    const keywords = product.detectionKeywords || [];
    const found = keywords.some((kw) => lowerId.includes(kw.toLowerCase()));

    if (found) {
      const confidence = 0.85 + Math.random() * 0.1;
      return {
        detected: true,
        product_name: product.name,
        confidence,
        action: 'placing_in_trolley',
        box_2d: [
          Math.floor(300 + Math.random() * 200), // ymin
          Math.floor(300 + Math.random() * 200), // xmin
          Math.floor(600 + Math.random() * 200), // ymax
          Math.floor(600 + Math.random() * 200), // xmax
        ],
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
  safeParseDetection,
};
