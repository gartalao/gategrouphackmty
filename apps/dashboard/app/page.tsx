import Link from 'next/link'

export default function HomePage() {
  // In a real app, fetch list of active trolleys
  const trolleys = [
    { id: 1, code: 'TRLLY-001', flight: 'AA2345' },
    { id: 2, code: 'TRLLY-002', flight: 'AM0876' },
    { id: 3, code: 'TRLLY-003', flight: 'DL1234' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Trolley Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Active Trolleys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trolleys.map((trolley) => (
                <Link
                  key={trolley.id}
                  href={`/trolleys/${trolley.id}`}
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                >
                  <h3 className="text-lg font-semibold mb-2">{trolley.code}</h3>
                  <p className="text-sm text-gray-600">Flight: {trolley.flight}</p>
                  <div className="mt-4">
                    <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View status →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/kpis"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View KPIs Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

