"use client"

import { useEffect, useState } from "react"
import { useReturnedProducts } from "@/hooks/useReturnedProducts"
import type { Product } from "@/types"

interface SoldProduct {
  product_id: number
  product_name: string
  category: string
  confidence: number
  detected_at: string
}

interface SalesCalculation {
  loadedProducts: Product[]
  returnedProducts: Product[]
  soldProducts: SoldProduct[]
  totalLoaded: number
  totalReturned: number
  totalSold: number
  saleRate: number
}

export function useSalesCalculation(trolleyId: number, loadedProducts: Product[] = []) {
  const { products: returnedProducts } = useReturnedProducts(trolleyId)
  const [salesData, setSalesData] = useState<SalesCalculation>({
    loadedProducts: [],
    returnedProducts: [],
    soldProducts: [],
    totalLoaded: 0,
    totalReturned: 0,
    totalSold: 0,
    saleRate: 0
  })

  useEffect(() => {
    console.log('[Dashboard] Calculating sales data...')
    console.log('[Dashboard] Loaded products:', loadedProducts.length)
    console.log('[Dashboard] Returned products:', returnedProducts.length)

    // Convertir productos retornados al formato Product
    const returnedAsProducts: Product[] = returnedProducts.map(rp => ({
      product_id: rp.product_id,
      product_name: rp.product_name,
      category: rp.category,
      count: 1, // Asumir 1 por producto retornado
      confidence: rp.confidence,
      detected_at: rp.detected_at
    }))

    // Calcular productos vendidos
    const returnedIds = new Set(returnedAsProducts.map(p => p.product_id))
    const soldProducts: SoldProduct[] = loadedProducts
      .filter(p => !returnedIds.has(p.product_id))
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        category: p.category,
        confidence: p.confidence || 0.95,
        detected_at: p.detected_at || new Date().toISOString()
      }))

    const totalLoaded = loadedProducts.length
    const totalReturned = returnedAsProducts.length
    const totalSold = soldProducts.length
    const saleRate = totalLoaded > 0 ? Math.round((totalSold / totalLoaded) * 100) : 0

    const newSalesData: SalesCalculation = {
      loadedProducts,
      returnedProducts: returnedAsProducts,
      soldProducts,
      totalLoaded,
      totalReturned,
      totalSold,
      saleRate
    }

    console.log('[Dashboard] Calculated sales data:', newSalesData)
    setSalesData(newSalesData)
  }, [loadedProducts, returnedProducts])

  return salesData
}
