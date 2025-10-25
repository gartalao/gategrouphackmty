import { GoogleGenerativeAI } from '@google/generative-ai';

interface ImprovedConfig {
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

/**
 * Improved Video Stream Service
 * Simula comportamiento similar a Live API usando la Gemini API estándar
 */
export class ImprovedVideoStreamService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private threshold: number;
  private frameInterval: number;
  private activeStreams = new Map<string, any>();

  constructor(config: ImprovedConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.model || 'gemini-1.5-flash'
    });
    this.threshold = config.threshold || 0.7;
    this.frameInterval = config.frameInterval || 500; // 2 fps (más rápido)
  }

  /**
   * Start a stream with conversational context
   */
  startStream(streamId: string, config: any) {
    this.activeStreams.set(streamId, {
      config,
      chatHistory: [], // Mantener historial conversacional
      recentDetections: [],
      frameCount: 0,
      lastFrameTime: Date.now(),
    });
  }

  /**
   * Process frame with conversational context
   */
  async processFrame(
    streamId: string,
    frameData: string,
    catalog: ProductCatalogItem[]
  ): Promise<{ result: DetectionResult; shouldStore: boolean }> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) throw new Error(`Stream ${streamId} not found`);

    // Throttling más agresivo
    const now = Date.now();
    if (now - stream.lastFrameTime < this.frameInterval) {
      return { result: { detected: false }, shouldStore: false };
    }

    stream.lastFrameTime = now;
    stream.frameCount++;

    // Analizar con contexto conversacional
    const prompt = this.buildConversationalPrompt(catalog, stream.chatHistory, stream.recentDetections);
    
    try {
      // Usar el historial de conversación
      const parts = stream.chatHistory.length > 0 
        ? [...stream.chatHistory, { text: prompt, inlineData: { mimeType: 'image/jpeg', data: frameData } }]
        : [{ text: prompt, inlineData: { mimeType: 'image/jpeg', data: frameData } }];

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      // Actualizar historial conversacional (mantener últimos 10 mensajes)
      stream.chatHistory.push({ role: 'user', parts: [{ text: prompt }] });
      stream.chatHistory.push({ role: 'model', parts: [{ text }] });
      
      if (stream.chatHistory.length > 10) {
        stream.chatHistory.shift(); // Eliminar mensajes antiguos
      }

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { result: { detected: false }, shouldStore: false };
      }

      const parsed: DetectionResult = JSON.parse(jsonMatch[0]);

      // Validar threshold
      if (parsed.detected && parsed.confidence && parsed.confidence < this.threshold) {
        return { result: { detected: false }, shouldStore: false };
      }

      // Update recent detections
      if (parsed.detected && parsed.product_name) {
        const existing = stream.recentDetections.find(d => d.product_name === parsed.product_name);
        if (existing) {
          existing.count++;
        } else {
          stream.recentDetections.push({ product_name: parsed.product_name, count: 1 });
          if (stream.recentDetections.length > 5) stream.recentDetections.shift();
        }
      }

      // Decidir si guardar (evitar duplicados)
      const shouldStore = parsed.detected && (
        !stream.lastDetection ||
        parsed.product_name !== stream.lastDetection.product_name ||
        Math.abs((parsed.confidence || 0) - (stream.lastDetection.confidence || 0)) > 0.15
      );

      if (parsed.detected) {
        stream.lastDetection = { ...parsed, timestamp: now };
      }

      return { result: parsed, shouldStore };
    } catch (error) {
      console.error('Error processing frame:', error);
      return { result: { detected: false }, shouldStore: false };
    }
  }

  private buildConversationalPrompt(
    catalog: ProductCatalogItem[],
    chatHistory: any[],
    recentDetections: any[]
  ): string {
    const productList = catalog
      .map((p, idx) => `${idx + 1}. "${p.name}" - ${p.visualDescription || ''}`)
      .join('\n');

    const historyContext = chatHistory.length > 0 
      ? `\n\nCONTEXTO DE LA CONVERSACIÓN:\nYa estamos analizando este trolley. Continúa el análisis.`
      : `\n\nEste es el INICIO del análisis de un trolley.`;

    const recentContext = recentDetections.length > 0
      ? `\nDetecciones recientes:\n${recentDetections.map(d => `- ${d.product_name}: ${d.count}x`).join('\n')}`
      : '';

    return `Eres un analista de catering aéreo analizando un trolley en tiempo real.

PRODUCTOS ESPERADOS:
${productList}
${historyContext}${recentContext}

TAREA: ¿Hay un operador colocando alguno de estos productos AHORA?

RESPONDE SOLO CON JSON:
{ "detected": true|false, "product_name": "...", "confidence": 0.0-1.0, "action": "placing_in_trolley" }`;
  }

  stopStream(streamId: string) {
    this.activeStreams.delete(streamId);
  }

  getStreamStats(streamId: string) {
    const stream = this.activeStreams.get(streamId);
    return stream ? {
      frameCount: stream.frameCount,
      recentDetections: stream.recentDetections,
      chatHistoryLength: stream.chatHistory.length,
    } : null;
  }
}
