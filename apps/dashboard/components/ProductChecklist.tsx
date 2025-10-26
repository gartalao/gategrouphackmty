import { CheckCircle } from "lucide-react"
import type { Product } from "@/types"

interface ProductChecklistProps {
  products: Product[]
  recentDetections: Map<number, { confidence: number; detectedAt: string }>
}

export function ProductChecklist({ products, recentDetections }: ProductChecklistProps) {
  return (
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Productos Detectados</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Sin productos detectados</p>
            </div>
          ) : (
            products.map((product) => {
              const detection = recentDetections.get(product.product_id)
              const confidence = detection?.confidence || 0.95
              const confidencePercent = Math.round(confidence * 100)

              return (
                <div
                  key={product.product_id}
                  className="bg-gray-50 rounded border border-gray-200 p-3 transition-all hover:border-gray-400 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div>
                        <h3 className="text-gray-900 font-medium text-sm">{product.product_name}</h3>
                        <p className="text-gray-500 text-xs">
                          {product.category} • Cant: {product.count}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 font-mono">{confidencePercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gray-700 transition-all duration-500"
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
    </div>
  )
}
