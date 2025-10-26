"use client"

import { useEffect, useState } from "react"
import type { Detection } from "../types"
import { formatTimeAgo } from "../utils/formatters"

interface RecentActivityProps {
  trolleyId: number
  latestDetection?: Detection
}

export function RecentActivity({ trolleyId, latestDetection }: RecentActivityProps) {
  const [activities, setActivities] = useState<Detection[]>([])

  useEffect(() => {
    if (latestDetection) {
      setActivities((prev) => [latestDetection, ...prev.slice(0, 9)])
    }
  }, [latestDetection])

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">🕐 Últimas Detecciones</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Sin actividad reciente</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={`${activity.detection_id}-${index}`}
              className="bg-gray-900 rounded-lg p-3 border border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-start gap-2">
                <span className="text-green-500 text-lg">🟢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{activity.product.name} detectada</p>
                  <p className="text-gray-400 text-xs">
                    {Math.round(activity.confidence * 100)}% confianza • {formatTimeAgo(activity.detected_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
