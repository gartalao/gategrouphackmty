// Types for Gemini Robotics-ER detection

export interface Box2D {
  y0: number; // top, 0-1000 normalized
  x0: number; // left, 0-1000 normalized
  y1: number; // bottom, 0-1000 normalized
  x1: number; // right, 0-1000 normalized
}

export interface DetectedItem {
  label: string; // Product name/identifier
  box_2d: Box2D;
  confidence: number; // 0.0 - 1.0
  brand?: string;
  color?: string;
}

export interface GeminiDetectionResult {
  items: DetectedItem[];
  metadata?: {
    frame_time_ms?: number;
    thinking_budget?: number;
    model?: string;
  };
}

export interface TrackedObject {
  id: string;
  label: string;
  brand?: string;
  box_2d: Box2D;
  confidence: number;
  firstSeen: number; // timestamp
  lastSeen: number; // timestamp
  frameCount: number;
  isNew: boolean; // true if newly entered the shelf
}

export interface ROIConfig {
  shelfId: number;
  roi: Box2D; // Region of interest for this shelf
}

export interface ProductMatch {
  productId: number;
  sku: string;
  name: string;
  brand?: string;
  matchScore: number; // 0.0 - 1.0
}

