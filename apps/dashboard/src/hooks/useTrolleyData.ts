"use client"

import { useEffect, useState } from "react"
import type { RealtimeData } from "../types"

const API_BASE = "http://localhost:3001/api"

export function useTrolleyData(trolleyId: number) {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/trolleys/${trolleyId}/realtime-status`)
      if (!response.ok) throw new Error("Failed to fetch trolley data")
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error("[v0] Error fetching trolley data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [trolleyId])

  return { data, loading, error, refetch: fetchData }
}
