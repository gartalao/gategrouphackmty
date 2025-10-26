"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, Target, Clock } from "lucide-react"
import { KPICard } from "./KPICard"
import { ProductChecklist } from "./ProductChecklist"
import { SalesInventory } from "./SalesInventory"
import { useTrolleyData } from "@/hooks/useTrolleyData"
import { useWebSocket } from "@/hooks/useWebSocket"
import { calculateDuration } from "@/utils/formatters"
import type { ProductDetectedEvent, Detection } from "@/types"

export default function Dashboard() {
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

  if (loading && !data) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-lg font-medium">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-300 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">TROLLEY MONITOR</h1>
            <p className="text-xs text-gray-500 font-mono">
              {new Date().toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTrolley}
              onChange={(e) => setSelectedTrolley(Number(e.target.value))}
              className="bg-white text-gray-900 text-sm px-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value={1}>Trolley 1</option>
              <option value={2}>Trolley 2</option>
              <option value={3}>Trolley 3</option>
            </select>
            <WebSocketIndicator isConnected={isConnected} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-4 overflow-hidden">
        <div className="h-full flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-300 rounded px-3 py-2">
              <p className="text-red-700 text-xs">Error: {error}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
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

          <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
            <div className="col-span-2 overflow-hidden">
              <ProductChecklist products={data?.products || []} recentDetections={recentDetections} />
            </div>
            <div className="flex flex-col gap-3 overflow-hidden">
              <SalesInventory 
                trolleyId={selectedTrolley} 
                loadScanId={data?.active_scan?.scan_id}
                returnScanId={data?.return_scan_id}
              />
              <CategoryStats products={data?.products || []} />
              <RecentActivity trolleyId={selectedTrolley} latestDetection={latestDetection} />
            </div>
          </div>

          <div className="bg-white rounded border border-gray-300 px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={`font-medium ${data?.active_scan ? "text-red-600" : "text-gray-400"}`}>
                  {data?.active_scan ? "● GRABANDO" : "○ DETENIDO"}
                </span>
                {data?.active_scan && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-mono">Scan #{data.active_scan.scan_id}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-mono">Op. {data.active_scan.operator_id}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
