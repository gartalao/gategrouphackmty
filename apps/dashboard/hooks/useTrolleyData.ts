"use client"

import { useEffect, useState, useCallback } from "react"
import type { RealtimeData } from "@/types"

// Mock data fallback for development
const generateMockData = (trolleyId: number): RealtimeData => {
  return {
    trolley_id: trolleyId,
    products: [],
    total_detections: 0,
    active_scan: {
      scan_id: 1,
      started_at: new Date().toISOString(),
      status: "recording",
      operator_id: 1,
    },
  }
}

export function useTrolleyData(trolleyId: number) {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Try to fetch real data from API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${apiUrl}/trolleys/${trolleyId}/realtime-status`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
      console.log('[Dashboard] Real trolley data loaded:', result)
    } catch (err) {
      console.warn('[Dashboard] API not available, using mock data:', err)
      // Fallback to mock data if API is not available
      const result = generateMockData(trolleyId)
      setData(result)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [trolleyId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
