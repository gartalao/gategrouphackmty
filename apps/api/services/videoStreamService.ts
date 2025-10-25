import { GoogleGenerativeAI } from '@google/generative-ai';

interface VideoStreamConfig {
  apiKey: string;
  model?: string;
  threshold?: number;
  frameInterval?: number;
}

interface DetectionResult {
  detected: boolean;
  product_name?: string;
  confidence?: number;
  action?: string;
}

interface ProductCatalogItem {
  productId: number;
  name: string;
  visualDescription?: string;
  detectionKeywords?: string[];
}

export class VideoStreamService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private threshold: number;
  private frameInterval: number;
  private isInitialized = false;
  private activeStreams = new Map<string, any>();

  constructor(config: VideoStreamConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.model || 'gemini-1.5-flash'
    });
    this.threshold = config.threshold || 0.7;
    this.frameInterval = config.frameInterval || 1000; // 1 frame per second
    this.isInitialized = true;
  }

  /**
   * Builds the prompt for Gemini with product catalog and recent context
   */
  private buildPrompt(catalog: ProductCatalogItem[], recentDetections: any[]): string {
    const productList = catalog
      .map((p, idx) => {
        const keywords = p.detectionKeywords?.join(', ') || '';
        return `${idx + 1}. "${p.name}" - ${p.visualDescription || 'Sin descripción'} [Keywords: ${keywords}]`;
      })
      .join('\n');

    const recentContext = recentDetections.length > 0
      ? `\n\nCONTEXTO RECIENTE (últimas detecciones):\n${recentDetections
          .slice(-3)
          .map(d => `- ${d.product_name} detectado ${d.count} vez(es)`)
          .join('\n')}`
      : '';

    return `Eres un sistema de visión EN TIEMPO REAL para catering aéreo.

TAREA:
Analiza este FRAME de un operador cargando un trolley y decide si el operador está METIENDO alguno de los productos definidos.${recentContext}

REGLAS:
- Detecta por apariencia visual y texto visible en el empaque.
- NO uses códigos de barras, SKUs ni QR.
- Marca detected:true SOLO si la acción es "placing_in_trolley".
- Si el producto ya está en el trolley o solo se sostiene, responde detected:false.
- Reporta a lo sumo UN producto por frame.
- Considera el contexto reciente para evitar falsos positivos.

PRODUCTOS A DETECTAR:
${productList}

FORMATO DE RESPUESTA ESTRICTO (solo JSON, sin markdown):
{ "detected": true|false, "product_name": "<nombre_exacto_del_producto>", "confidence": 0.0-1.0, "action": "placing_in_trolley" }

Si no detectas ningún producto siendo colocado:
{ "detected": false }`;
  }

  /**
   * Analyzes a video frame with Gemini
   */
  async analyzeFrame(
    imageData: string, // base64 jpeg
    catalog: ProductCatalogItem[],
    recentDetections: any[] = [],
    options: { threshold?: number } = {}
  ): Promise<DetectionResult> {
    if (!this.isInitialized) {
      throw new Error('VideoStreamService not initialized');
    }

    const prompt = this.buildPrompt(catalog, recentDetections);
    const threshold = options.threshold || this.threshold;

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

      // Parse JSON (Gemini sometimes includes markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Gemini did not return valid JSON:', text);
        return { detected: false };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate threshold
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
   * Starts a video stream for a specific scan
   */
  startStream(streamId: string, config: any) {
    this.activeStreams.set(streamId, {
      config,
      lastDetection: null,
      recentDetections: [],
      frameCount: 0,
      lastFrameTime: Date.now(),
    });
  }

  /**
   * Processes a frame for a specific stream
   */
  async processFrame(
    streamId: string,
    frameData: string,
    catalog: ProductCatalogItem[]
  ): Promise<{ result: DetectionResult; shouldStore: boolean }> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Check if we should process this frame (throttling)
    const now = Date.now();
    const timeSinceLastFrame = now - stream.lastFrameTime;
    
    if (timeSinceLastFrame < this.frameInterval) {
      return { result: { detected: false }, shouldStore: false };
    }

    stream.lastFrameTime = now;
    stream.frameCount++;

    // Analyze frame with context
    const result = await this.analyzeFrame(
      frameData,
      catalog,
      stream.recentDetections
    );

    // Update recent detections
    if (result.detected && result.product_name) {
      const existing = stream.recentDetections.find(
        d => d.product_name === result.product_name
      );
      
      if (existing) {
        existing.count++;
        existing.lastSeen = now;
      } else {
        stream.recentDetections.push({
          product_name: result.product_name,
          count: 1,
          lastSeen: now,
        });
      }

      // Keep only last 5 detections
      if (stream.recentDetections.length > 5) {
        stream.recentDetections.shift();
      }

      stream.lastDetection = { ...result, timestamp: now };
    }

    // Decide if we should store this detection
    // Store if: detected AND (first time OR significant confidence change)
    const shouldStore = result.detected && (
      !stream.lastDetection ||
      Math.abs((result.confidence || 0) - (stream.lastDetection.confidence || 0)) > 0.2
    );

    return { result, shouldStore };
  }

  /**
   * Stops a video stream
   */
  stopStream(streamId: string) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      // Clean up any pending operations
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Gets stream statistics
   */
  getStreamStats(streamId: string) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return null;

    return {
      frameCount: stream.frameCount,
      recentDetections: stream.recentDetections,
      lastDetection: stream.lastDetection,
    };
  }
}
