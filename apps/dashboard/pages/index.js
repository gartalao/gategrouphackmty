import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Smart Trolley Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Cards */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sistema Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>API Backend:</span>
                <span className="text-green-500">✅ Activo</span>
              </div>
              <div className="flex justify-between">
                <span>WebSocket:</span>
                <span className="text-green-500">✅ Conectado</span>
              </div>
              <div className="flex justify-between">
                <span>Base de Datos:</span>
                <span className="text-yellow-500">⚠️ Configurar</span>
              </div>
            </div>
          </div>

          {/* Trolley Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Trolleys Activos</h2>
            <div className="text-center py-8">
              <p className="text-gray-400">No hay trolleys activos</p>
              <p className="text-sm text-gray-500 mt-2">
                Inicia una sesión en la Web Camera App
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <a 
                href="http://localhost:3002" 
                target="_blank"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
              >
                🌐 Abrir Web Camera App
              </a>
              <button className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded-lg transition-colors">
                📊 Ver Reportes
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🚀 Cómo Usar el Sistema</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Abre la <strong>Web Camera App</strong> en <code>http://localhost:3002</code></li>
            <li>Configura el trolley, operador y nombre</li>
            <li>Inicia la grabación y comienza a detectar productos</li>
            <li>Monitorea las detecciones en tiempo real</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
