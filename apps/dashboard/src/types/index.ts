export interface Product {
  product_id: number
  product_name: string
  category: string
  count: number
}

export interface ActiveScan {
  scan_id: number
  started_at: string
  operator_id: number
}

export interface RealtimeData {
  trolley_id: number
  active_scan: ActiveScan | null
  products: Product[]
  total_detections: number
}

export interface ProductDetectedEvent {
  event: "product_detected"
  trolley_id: number
  product_id: number
  product_name: string
  category: string
  detected_at: string
  operator_id: number
  confidence: number
  box_2d?: number[]
}

export interface Detection {
  detection_id: number
  product: {
    id: number
    name: string
    category: string
  }
  detected_at: string
  confidence: number
  scan: {
    id: number
    started_at: string
    status: string
  }
  operator: {
    id: number
    username: string
    full_name: string
  }
}

export interface CategoryStat {
  category: string
  count: number
  percentage: number
}
