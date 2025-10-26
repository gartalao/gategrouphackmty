"use client"

import { Package, CheckCircle, RotateCcw, TrendingUp, AlertCircle } from "lucide-react"
import { useSalesCalculation } from "@/hooks/useSalesCalculation"
import { useReturnedProducts } from "@/hooks/useReturnedProducts"
import type { Product } from "@/types"

interface RealtimeSalesInventoryProps {
  trolleyId: number
  loadedProducts: Product[]
}

export function RealtimeSalesInventory({ trolleyId, loadedProducts }: RealtimeSalesInventoryProps) {
  const salesData = useSalesCalculation(trolleyId, loadedProducts)
  const { isConnected } = useReturnedProducts(trolleyId)

  return (
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Inventario de Ventas
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'En vivo' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Métricas Rápidas */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-blue-50 rounded p-2 text-center">
            <div className="text-lg font-bold text-blue-600">{salesData.totalLoaded}</div>
            <div className="text-xs text-blue-500">Cargados</div>
          </div>
          <div className="bg-green-50 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-600">{salesData.totalSold}</div>
            <div className="text-xs text-green-500">Vendidos</div>
          </div>
          <div className="bg-orange-50 rounded p-2 text-center">
            <div className="text-lg font-bold text-orange-600">{salesData.totalReturned}</div>
            <div className="text-xs text-orange-500">Retornados</div>
          </div>
          <div className="bg-purple-50 rounded p-2 text-center">
            <div className="text-lg font-bold text-purple-600">{salesData.saleRate}%</div>
            <div className="text-xs text-purple-500">Tasa</div>
          </div>
        </div>

        {/* Barra de Progreso de Ventas */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tasa de Ventas</span>
            <span className="text-sm font-bold text-gray-900">{salesData.saleRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${salesData.saleRate}%` }}
            />
          </div>
        </div>

        {/* Productos Vendidos */}
        {salesData.soldProducts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Productos Vendidos ({salesData.totalSold})
              </h3>
            </div>
            <div className="space-y-1">
              {salesData.soldProducts.map((product) => (
                <div key={product.product_id} className="bg-green-50 rounded p-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">{product.product_name}</div>
                    <div className="text-xs text-green-600">{product.category}</div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos Retornados */}
        {salesData.returnedProducts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Productos Retornados ({salesData.totalReturned})
              </h3>
            </div>
            <div className="space-y-1">
              {salesData.returnedProducts.map((product) => {
                const confidencePercent = Math.round((product.confidence || 0.95) * 100)
                const confidenceLevel = confidencePercent >= 80 ? 'Alta' : 'Baja'
                const confidenceColor = confidencePercent >= 80 ? 'text-green-600' : 'text-red-600'
                
                return (
                  <div key={product.product_id} className="bg-orange-50 rounded p-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-orange-800">{product.product_name}</div>
                      <div className="text-xs text-orange-600">
                        {product.category} • {confidencePercent}% - {confidenceLevel}
                      </div>
                    </div>
                    <RotateCcw className="w-4 h-4 text-orange-600" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mensaje si no hay datos */}
        {salesData.totalLoaded === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay productos cargados</p>
            <p className="text-xs text-gray-500 mt-1">Completa un escaneo de carga primero</p>
          </div>
        )}

        {/* Estado de conexión */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">
                Sin conexión en tiempo real
              </span>
            </div>
            <p className="text-xs text-red-500 mt-1">
              Los productos retornados se mostrarán cuando se restablezca la conexión
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
