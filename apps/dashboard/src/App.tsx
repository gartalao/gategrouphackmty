"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, Target, Clock } from "lucide-react"
import { KPICard } from "./components/KPICard"
import { ProductChecklist } from "./components/ProductChecklist"
import { CategoryStats } from "./components/CategoryStats"
import { RecentActivity } from "./components/RecentActivity"
import { WebSocketIndicator } from "./components/WebSocketIndicator"
import { useTrolleyData } from "./hooks/useTrolleyData"
import { useWebSocket } from "./hooks/useWebSocket"
import { calculateDuration } from "./utils/formatters"
import type { ProductDetectedEvent, Detection } from "./types"

export default function App() {
  const [selectedTrolley, setSelectedTrolley] = useState(1)
  const [sessionTime, setSessionTime] = useState("Inactivo")
  const [latestDetection, setLatestDetection] = useState<Detection | undefined>()
  const [recentDetections, setRecentDetections] = useState<Map<number, { confidence: number; detectedAt: string }>>(
    new Map(),
  )

  const { data, loading, error, refetch } = useTrolleyData(selectedTrolley)

  const handleProductDetected = (event: ProductDetectedEvent) => {
    if (event.trolley_id === selectedTrolley) {
      console.log("[v0] Updating data for trolley", selectedTrolley)

      // Update recent detections map
      setRecentDetections((prev) => {
        const newMap = new Map(prev)
        newMap.set(event.product_id, {
          confidence: event.confidence,
          detectedAt: event.detected_at,
        })
        return newMap
      })

      // Create detection object for recent activity
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
  }

  const { isConnected } = useWebSocket(handleProductDetected)

  // Update session time every second
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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">🚀 Smart Trolley Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              {new Date().toLocaleString("es-ES", {
                dateStyle: "full",
                timeStyle: "medium",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTrolley}
              onChange={(e) => setSelectedTrolley(Number(e.target.value))}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Trolley 1</option>
              <option value={2}>Trolley 2</option>
              <option value={3}>Trolley 3</option>
            </select>
            <WebSocketIndicator isConnected={isConnected} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-500 text-sm">Error: {error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Productos Únicos"
            value={uniqueProducts}
            subtitle="en sesión actual"
            icon={Package}
            color="blue"
          />
          <KPICard
            title="Total Escaneados"
            value={totalDetections}
            subtitle="items procesados"
            icon={CheckCircle}
            color="green"
          />
          <KPICard
            title="Confianza AI"
            value={`${Math.round(avgConfidence * 100)}%`}
            subtitle="precisión del sistema"
            icon={Target}
            color="purple"
          />
          <KPICard title="Tiempo Activo" value={sessionTime} subtitle="sesión de escaneo" icon={Clock} color="orange" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductChecklist products={data?.products || []} recentDetections={recentDetections} />
          </div>
          <div className="space-y-6">
            <CategoryStats products={data?.products || []} />
            <RecentActivity trolleyId={selectedTrolley} latestDetection={latestDetection} />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-2 ${data?.active_scan ? "text-red-500" : "text-gray-500"}`}>
                {data?.active_scan ? "🔴 Grabando" : "⏸️ Detenido"}
              </span>
              {data?.active_scan && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-400 text-sm">Scan ID: #{data.active_scan.scan_id}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-400 text-sm">Operador ID: {data.active_scan.operator_id}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
