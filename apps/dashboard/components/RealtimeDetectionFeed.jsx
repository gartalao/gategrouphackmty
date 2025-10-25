import React, { useEffect, useState } from 'react';

export default function RealtimeDetectionFeed({ detections = [] }) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📦</span>
        <span>Detecciones en Tiempo Real</span>
        <span className="ml-auto text-sm font-normal text-gray-400">
          ({detections.length})
        </span>
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {detections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Esperando detecciones...</p>
            <p className="text-sm mt-2">Los productos se mostrarán aquí en tiempo real</p>
          </div>
        ) : (
          detections.map((detection, idx) => (
            <DetectionCard key={detection.id || idx} detection={detection} isNew={idx === 0} />
          ))
        )}
      </div>
    </div>
  );
}

function DetectionCard({ detection, isNew }) {
  const [animate, setAnimate] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const confidenceColor = detection.confidence >= 0.9 
    ? 'text-green-400' 
    : detection.confidence >= 0.7 
    ? 'text-yellow-400' 
    : 'text-red-400';

  const confidencePercent = Math.round(detection.confidence * 100);

  const timeStr = new Date(detection.detected_at).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-300 ${
        animate ? 'border-green-500 bg-green-900/20 scale-105' : 'border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white font-semibold text-lg">{detection.product_name}</p>
          {detection.operator_id && (
            <p className="text-gray-400 text-sm mt-1">
              Operador: {detection.operator_name || `#${detection.operator_id}`}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className={`${confidenceColor} font-bold text-lg`}>{confidencePercent}%</p>
          <p className="text-gray-500 text-xs mt-1">{timeStr}</p>
        </div>
      </div>

      {isNew && (
        <div className="mt-2 text-green-400 text-sm font-medium animate-pulse">
          ✓ Detectado ahora
        </div>
      )}
    </div>
  );
}

