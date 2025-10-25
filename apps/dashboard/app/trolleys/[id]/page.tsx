'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchTrolleyStatus } from '@/lib/api'
import { getSocket, subscribeTrolley } from '@/lib/socket'
import { ShelfCard } from '@/components/ShelfCard'
import { StatusPill } from '@/components/StatusPill'
import { AlertBadge } from '@/components/AlertBadge'
import toast from 'react-hot-toast'

export default function TrolleyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const trolleyId = parseInt(params.id as string)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['trolley-status', trolleyId],
    queryFn: () => fetchTrolleyStatus(trolleyId),
    refetchInterval: 10000, // Fallback: refetch every 10s
  })

  // WebSocket integration
  useEffect(() => {
    const socket = getSocket()
    subscribeTrolley(trolleyId)

    socket.on('scan_processed', (data: any) => {
      if (data.trolley_id === trolleyId) {
        console.log('📸 Scan processed:', data)
        toast.success(`Scan processed for Shelf ${data.shelf_id}`)
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['trolley-status', trolleyId] })
      }
    })

    socket.on('alert_created', (data: any) => {
      if (data.trolley_id === trolleyId) {
        console.log('⚠️ Alert created:', data)
        const severityColor = data.severity === 'critical' ? '🔴' : '🟡'
        toast.error(`${severityColor} ${data.message}`, { duration: 5000 })
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['trolley-status', trolleyId] })
      }
    })

    return () => {
      socket.off('scan_processed')
      socket.off('alert_created')
    }
  }, [trolleyId, queryClient])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trolley status...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">Failed to load trolley status</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.trolley_code}
              {data.flight_number && (
                <span className="text-lg font-normal text-gray-600 ml-3">
                  Flight {data.flight_number}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <StatusPill color={data.summary.overall_status} label="Overall Status" />
            <AlertBadge
              count={data.summary.active_alerts}
              severity={data.summary.active_alerts > 0 ? 'critical' : 'warning'}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Scans</h3>
              <p className="text-2xl font-bold mt-1">{data.summary.total_scans}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Avg Confidence</h3>
              <p
                className={`text-2xl font-bold mt-1 ${
                  data.summary.avg_confidence >= 0.8
                    ? 'text-trolley-green'
                    : data.summary.avg_confidence >= 0.6
                    ? 'text-trolley-yellow'
                    : 'text-trolley-red'
                }`}
              >
                {(data.summary.avg_confidence * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Alerts</h3>
              <p
                className={`text-2xl font-bold mt-1 ${
                  data.summary.active_alerts === 0 ? 'text-trolley-green' : 'text-trolley-red'
                }`}
              >
                {data.summary.active_alerts}
              </p>
            </div>
          </div>

          {/* Shelves Grid */}
          <h2 className="text-xl font-semibold mb-4">Shelves</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.shelves
              .sort((a, b) => a.shelf_number - b.shelf_number)
              .map((shelf) => (
                <ShelfCard key={shelf.shelf_id} shelf={shelf} />
              ))}
          </div>

          {/* Refresh Button */}
          <div className="mt-6">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

