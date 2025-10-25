const fetch = require('node-fetch');

const GEMINI_FAKE = process.env.GEMINI_FAKE === '1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// FORZAR MODELO CORRECTO
const GEMINI_MODEL = 'gemini-robotics-er-1.5-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log('[Gemini] Configurado con modelo:', GEMINI_MODEL);
console.log('[Gemini] URL:', GEMINI_URL);

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

  return `Eres un sistema experto de visión computacional para detectar productos en trolleys de catering aéreo.

PRODUCTOS DISPONIBLES:
${productList}

TAREA: Detecta SI HAY algún producto visible en la imagen.

MÉTODO DE DETECCIÓN:
1. Busca PRIMERO por características visuales distintivas:
   - Coca-Cola 350ml: Lata ROJA con logo blanco
   - Coca-Cola Zero 350ml: Lata NEGRA con logo plateado
   - Sprite 350ml: Lata VERDE/TRANSPARENTE con logo verde-azul
   - Pepsi 350ml: Lata AZUL con logo rojo/blanco
   - Agua Natural 500ml: Botella TRANSPARENTE
   - Lays Original 100gr: Bolsa AMARILLA brillante
   - Lays Queso 100gr: Bolsa NARANJA
   - Doritos Nacho 100gr: Bolsa ROJA/NARANJA con triángulos

2. Busca texto en etiquetas: "Coca-Cola", "Sprite", "Pepsi", "Lays", "Doritos"
3. Identifica la forma: lata cilíndrica, botella, bolsa de papas
4. Si el producto está siendo colocado en el trolley, marca: "action": "placing_in_trolley"

FORMATO DE RESPUESTA (SOLO JSON, SIN MARKDOWN):
{"detected": true, "product_name": "Coca-Cola 350ml", "confidence": 0.95, "action": "placing_in_trolley", "box_2d": [ymin, xmin, ymax, xmax]}

Si NO ves ningún producto:
{"detected": false}

IMPORTANTE: 
- Usa el nombre EXACTO del producto de la lista
- Solo detecta si estás seguro (confidence >= 0.70)
- Responde SOLO con JSON, sin explicaciones`.trim();
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
  console.log('[Gemini] 🚀 Iniciando análisis con Gemini API');
  console.log('[Gemini] 📦 Catálogo:', catalog.length, 'productos');
  console.log('[Gemini] 📊 Base64 length:', jpegBase64.length);
  
  if (!GEMINI_API_KEY) {
    console.error('[Gemini] ❌ GEMINI_API_KEY not configured');
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = buildPrompt(catalog);
  console.log('[Gemini] 📝 Prompt generado:', prompt.substring(0, 200) + '...');

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
    console.log('[Gemini] 📡 Enviando request a:', GEMINI_URL);
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Gemini] 📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 429) {
        console.error('[Gemini] ⚠️ RATE LIMIT EXCEEDED (429) - Demasiadas peticiones');
        console.error('[Gemini] 💡 Reduce la frecuencia de frames o espera antes de enviar el siguiente');
      } else if (response.status === 404) {
        console.error('[Gemini] ❌ Model NOT FOUND (404) - Verifica el nombre del modelo');
      } else {
        console.error('[Gemini] ❌ API error:', response.status, errorText.substring(0, 500));
      }
      
      return { detected: false, error: response.status };
    }

    const json = await response.json();
    console.log('[Gemini] 📦 JSON response:', JSON.stringify(json).substring(0, 500));

    // Extraer texto de la respuesta
    const text =
      json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

    console.log('[Gemini] 📄 Texto extraído:', text.substring(0, 300));

    if (!text) {
      console.warn('[Gemini] ⚠️ Empty response from API');
      return { detected: false };
    }

    // Parseo robusto
    const parsed = safeParseDetection(text);
    console.log('[Gemini] 🔍 Parsed result:', JSON.stringify(parsed));

    // Validar threshold
    if (parsed.detected && parsed.confidence && parsed.confidence < opts.threshold) {
      console.log(
        `[Gemini] ⚪ Detection below threshold: ${parsed.confidence} < ${opts.threshold}`
      );
      return { detected: false };
    }

    // Validar acción
    if (parsed.detected && parsed.action !== 'placing_in_trolley') {
      console.log(`[Gemini] ⚠️ Wrong action: ${parsed.action}, expected placing_in_trolley`);
      return { detected: false };
    }

    console.log('[Gemini] ✅ Detección válida:', parsed);
    return parsed;
  } catch (error) {
    console.error('[Gemini] ❌ Error calling API:', error.message);
    console.error('[Gemini] Stack:', error.stack);
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
