import React from 'react';
import { Package, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Detection {
  id: string;
  product_name: string;
  detected_at: string;
  confidence: number;
  product_id?: number;
}

interface DetectionFeedProps {
  detections: Detection[];
  className?: string;
}

export const DetectionFeed: React.FC<DetectionFeedProps> = ({
  detections,
  className = '',
}) => {
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm:ss', { locale: es });
    } catch {
      return '--:--:--';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Alta';
    if (confidence >= 0.7) return 'Media';
    return 'Baja';
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">
            Productos Detectados
          </h3>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {detections.length}
          </span>
        </div>
        
        {detections.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Último: {formatTime(detections[0].detected_at)}</span>
          </div>
        )}
      </div>

      {/* Lista de Detecciones */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {detections.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Esperando detecciones...</p>
            <p className="text-sm">Mete productos al trolley para ver las detecciones</p>
          </div>
        ) : (
          detections.map((detection) => (
            <div
              key={detection.id}
              className="bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">
                    {detection.product_name}
                  </h4>
                  
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {formatTime(detection.detected_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getConfidenceColor(detection.confidence)}`} />
                      <span className={`text-xs font-medium ${getConfidenceColor(detection.confidence)}`}>
                        {Math.round(detection.confidence * 100)}% - {getConfidenceLabel(detection.confidence)}
                      </span>
                    </div>
                  </div>
                </div>

                {detection.product_id && (
                  <div className="text-xs text-gray-500 ml-2">
                    ID: {detection.product_id}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Estadísticas */}
      {detections.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">{detections.length}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {detections.filter(d => d.confidence >= 0.9).length}
              </div>
              <div className="text-xs text-gray-400">Alta Confianza</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">
                {Math.round(detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length * 100)}%
              </div>
              <div className="text-xs text-gray-400">Promedio</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
