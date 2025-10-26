"use client"

import { useEffect, useState } from "react"

interface ProductSale {
  product_id: number
  product_name: string
  category: string
  unit_price: number | null
}

interface SalesSummary {
  scan: {
    id: number
    started_at: string
    ended_at: string | null
    status: string
  }
  loaded_products: ProductSale[]
  returned_products: ProductSale[]
  sold_products: ProductSale[]
  stats: {
    loaded_count: number
    returned_count: number
    sold_count: number
    total_revenue: number
    sale_rate: string
  }
}

interface ProductSalesKPI {
  loaded: ProductSale[]
  sold: ProductSale[]
  returned: ProductSale[]
  notSold: ProductSale[] // Productos que NO se vendieron (retornados)
  totalLoaded: number
  totalSold: number
  totalReturned: number
  saleRate: number
  totalRevenue: number
  isLoading: boolean
  error: string | null
  // Análisis de productos
  topSellingProducts: Array<{ product_name: string; count: number }>
  leastSellingProducts: Array<{ product_name: string; count: number }>
}

export function useProductSalesKPI(scanId: number | null): ProductSalesKPI {
  const [kpi, setKpi] = useState<ProductSalesKPI>({
    loaded: [],
    sold: [],
    returned: [],
    notSold: [],
    totalLoaded: 0,
    totalSold: 0,
    totalReturned: 0,
    saleRate: 0,
    totalRevenue: 0,
    isLoading: true,
    error: null,
    topSellingProducts: [],
    leastSellingProducts: [],
  })

  useEffect(() => {
    if (!scanId) {
      setKpi(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchSalesKPI = async () => {
      try {
        setKpi(prev => ({ ...prev, isLoading: true, error: null }))

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/scans/${scanId}/sales-summary`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: SalesSummary = await response.json()

        // Calcular productos que NO se vendieron (los retornados)
        const notSold = data.returned_products || []

        // Analizar productos más vendidos y menos vendidos
        // Para esto, necesitamos contar ocurrencias en múltiples scans
        // Por ahora, simplemente marcar cuáles se vendieron en este scan
        const soldProductNames = data.sold_products.map(p => ({
          product_name: p.product_name,
          count: 1 // En este scan se vendió 1 vez
        }))

        const notSoldProductNames = notSold.map(p => ({
          product_name: p.product_name,
          count: 0 // No se vendió
        }))

        setKpi({
          loaded: data.loaded_products || [],
          sold: data.sold_products || [],
          returned: data.returned_products || [],
          notSold,
          totalLoaded: data.stats.loaded_count,
          totalSold: data.stats.sold_count,
          totalReturned: data.stats.returned_count,
          saleRate: parseFloat(data.stats.sale_rate),
          totalRevenue: data.stats.total_revenue,
          isLoading: false,
          error: null,
          topSellingProducts: soldProductNames,
          leastSellingProducts: notSoldProductNames,
        })
      } catch (error) {
        console.error('[useProductSalesKPI] Error fetching sales KPI:', error)
        setKpi(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    fetchSalesKPI()
  }, [scanId])

  return kpi
}

