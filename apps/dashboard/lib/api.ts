const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface TrolleyStatus {
  trolley_id: number
  trolley_code: string
  flight_id: number | null
  flight_number: string | null
  status: string
  shelves: ShelfStatus[]
  summary: {
    total_scans: number
    avg_confidence: number
    active_alerts: number
    overall_status: 'green' | 'yellow' | 'red'
  }
}

export interface ShelfStatus {
  shelf_id: number
  shelf_number: number
  position: string | null
  color: 'green' | 'yellow' | 'red'
  last_scan_at: string | null
  avg_confidence: number
  active_alerts: number
  diffs: Diff[]
  image_url?: string
}

export interface Diff {
  sku: string
  required: number
  detected: number
  diff: number
  type: 'missing' | 'extra' | 'match' | 'mismatch'
  priority?: string
}

export interface KPIOverview {
  date: string
  flight_id: number | null
  trolley_id: number | null
  metrics: {
    scans: {
      total: number
      completed: number
      failed: number
      processing: number
    }
    confidence: {
      average: number
    }
    alerts: {
      total_created: number
      active: number
      resolved: number
      critical: number
      by_type: Record<string, number>
    }
  }
  generated_at: string
}

export async function fetchTrolleyStatus(trolleyId: number): Promise<TrolleyStatus> {
  const response = await fetch(`${API_URL}/trolleys/${trolleyId}/status`)
  if (!response.ok) {
    throw new Error('Failed to fetch trolley status')
  }
  return response.json()
}

export async function fetchKPIs(params?: {
  date?: string
  flight_id?: number
  trolley_id?: number
}): Promise<KPIOverview> {
  const query = new URLSearchParams()
  if (params?.date) query.set('date', params.date)
  if (params?.flight_id) query.set('flight_id', params.flight_id.toString())
  if (params?.trolley_id) query.set('trolley_id', params.trolley_id.toString())

  const response = await fetch(`${API_URL}/kpis/overview?${query.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch KPIs')
  }
  return response.json()
}

export { API_URL }

