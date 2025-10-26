"use client"

import { Package, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"

interface SalesAnalysisSummaryProps {
  totalLoaded: number
  totalSold: number
  totalReturned: number
  totalRevenue: number
  saleRate: number
  mostSoldProduct?: { name: string; count: number }
  leastSoldProduct?: { name: string; count: number }
}

export function SalesAnalysisSummary({
  totalLoaded,
  totalSold,
  totalReturned,
  totalRevenue,
  saleRate,
  mostSoldProduct,
  leastSoldProduct
}: SalesAnalysisSummaryProps) {
  
  const performanceLevel = 
    saleRate >= 80 ? { text: 'Excelente', color: 'green', emoji: '🎉' } :
    saleRate >= 60 ? { text: 'Bueno', color: 'blue', emoji: '👍' } :
    saleRate >= 40 ? { text: 'Regular', color: 'orange', emoji: '⚠️' } :
    { text: 'Bajo', color: 'red', emoji: '📉' }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-300 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Resumen de Rendimiento de Ventas
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Análisis del último scan completado
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl mb-1">{performanceLevel.emoji}</div>
          <span className={`text-sm font-bold text-${performanceLevel.color}-600`}>
            {performanceLevel.text}
          </span>
        </div>
      </div>

      {/* Métricas Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-semibold uppercase">Cargados</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{totalLoaded}</div>
          <div className="text-xs text-blue-500 mt-1">productos iniciales</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs text-green-600 font-semibold uppercase">Vendidos</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{totalSold}</div>
          <div className="text-xs text-green-500 mt-1">productos vendidos</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-orange-600 font-semibold uppercase">Retornados</span>
          </div>
          <div className="text-3xl font-bold text-orange-700">{totalReturned}</div>
          <div className="text-xs text-orange-500 mt-1">no vendidos</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-purple-600 font-semibold uppercase">Ingresos</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-purple-500 mt-1">generados</div>
        </div>
      </div>

      {/* Tasa de Ventas */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Tasa de Venta</span>
          </div>
          <span className={`text-2xl font-bold text-${performanceLevel.color}-600`}>
            {saleRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-700 bg-gradient-to-r ${
              saleRate >= 80 ? 'from-green-400 to-green-600' :
              saleRate >= 60 ? 'from-blue-400 to-blue-600' :
              saleRate >= 40 ? 'from-orange-400 to-orange-600' :
              'from-red-400 to-red-600'
            }`}
            style={{ width: `${saleRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          <span>Meta: 70%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-4">
        {mostSoldProduct && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-semibold uppercase">
                Producto Estrella
              </span>
            </div>
            <div className="text-sm font-bold text-green-800">
              {mostSoldProduct.name}
            </div>
            <div className="text-xs text-green-600">
              {mostSoldProduct.count} vendidos
            </div>
          </div>
        )}

        {leastSoldProduct && (
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-600 font-semibold uppercase">
                Necesita Atención
              </span>
            </div>
            <div className="text-sm font-bold text-orange-800">
              {leastSoldProduct.name}
            </div>
            <div className="text-xs text-orange-600">
              Solo {leastSoldProduct.count} vendidos
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs font-semibold text-blue-800 mb-2">
          💡 Recomendaciones para GateGroup:
        </div>
        <ul className="text-xs text-blue-700 space-y-1">
          {saleRate >= 80 && (
            <>
              <li>✅ Excelente rendimiento de ventas</li>
              <li>✅ Continuar con el mix actual de productos</li>
            </>
          )}
          {saleRate >= 60 && saleRate < 80 && (
            <>
              <li>👍 Buen rendimiento, hay margen de mejora</li>
              <li>📊 Analizar productos retornados para optimizar inventario</li>
            </>
          )}
          {saleRate >= 40 && saleRate < 60 && (
            <>
              <li>⚠️ Rendimiento regular, revisar selección de productos</li>
              <li>📉 Considerar reducir cantidad de productos con baja rotación</li>
            </>
          )}
          {saleRate < 40 && (
            <>
              <li>🚨 Rendimiento bajo, requiere atención inmediata</li>
              <li>🔄 Revisar y ajustar mix de productos significativamente</li>
              <li>📞 Contactar con equipo de ventas para análisis detallado</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

