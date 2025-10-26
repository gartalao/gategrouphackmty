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
    <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">ACTIVIDAD</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-base text-gray-400 font-medium">Sin actividad</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={`${activity.detection_id}-${index}`}
                className="bg-gray-50 rounded-lg border border-gray-200 p-3 animate-in fade-in slide-in-from-top-2 duration-300 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-600 text-base">●</span>
                    <p className="text-gray-900 text-sm font-medium truncate">{activity.product.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 font-mono tabular-nums">
                    {formatTimeAgo(activity.detected_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
