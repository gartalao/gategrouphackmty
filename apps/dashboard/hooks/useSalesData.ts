"use client"

import { useEffect, useState, useCallback } from "react"
import type { Product, SalesData } from "@/types"

export function useSalesData(trolleyId: number, loadScanId?: number, returnScanId?: number) {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSalesData = useCallback(async () => {
    if (!loadScanId) {
      console.log('[Dashboard] No loadScanId provided, skipping sales data fetch')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      console.log('[Dashboard] Fetching sales data for loadScanId:', loadScanId)
      
      // Obtener productos del Load Scan
      const loadResponse = await fetch(`${apiUrl}/scans/${loadScanId}/summary`)
      
      if (!loadResponse.ok) {
        throw new Error(`Load scan API error: ${loadResponse.status} ${loadResponse.statusText}`)
      }
      
      const loadData = await loadResponse.json()
      console.log('[Dashboard] Load scan data:', loadData)
      
      let returnData = { products: [] }
      if (returnScanId) {
        // Obtener productos del Return Scan
        console.log('[Dashboard] Fetching return scan data for returnScanId:', returnScanId)
        const returnResponse = await fetch(`${apiUrl}/scans/${returnScanId}/summary`)
        
        if (returnResponse.ok) {
          returnData = await returnResponse.json()
          console.log('[Dashboard] Return scan data:', returnData)
        } else {
          console.warn('[Dashboard] Return scan API error:', returnResponse.status, returnResponse.statusText)
        }
      }
      
      // Calcular productos vendidos
      const loadedProducts = loadData.products || []
      const returnedProducts = returnData.products || []
      const returnedIds = new Set(returnedProducts.map((p: any) => p.product_id))
      const soldProducts = loadedProducts.filter((p: any) => !returnedIds.has(p.product_id))
      
      const salesResult = {
        loaded: loadedProducts,
        returned: returnedProducts,
        sold: soldProducts,
        totalLoaded: loadedProducts.length,
        totalReturned: returnedProducts.length,
        totalSold: soldProducts.length,
      }
      
      console.log('[Dashboard] Calculated sales data:', salesResult)
      setSalesData(salesResult)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error('[Dashboard] Error fetching sales data:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loadScanId, returnScanId])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  return { salesData, loading, error, refetch: fetchSalesData }
}
