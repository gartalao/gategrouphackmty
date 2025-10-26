"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react"

interface ProductSalesData {
  product_name: string
  category: string
  total_loaded: number
  total_sold: number
  total_returned: number
  sale_rate: number
}

interface ProductSalesTrendsProps {
  trolleyId: number
}

export function ProductSalesTrends({ trolleyId }: ProductSalesTrendsProps) {
  const [trends, setTrends] = useState<ProductSalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesTrends = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/trolleys/${trolleyId}/sales-history`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Agregar productos por nombre y calcular estadísticas
        const productMap = new Map<string, ProductSalesData>()

        // Por ahora, como sales-history solo tiene agregados, 
        // vamos a simular datos de productos individuales
        // En producción, esto vendría de un endpoint específico

        setTrends([])
        setIsLoading(false)
      } catch (error) {
        console.error('[ProductSalesTrends] Error:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
        setIsLoading(false)
      }
    }

    fetchSalesTrends()
  }, [trolleyId])

  // Top 5 productos más vendidos
  const topSelling = trends
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 5)

  // Top 5 productos menos vendidos
  const leastSelling = trends
    .sort((a, b) => a.sale_rate - b.sale_rate)
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="bg-white rounded border border-gray-300 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          📈 Tendencias de Ventas
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="text-center text-red-400 py-4">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">Error: {error}</p>
          </div>
        )}

        {!error && trends.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay datos de ventas históricos</p>
            <p className="text-xs text-gray-400 mt-1">
              Completa algunos scans para ver tendencias
            </p>
          </div>
        )}

        {trends.length > 0 && (
          <div className="space-y-4">
            {/* Top Vendedores */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-600" />
                <h3 className="text-xs font-semibold text-green-600 uppercase">
                  Más Vendidos
                </h3>
              </div>
              <div className="space-y-2">
                {topSelling.map((product, idx) => (
                  <div
                    key={`top-${product.product_name}-${idx}`}
                    className="bg-green-50 rounded p-2 border border-green-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-green-800">
                        {product.product_name}
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        {product.sale_rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-green-600">
                      <span>{product.total_sold} vendidos</span>
                      <span>{product.total_returned} retornados</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-green-600 h-1.5 rounded-full"
                        style={{ width: `${product.sale_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menos Vendidos */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-semibold text-orange-600 uppercase">
                  Menos Vendidos
                </h3>
              </div>
              <div className="space-y-2">
                {leastSelling.map((product, idx) => (
                  <div
                    key={`least-${product.product_name}-${idx}`}
                    className="bg-orange-50 rounded p-2 border border-orange-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-orange-800">
                        {product.product_name}
                      </span>
                      <span className="text-xs font-bold text-orange-600">
                        {product.sale_rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-orange-600">
                      <span>{product.total_sold} vendidos</span>
                      <span>{product.total_returned} retornados</span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-orange-600 h-1.5 rounded-full"
                        style={{ width: `${product.sale_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

