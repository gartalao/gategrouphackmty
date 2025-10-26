"use client"

import { TrendingUp, TrendingDown, Package, DollarSign, Percent, AlertCircle } from "lucide-react"
import { useProductSalesKPI } from "@/hooks/useProductSalesKPI"

interface ProductSalesKPIProps {
  scanId: number | null
  showDetails?: boolean
}

export function ProductSalesKPI({ scanId, showDetails = true }: ProductSalesKPIProps) {
  const kpi = useProductSalesKPI(scanId)

  if (!scanId) {
    return (
      <div className="bg-white rounded border border-gray-300 p-6">
        <div className="text-center text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay scan activo</p>
          <p className="text-xs text-gray-400 mt-1">Completa un scan para ver KPIs de ventas</p>
        </div>
      </div>
    )
  }

  if (kpi.isLoading) {
    return (
      <div className="bg-white rounded border border-gray-300 p-6">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm mt-2">Cargando KPIs...</p>
        </div>
      </div>
    )
  }

  if (kpi.error) {
    return (
      <div className="bg-white rounded border border-gray-300 p-6">
        <div className="text-center text-red-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Error: {kpi.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          📊 KPIs de Ventas
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Métricas Principales */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-green-600 font-medium">VENDIDOS</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">{kpi.totalSold}</div>
            <div className="text-xs text-green-600 mt-1">
              de {kpi.totalLoaded} cargados
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-orange-600 font-medium">NO VENDIDOS</span>
              <TrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">{kpi.totalReturned}</div>
            <div className="text-xs text-orange-600 mt-1">
              productos retornados
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-purple-600 font-medium">TASA DE VENTA</span>
              <Percent className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{kpi.saleRate.toFixed(0)}%</div>
            <div className="w-full bg-purple-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${kpi.saleRate}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-600 font-medium">INGRESOS</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              ${kpi.totalRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              total generado
            </div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Productos MÁS Vendidos */}
            {kpi.sold.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Productos Vendidos ({kpi.totalSold})
                  </h3>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {kpi.sold.map((product, idx) => (
                    <div 
                      key={`sold-${product.product_id}-${idx}`}
                      className="bg-green-50 rounded p-2 flex items-center justify-between border border-green-200"
                    >
                      <div>
                        <div className="text-sm font-medium text-green-800">
                          {product.product_name}
                        </div>
                        <div className="text-xs text-green-600">
                          {product.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-700">
                          ${(product.unit_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productos NO Vendidos */}
            {kpi.notSold.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Productos NO Vendidos ({kpi.totalReturned})
                  </h3>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {kpi.notSold.map((product, idx) => (
                    <div 
                      key={`not-sold-${product.product_id}-${idx}`}
                      className="bg-orange-50 rounded p-2 flex items-center justify-between border border-orange-200"
                    >
                      <div>
                        <div className="text-sm font-medium text-orange-800">
                          {product.product_name}
                        </div>
                        <div className="text-xs text-orange-600">
                          {product.category} • Retornado
                        </div>
                      </div>
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje si no hay datos */}
            {kpi.totalLoaded === 0 && (
              <div className="text-center text-gray-400 py-4">
                <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay productos cargados en este scan</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

