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
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {totalDetected}/{totalExpected}
            </span>
            <span className={`text-xs font-bold ${
              completionRate === 100 ? 'text-green-600' : 
              completionRate >= 50 ? 'text-orange-600' : 
              'text-red-600'
            }`}>
              {completionRate}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              completionRate === 100 ? 'bg-green-500' : 
              completionRate >= 50 ? 'bg-orange-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {totalExpected === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay productos en el checklist</p>
            <p className="text-xs text-gray-400 mt-1">
              Los productos detectados aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Productos Completados (Detectados) */}
            {completedProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <h3 className="text-xs font-semibold text-green-600 uppercase">
                    Detectados ({completedProducts.length})
                  </h3>
                </div>
                <div className="space-y-2">
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
                        className="bg-green-50 rounded border border-green-200 p-3 transition-all hover:border-green-400 animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-gray-900 font-medium text-sm">
                                  {product.product_name}
                                </h3>
                                <p className="text-gray-500 text-xs">
                                  {product.category} • Cant: {product.count || 1}
                                </p>
                              </div>
                              <span className="text-xs text-green-600 font-mono">
                                {detectedAt}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Confianza</span>
                                <span className={`font-mono font-bold ${
                                  confidencePercent >= 90 ? 'text-green-600' :
                                  confidencePercent >= 70 ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {confidencePercent}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    confidencePercent >= 90 ? 'bg-green-600' :
                                    confidencePercent >= 70 ? 'bg-orange-600' :
                                    'bg-red-600'
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
              </div>
            )}

            {/* Productos Pendientes (No Detectados) */}
            {pendingProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Pendientes ({pendingProducts.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {pendingProducts.map((product) => (
                    <div
                      key={`pending-${product.product_id}`}
                      className="bg-gray-50 rounded border border-gray-200 p-3 transition-all hover:border-gray-400"
                    >
                      <div className="flex items-start gap-2">
                        <Circle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-gray-600 font-medium text-sm">
                            {product.product_name}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            {product.category} • No detectado
                          </p>
                        </div>
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 border-t border-gray-300 bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-600">
              <span className="font-bold text-green-600">{totalDetected}</span> detectados
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">
              <span className="font-bold text-gray-500">{pendingProducts.length}</span> pendientes
            </span>
          </div>
          <span className={`font-bold ${
            completionRate === 100 ? 'text-green-600' : 
            completionRate >= 50 ? 'text-orange-600' : 
            'text-red-600'
          }`}>
            {completionRate === 100 ? '✓ Completo' : 
             completionRate >= 50 ? '⚠ En progreso' : 
             '○ Pendiente'}
          </span>
        </div>
      </div>
    </div>
  )
}

