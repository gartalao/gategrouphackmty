"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { SalesAnalysisSummary } from "./SalesAnalysisSummary"
import { ProductSalesKPI } from "./ProductSalesKPI"
import { ProductSalesTrends } from "./ProductSalesTrends"
import { useProductSalesKPI } from "@/hooks/useProductSalesKPI"

interface SalesAnalysisDashboardProps {
  trolleyId: number
  scanId: number | null
  onBack?: () => void
}

export function SalesAnalysisDashboard({ 
  trolleyId, 
  scanId,
  onBack 
}: SalesAnalysisDashboardProps) {
  const kpi = useProductSalesKPI(scanId)

  // Determinar producto más vendido y menos vendido
  const mostSoldProduct = kpi.sold.length > 0 
    ? { name: kpi.sold[0].product_name, count: kpi.sold.length }
    : undefined

  const leastSoldProduct = kpi.notSold.length > 0
    ? { name: kpi.notSold[0].product_name, count: 0 }
    : undefined

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Análisis de Ventas - GateGroup
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Dashboard completo de rendimiento de ventas por trolley
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Trolley ID</div>
            <div className="text-xl font-bold text-gray-900">#{trolleyId}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Resumen Principal */}
          {!kpi.isLoading && scanId && (
            <SalesAnalysisSummary
              totalLoaded={kpi.totalLoaded}
              totalSold={kpi.totalSold}
              totalReturned={kpi.totalReturned}
              totalRevenue={kpi.totalRevenue}
              saleRate={kpi.saleRate}
              mostSoldProduct={mostSoldProduct}
              leastSoldProduct={leastSoldProduct}
            />
          )}

          {/* Grid de Análisis Detallado */}
          <div className="grid grid-cols-2 gap-6">
            <div className="h-[600px]">
              <ProductSalesKPI scanId={scanId} showDetails={true} />
            </div>
            <div className="h-[600px]">
              <ProductSalesTrends trolleyId={trolleyId} />
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              📊 Cómo interpretar estos datos
            </h3>
            <div className="grid grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <div className="font-semibold text-gray-900 mb-2">Productos Vendidos</div>
                <p className="text-xs">
                  Son los productos que se cargaron al trolley y NO fueron detectados 
                  en el scan de retorno. Estos productos se vendieron exitosamente.
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-2">Productos Retornados</div>
                <p className="text-xs">
                  Son los productos que se detectaron en el scan de retorno. 
                  Estos productos NO se vendieron y regresaron al inventario.
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-2">Tasa de Venta</div>
                <p className="text-xs">
                  Porcentaje de productos vendidos sobre el total cargado. 
                  Meta: &gt;70%. Verde: Excelente, Azul: Bueno, Naranja: Regular, Rojo: Bajo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

