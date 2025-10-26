"use client"

import { useEffect, useState } from "react"
import type { Detection } from "@/types"
import { formatTimeAgo } from "@/utils/formatters"

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
    <div className="bg-white rounded border border-gray-300 flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Actividad</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-xs">Sin actividad</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={`${activity.detection_id}-${index}`}
                className="bg-gray-50 rounded border border-gray-200 p-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-600 text-sm">●</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-xs font-medium truncate">{activity.product.name}</p>
                    <p className="text-gray-500 text-xs font-mono">
                      {Math.round(activity.confidence * 100)}% • {formatTimeAgo(activity.detected_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
