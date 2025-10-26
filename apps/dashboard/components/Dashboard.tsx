"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, Target, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { KPICard } from "./KPICard"
import { ProductChecklist } from "./ProductChecklist"
import { ImprovedProductChecklist } from "./ImprovedProductChecklist"
import { RealtimeSalesInventory } from "./RealtimeSalesInventory"
import { ProductSalesKPI } from "./ProductSalesKPI"
import { SalesAnalysisDashboard } from "./SalesAnalysisDashboard"
import { useTrolleyData } from "@/hooks/useTrolleyData"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useProductSalesKPI } from "@/hooks/useProductSalesKPI"
import { calculateDuration } from "@/utils/formatters"
import type { ProductDetectedEvent, Detection } from "@/types"

export default function Dashboard() {
  const [selectedTrolley, setSelectedTrolley] = useState(1)
  const [sessionTime, setSessionTime] = useState("Inactivo")
  const [latestDetection, setLatestDetection] = useState<Detection | undefined>()
  const [recentDetections, setRecentDetections] = useState<Map<number, { confidence: number; detectedAt: string }>>(
    new Map(),
  )
  const [lastCompletedScanId, setLastCompletedScanId] = useState<number | null>(null)
  const [showSalesAnalysis, setShowSalesAnalysis] = useState(false)

  const { data, loading, error, refetch } = useTrolleyData(selectedTrolley)

  const handleProductDetected = (event: ProductDetectedEvent) => {
    if (event.trolley_id === selectedTrolley) {
      console.log("[Dashboard] Product detected:", event.scan_type || 'load', event.product_name)

      // Solo procesar eventos de load scan para el checklist principal
      if (!event.scan_type || event.scan_type === 'load') {
        setRecentDetections((prev) => {
          const newMap = new Map(prev)
          newMap.set(event.product_id, {
            confidence: event.confidence,
            detectedAt: event.detected_at,
          })
          return newMap
        })

        const detection: Detection = {
          detection_id: Date.now(),
          product: {
            id: event.product_id,
            name: event.product_name,
            category: event.category || "Sin categoría",
          },
          detected_at: event.detected_at,
          confidence: event.confidence,
          scan: {
            id: 0,
            started_at: event.detected_at,
            status: "recording",
          },
          operator: {
            id: event.operator_id,
            username: "operator",
            full_name: "Operador",
          },
        }

        setLatestDetection(detection)
        refetch()
      }
      // Los eventos de return scan se manejan automáticamente por useReturnedProducts
    }
  }

  const { isConnected } = useWebSocket(handleProductDetected)

  useEffect(() => {
    const interval = setInterval(() => {
      if (data?.active_scan) {
        setSessionTime(calculateDuration(data.active_scan.started_at))
      } else {
        setSessionTime("Inactivo")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [data?.active_scan])

  // Calculate KPIs
  const uniqueProducts = data?.products.length || 0
  const totalDetections = data?.total_detections || 0

  // Calculate average confidence from recent detections
  const avgConfidence =
    recentDetections.size > 0
      ? Array.from(recentDetections.values()).reduce((sum, d) => sum + d.confidence, 0) / recentDetections.size
      : 0.94

  // Obtener el último scan completado para mostrar KPIs de ventas
  // Esto idealmente vendría de un endpoint, pero por ahora usaremos el active_scan
  const currentScanId = data?.active_scan?.scan_id || lastCompletedScanId

  // Obtener KPIs de ventas para mostrar en cards principales
  const salesKPI = useProductSalesKPI(currentScanId)

  // Si está en modo de análisis de ventas, mostrar dashboard especializado
  if (showSalesAnalysis) {
    return (
      <SalesAnalysisDashboard 
        trolleyId={selectedTrolley}
        scanId={currentScanId}
        onBack={() => setShowSalesAnalysis(false)}
      />
    )
  }

  if (loading && !data) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-lg font-medium">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Diseño iPad optimizado */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">TROLLEY MONITOR</h1>
            <p className="text-sm text-gray-500 font-mono">
              {new Date().toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTrolley}
              onChange={(e) => setSelectedTrolley(Number(e.target.value))}
              className="bg-white text-gray-900 text-base font-medium px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
            >
              <option value={1}>Trolley 1</option>
              <option value={2}>Trolley 2</option>
              <option value={3}>Trolley 3</option>
            </select>
            <WebSocketIndicator isConnected={isConnected} />
          </div>
        </div>
      </div>

      {/* Main Content - Optimizado para monitor pequeño/iPad */}
      <div className="flex-1 px-6 py-5 overflow-hidden">
        <div className="h-full flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-red-700 text-sm font-medium">Error: {error}</p>
            </div>
          )}

          {/* KPI Cards - 4 columnas como en la imagen */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard title="Productos" value={uniqueProducts} subtitle="únicos" icon={Package} color="blue" />
            <KPICard title="Escaneados" value={totalDetections} subtitle="total" icon={CheckCircle} color="green" />
            <KPICard
              title="Confianza"
              value={`${Math.round(avgConfidence * 100)}%`}
              subtitle="precisión"
              icon={Target}
              color="purple"
            />
            <KPICard title="Tiempo" value={sessionTime} subtitle="activo" icon={Clock} color="orange" />
          </div>

          {/* Main Grid - Panel grande izquierda, panel derecho más pequeño */}
          <div className="flex-1 grid grid-cols-[2fr_1fr] gap-4 overflow-hidden">
            {/* Panel Izquierdo - Productos Detectados */}
            <div className="flex flex-col overflow-hidden">
              <ImprovedProductChecklist 
                detectedProducts={data?.products || []} 
                recentDetections={recentDetections}
                title="PRODUCTOS DETECTADOS"
              />
            </div>

            {/* Panel Derecho - Categorías y Actividad */}
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                <CategoryStats products={data?.products || []} />
              </div>
              <div className="flex-1 min-h-0">
                <RecentActivity trolleyId={selectedTrolley} latestDetection={latestDetection} />
              </div>
            </div>
          </div>

          {/* Footer - Status Bar */}
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className={`font-bold ${data?.active_scan ? "text-red-600" : "text-gray-400"}`}>
                  {data?.active_scan ? "● GRABANDO" : "○ DETENIDO"}
                </span>
                {data?.active_scan && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 font-mono">Scan #{data.active_scan.scan_id}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 font-mono">Op. {data.active_scan.operator_id}</span>
                  </>
                )}
              </div>
              {salesKPI.totalSold > 0 && (
                <button
                  onClick={() => setShowSalesAnalysis(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  Ver Análisis de Ventas
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
