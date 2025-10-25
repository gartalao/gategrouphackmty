import fs from 'fs';
import Ajv from 'ajv';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { VisionResult } from '../types/contracts';
import visionSchema from '../schemas/vision/schema.json';

const ajv = new Ajv();
const validate = ajv.compile(visionSchema);

const VISION_PROMPT = `Eres un sistema de detección de productos en trolleys de catering aéreo para GateGroup.

Tu tarea es analizar esta imagen de una repisa de trolley y detectar TODOS los productos visibles, identificándolos por su SKU del catálogo.

CATÁLOGO DE SKUs VÁLIDOS:
- COK-REG-330: Coca-Cola Regular 330ml (lata roja con logo blanco)
- COK-ZER-330: Coca-Cola Zero 330ml (lata negra con logo rojo)
- PEP-REG-330: Pepsi Regular 330ml (lata azul con logo blanco)
- WTR-REG-500: Agua Natural 500ml (botella transparente con tapa azul)
- WTR-SPK-500: Agua con Gas 500ml (botella transparente con tapa verde)
- JUC-ORA-250: Jugo de Naranja 250ml (caja tetrapack naranja)
- JUC-APP-250: Jugo de Manzana 250ml (caja tetrapack roja)
- SNK-PRT-50: Pretzels Salados 50g (bolsa amarilla con pretzel en foto)
- SNK-CHI-40: Chips Papas 40g (bolsa roja con papas en foto)
- SNK-NUT-35: Nueces Mixtas 35g (bolsa café con nueces)

INSTRUCCIONES CRÍTICAS:
1. Cuenta cuidadosamente cada unidad visible de cada SKU
2. SOLO reporta SKUs que existen en el catálogo de arriba
3. Si ves un producto pero NO estás seguro del SKU exacto, BAJA el confidence (<0.70)
4. NO inventes SKUs que no están en el catálogo
5. Si un producto está parcialmente oculto o borroso, añade una nota explicativa
6. El campo "confidence" debe reflejar qué tan seguro estás de la identificación:
   - 0.90-1.00: Totalmente seguro, producto claramente visible
   - 0.80-0.89: Muy seguro, algunos podrían estar parcialmente ocultos
   - 0.70-0.79: Razonablemente seguro, pero hay alguna ambigüedad
   - 0.60-0.69: Inseguro, producto borroso o parcialmente visible
   - <0.60: Muy inseguro, requiere validación manual
7. Evalúa la calidad de la imagen y condiciones de iluminación en el campo metadata

CASOS ESPECIALES:
- Si la imagen está completamente borrosa o no se ven productos: retorna {"items": [], "metadata": {"image_quality": "poor", "lighting_conditions": "poor", "total_items_visible": 0}}
- Si ves productos pero ninguno coincide con el catálogo: retorna {"items": [], "metadata": {"image_quality": "good", "lighting_conditions": "good", "total_items_visible": X}} donde X es el número de items visibles

Analiza la imagen ahora y retorna el JSON.`;

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

export async function analyzeImageWithVision(
  imagePath: string,
  retries = 3
): Promise<VisionResult> {
  const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < retries) {
    attempt++;
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: attempt === 1 ? 'gpt-4o-mini' : 'gpt-4o', // Fallback to full model on retry
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: VISION_PROMPT },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1000,
          temperature: 0.1,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json() as OpenAIResponse;
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as OpenAIResponse;

      if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
        throw new Error('Invalid response from OpenAI API');
      }

      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content) as VisionResult;

      // Validate with Ajv
      const valid = validate(parsed);
      if (!valid) {
        logger.error({ errors: validate.errors }, 'Vision schema validation failed');
        throw new Error('Invalid JSON schema from Vision LLM');
      }

      logger.info({ duration, attempt, itemsCount: parsed.items.length }, 'Vision analysis successful');

      return parsed;
    } catch (error) {
      lastError = error as Error;
      logger.warn({ attempt, error: (error as Error).message }, 'Vision analysis attempt failed');

      if (attempt < retries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Vision analysis failed after all retries');
}

