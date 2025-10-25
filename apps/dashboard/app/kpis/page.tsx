'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchKPIs } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function KPIsPage() {
  const router = useRouter()
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['kpis', selectedDate],
    queryFn: () => fetchKPIs({ date: selectedDate }),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KPIs...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">KPIs Overview</h1>
          <p className="text-sm text-gray-600 mt-1">Date: {data.date}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Scans Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Scans</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Scans</h3>
                <p className="text-3xl font-bold mt-2">{data.metrics.scans.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                <p className="text-3xl font-bold mt-2 text-green-600">
                  {data.metrics.scans.completed}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Processing</h3>
                <p className="text-3xl font-bold mt-2 text-yellow-600">
                  {data.metrics.scans.processing}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Failed</h3>
                <p className="text-3xl font-bold mt-2 text-red-600">
                  {data.metrics.scans.failed}
                </p>
              </div>
            </div>
          </section>

          {/* Confidence Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Confidence</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Confidence</h3>
              <p className="text-4xl font-bold text-blue-600">
                {(data.metrics.confidence.average * 100).toFixed(1)}%
              </p>
            </div>
          </section>

          {/* Alerts Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Created</h3>
                <p className="text-3xl font-bold mt-2">{data.metrics.alerts.total_created}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Active</h3>
                <p className="text-3xl font-bold mt-2 text-red-600">
                  {data.metrics.alerts.active}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
                <p className="text-3xl font-bold mt-2 text-green-600">
                  {data.metrics.alerts.resolved}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Critical</h3>
                <p className="text-3xl font-bold mt-2 text-red-600">
                  {data.metrics.alerts.critical}
                </p>
              </div>
            </div>

            {/* Alerts by Type */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">Alerts by Type</h3>
              <div className="space-y-2">
                {Object.entries(data.metrics.alerts.by_type).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{type}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <p className="text-xs text-gray-500 mt-6">
            Generated at: {new Date(data.generated_at).toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  )
}

