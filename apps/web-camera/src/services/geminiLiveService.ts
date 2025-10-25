import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
}

export interface DetectionResult {
  detected: boolean;
  product_name?: string;
  confidence?: number;
  action?: string;
}

export interface ProductCatalog {
  productId: number;
  name: string;
  visualDescription?: string;
  detectionKeywords?: string[];
}

export class GeminiLiveService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private isInitialized = false;

  constructor(config: GeminiLiveConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash' 
    });
    this.isInitialized = true;
  }

  /**
   * Construye el prompt para Gemini con el catálogo de productos
   */
  private buildPrompt(catalog: ProductCatalog[]): string {
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
   * Analiza un frame de video con Gemini
   */
  async analyzeFrame(
    imageData: string, // base64 o blob URL
    catalog: ProductCatalog[],
    options: { threshold?: number } = {}
  ): Promise<DetectionResult> {
    if (!this.isInitialized) {
      throw new Error('GeminiLiveService not initialized');
    }

    const prompt = this.buildPrompt(catalog);
    const threshold = options.threshold || 0.7;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
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
      if (parsed.detected && parsed.confidence && parsed.confidence < threshold) {
        console.log(`Detection below threshold: ${parsed.confidence} < ${threshold}`);
        return { detected: false };
      }

      return parsed;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return { detected: false };
    }
  }

  /**
   * Convierte un frame de video a base64
   */
  static async videoFrameToBase64(videoElement: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    ctx.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Remove data:image/jpeg;base64, prefix
  }
}
