"use client"

import { CheckCircle, Circle, AlertCircle, Package } from "lucide-react"
import type { Product } from "@/types"

interface ImprovedProductChecklistProps {
  /**
   * Productos detectados en el scan actual (de la BD)
   */
  detectedProducts: Product[]
  
  /**
   * Productos esperados/requeridos para este trolley/vuelo
   * Esto vendría de FlightRequirements, pero por ahora usaremos los detectados
   */
  expectedProducts?: Product[]
  
  /**
   * Mapa de detecciones recientes con confianza
   */
  recentDetections: Map<number, { confidence: number; detectedAt: string }>
  
  /**
   * Título del checklist
   */
  title?: string
}

export function ImprovedProductChecklist({ 
  detectedProducts, 
  expectedProducts,
  recentDetections,
  title = "Checklist de Productos"
}: ImprovedProductChecklistProps) {
  
  // Si no hay productos esperados, usar los detectados como referencia
  const expected = expectedProducts || detectedProducts
  
  // Crear un mapa de productos detectados para búsqueda rápida
  const detectedMap = new Map(
    detectedProducts.map(p => [p.product_id, p])
  )

  // Productos completados (detectados)
  const completedProducts = expected.filter(p => detectedMap.has(p.product_id))
  
  // Productos pendientes (no detectados)
  const pendingProducts = expected.filter(p => !detectedMap.has(p.product_id))
  
  // Calcular estadísticas
  const totalExpected = expected.length
  const totalDetected = completedProducts.length
  const completionRate = totalExpected > 0 
    ? Math.round((totalDetected / totalExpected) * 100) 
    : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          {title}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {totalExpected === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-base font-medium">Sin productos detectados</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Productos Detectados - Diseño limpio */}
            {completedProducts.length > 0 && (
              <div className="space-y-3">
                {completedProducts.map((product) => {
                  const detection = recentDetections.get(product.product_id)
                  const confidence = detection?.confidence || 0.95
                  const confidencePercent = Math.round(confidence * 100)
                  const detectedAt = detection?.detectedAt 
                    ? new Date(detection.detectedAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : '--:--:--'

                  return (
                    <div
                      key={`detected-${product.product_id}`}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <div>
                            <h3 className="text-gray-900 font-semibold text-base">
                              {product.product_name}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-mono tabular-nums">
                          {detectedAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gray-700 transition-all duration-500"
                              style={{ width: `${confidencePercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 font-mono font-semibold tabular-nums">
                          {confidencePercent}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  )
}

