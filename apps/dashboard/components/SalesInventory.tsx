"use client"

import { Package, CheckCircle, XCircle, TrendingUp } from "lucide-react"
import { useSalesData } from "@/hooks/useSalesData"
import type { SalesData, Product } from "@/types"

interface SalesInventoryProps {
  trolleyId: number
  loadScanId?: number
  returnScanId?: number
}

export function SalesInventory({ trolleyId, loadScanId, returnScanId }: SalesInventoryProps) {
  const { salesData, loading, error } = useSalesData(trolleyId, loadScanId, returnScanId)

  if (loading) {
    return (
      <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Inventario de Ventas</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Cargando datos de ventas...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Inventario de Ventas</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-sm">Error: {error}</div>
        </div>
      </div>
    )
  }

  if (!salesData) {
    return (
      <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Inventario de Ventas</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin datos de ventas</p>
            <p className="text-xs text-gray-500 mt-1">Inicia un escaneo para ver el inventario</p>
          </div>
        </div>
      </div>
    )
  }

  const salesRate = salesData.totalLoaded > 0 
    ? Math.round((salesData.totalSold / salesData.totalLoaded) * 100)
    : 0

  return (
    <div className="bg-white rounded border border-gray-300 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Inventario de Ventas</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Resumen de Ventas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
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
        </div>

        {/* Tasa de Ventas */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tasa de Ventas</span>
            <span className="text-sm font-bold text-gray-900">{salesRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${salesRate}%` }}
            />
          </div>
        </div>

        {/* Productos Vendidos */}
        {salesData.sold.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Productos Vendidos</h3>
            </div>
            <div className="space-y-1">
              {salesData.sold.map((product) => (
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
        {salesData.returned.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">Productos Retornados</h3>
            </div>
            <div className="space-y-1">
              {salesData.returned.map((product) => (
                <div key={product.product_id} className="bg-orange-50 rounded p-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-orange-800">{product.product_name}</div>
                    <div className="text-xs text-orange-600">{product.category}</div>
                  </div>
                  <XCircle className="w-4 h-4 text-orange-600" />
                </div>
              ))}
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
      </div>
    </div>
  )
}
