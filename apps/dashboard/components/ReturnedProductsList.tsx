"use client"

import { RotateCcw, Package, AlertCircle } from "lucide-react"
import { useReturnedProducts } from "@/hooks/useReturnedProducts"

interface ReturnedProductsListProps {
  trolleyId: number
}

export function ReturnedProductsList({ trolleyId }: ReturnedProductsListProps) {
  const { products, totalReturned, isConnected } = useReturnedProducts(trolleyId)

  return (
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Productos Retornados
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
        {/* Contador */}
        <div className="mb-4">
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{totalReturned}</div>
            <div className="text-sm text-orange-500">Productos Retornados</div>
          </div>
        </div>

        {/* Lista de productos */}
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin productos retornados</p>
            <p className="text-xs text-gray-500 mt-1">
              Los productos aparecerán aquí cuando se detecten en el return scan
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => {
              const confidencePercent = Math.round(product.confidence * 100)
              const confidenceLevel = confidencePercent >= 80 ? 'Alta' : 'Baja'
              const confidenceColor = confidencePercent >= 80 ? 'text-green-600' : 'text-red-600'
              
              return (
                <div
                  key={product.product_id}
                  className="bg-orange-50 rounded border border-orange-200 p-3 transition-all hover:border-orange-400 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-start gap-2">
                    <RotateCcw className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div>
                        <h3 className="text-orange-900 font-medium text-sm">
                          {product.product_name}
                        </h3>
                        <p className="text-orange-600 text-xs">
                          {product.category} • Retornado
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-mono ${confidenceColor}`}>
                            {confidencePercent}% - {confidenceLevel}
                          </span>
                          <span className="text-orange-500 font-mono">
                            {new Date(product.detected_at).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              confidencePercent >= 80 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${confidencePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
