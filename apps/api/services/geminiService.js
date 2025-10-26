const fetch = require('node-fetch');

const GEMINI_FAKE = process.env.GEMINI_FAKE === '1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// FORZAR MODELO CORRECTO
const GEMINI_MODEL = 'gemini-robotics-er-1.5-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log('[Gemini] Configurado con modelo:', GEMINI_MODEL);
console.log('[Gemini] URL:', GEMINI_URL);

/**
 * Construye prompt ULTRA RÁPIDO para detección multi-objeto
 * Detecta SOLO los que están visibles, búsqueda rápida por COLOR
 */
function buildPrompt(catalog) {
  // Lista compacta: nombre + palabras clave visuales
  const productList = catalog
    .map(p => `${p.name}: ${p.visualDescription}`)
    .join('\n');

  return `Detecta SOLO productos que VES en la imagen. Catálogo:
${productList}

Busca RÁPIDO por COLOR primero, luego TEXTO:
- ROJO→Coca-Cola/Canelitas - VERDE→Sprite/Heineken - AZUL→Pepsi/Príncipe
- NEGRO→Zero - GRIS→Light - AMARILLO→Sabritas/Schweppes - NARANJA→Doritos
- MORADO→Takis/Valle Uva - ROSA→Electrolit - CELESTE→Ciel

Responde JSON (sin markdown):
{"items":[{"name":"Coca-Cola Regular Lata","confidence":0.95}],"action":"placing"}

Si NO ves productos:
{"items":[],"action":"none"}

CRÍTICO: Solo incluye productos QUE VES con confidence>=0.70`.trim();
}

/**
 * Parseo robusto para respuestas multi-objeto
 */
function safeParseDetection(text) {
  try {
    // Intentar parseo directo
    const direct = JSON.parse(text);
    
    // Formato multi-objeto nuevo
    if (direct.items && Array.isArray(direct.items)) {
      // Convertir a formato compatible
      if (direct.items.length > 0) {
        const firstItem = direct.items[0];
        return {
          detected: true,
          product_name: firstItem.name,
          confidence: firstItem.confidence || 0.9,
          action: direct.action === 'placing' ? 'placing_in_trolley' : 'none',
          all_items: direct.items, // Guardar todos los items detectados
        };
      }
      return { detected: false };
    }
    
    // Formato antiguo (single object)
    if (typeof direct === 'object' && 'detected' in direct) {
      return direct;
    }
  } catch (e) {
    // Continuar con regex
  }

  // Extraer JSON con regex
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    console.warn('[Gemini] No JSON found in response:', text.substring(0, 200));
    return { detected: false };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Multi-objeto
    if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
      const firstItem = parsed.items[0];
      return {
        detected: true,
        product_name: firstItem.name,
        confidence: firstItem.confidence || 0.9,
        action: parsed.action === 'placing' ? 'placing_in_trolley' : 'none',
        all_items: parsed.items,
      };
    }
    
    // Single objeto
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
      temperature: 0.1, // Más determinístico = más rápido
      maxOutputTokens: 150, // Limitar respuesta para velocidad
      topP: 0.8,
      topK: 10,
      thinkingConfig: {
        thinkingBudget: 0, // Sin thinking = máxima velocidad
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
