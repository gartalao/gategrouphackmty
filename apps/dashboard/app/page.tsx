export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">🚀 Smart Trolley Dashboard</h1>
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <h2 className="text-sm font-semibold text-green-800">✅ Sistema Conectado</h2>
            <p className="text-xs text-green-600">Dashboard funcionando en puerto 3003</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h2 className="text-sm font-semibold text-blue-800">📊 Inventario de Ventas</h2>
            <p className="text-xs text-blue-600">Cargados: 0 | Vendidos: 0 | Retornados: 0</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <h2 className="text-sm font-semibold text-purple-800">✅ Checklist Tiempo Real</h2>
            <p className="text-xs text-purple-600">20 productos del catálogo</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <a 
            href="http://localhost:3002" 
            target="_blank"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            🌐 Abrir Web Camera App
          </a>
        </div>
      </div>
    </div>
  )
}
