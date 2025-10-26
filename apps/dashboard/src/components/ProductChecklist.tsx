import { CheckCircle } from "lucide-react"
import type { Product } from "../types"
import { getConfidenceColor, getConfidenceTextColor } from "../utils/formatters"

interface ProductChecklistProps {
  products: Product[]
  recentDetections: Map<number, { confidence: number; detectedAt: string }>
}

export function ProductChecklist({ products, recentDetections }: ProductChecklistProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        📋 Productos Escaneados - Tiempo Real
      </h2>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay productos detectados aún</p>
          </div>
        ) : (
          products.map((product) => {
            const detection = recentDetections.get(product.product_id)
            const confidence = detection?.confidence || 0.95
            const confidencePercent = Math.round(confidence * 100)

            return (
              <div
                key={product.product_id}
                className="bg-gray-900 rounded-lg p-4 border border-gray-700 transition-all hover:border-gray-600 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-white font-semibold">{product.product_name}</h3>
                      <p className="text-gray-400 text-sm">Categoría: {product.category}</p>
                      <p className="text-gray-500 text-xs mt-1">Cantidad detectada: {product.count}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={getConfidenceTextColor(confidence)}>Confianza: {confidencePercent}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${getConfidenceColor(confidence)} transition-all duration-500`}
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
