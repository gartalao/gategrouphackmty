export interface VisionItem {
  sku: string;
  quantity: number;
  confidence: number;
  notes?: string | null;
}

export interface VisionResult {
  items: VisionItem[];
  metadata?: {
    image_quality?: 'excellent' | 'good' | 'fair' | 'poor';
    lighting_conditions?: 'good' | 'acceptable' | 'poor';
    total_items_visible?: number;
  };
}

export interface DiffResult {
  sku: string;
  required: number;
  detected: number;
  diff: number;
  type: 'missing' | 'extra' | 'match' | 'mismatch';
  priority?: string;
}

export interface ScanResponse {
  scan_id: number;
  status: 'ok' | 'alert';
  items: Array<{
    sku: string;
    qty: number;
    confidence: number;
  }>;
  diffs: DiffResult[];
  confidence_avg: number;
  image_url?: string;
}

export interface ShelfStatus {
  shelf_id: number;
  shelf_number: number;
  position: string | null;
  color: 'green' | 'yellow' | 'red';
  last_scan_at: Date | null;
  avg_confidence: number;
  active_alerts: number;
  diffs: DiffResult[];
  image_url?: string;
}

export interface TrolleyStatusResponse {
  trolley_id: number;
  trolley_code: string;
  flight_id: number | null;
  flight_number: string | null;
  status: string;
  shelves: ShelfStatus[];
  summary: {
    total_scans: number;
    avg_confidence: number;
    active_alerts: number;
    overall_status: 'green' | 'yellow' | 'red';
  };
}

