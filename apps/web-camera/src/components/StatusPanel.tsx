import React from 'react';
import { Wifi, WifiOff, Play, Pause, Square, AlertCircle, CheckCircle } from 'lucide-react';

interface StatusPanelProps {
  isConnected: boolean;
  isRecording: boolean;
  isPaused: boolean;
  framesSent: number;
  queueSize: number;
  onStartRecording?: () => void;
  onPauseRecording?: () => void;
  onStopRecording?: () => void;
  className?: string;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  isConnected,
  isRecording,
  isPaused,
  framesSent,
  queueSize,
  onStartRecording,
  onPauseRecording,
  onStopRecording,
  className = '',
}) => {
  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        icon: <Wifi className="w-4 h-4" />,
        text: 'Conectado',
        color: 'text-green-500',
        bgColor: 'bg-green-500/20',
      };
    }
    return {
      icon: <WifiOff className="w-4 h-4" />,
      text: 'Desconectado',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
    };
  };

  const getRecordingStatus = () => {
    if (isRecording && !isPaused) {
      return {
        icon: <Play className="w-4 h-4" />,
        text: 'Grabando',
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        animate: 'animate-pulse',
      };
    }
    if (isPaused) {
      return {
        icon: <Pause className="w-4 h-4" />,
        text: 'Pausado',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
      };
    }
    return {
      icon: <Square className="w-4 h-4" />,
      text: 'Detenido',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/20',
    };
  };

  const connectionStatus = getConnectionStatus();
  const recordingStatus = getRecordingStatus();

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Estado del Sistema</h3>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Estados */}
      <div className="space-y-3">
        {/* Estado de Conexión */}
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${connectionStatus.bgColor}`}>
          <div className={connectionStatus.color}>
            {connectionStatus.icon}
          </div>
          <div>
            <div className={`font-medium ${connectionStatus.color}`}>
              {connectionStatus.text}
            </div>
            <div className="text-xs text-gray-400">
              WebSocket al servidor
            </div>
          </div>
        </div>

        {/* Estado de Grabación */}
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${recordingStatus.bgColor}`}>
          <div className={`${recordingStatus.color} ${recordingStatus.animate || ''}`}>
            {recordingStatus.icon}
          </div>
          <div>
            <div className={`font-medium ${recordingStatus.color}`}>
              {recordingStatus.text}
            </div>
            <div className="text-xs text-gray-400">
              Captura de video
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{framesSent}</div>
            <div className="text-xs text-gray-400">Frames Enviados</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${queueSize > 0 ? 'text-yellow-500' : 'text-white'}`}>
              {queueSize}
            </div>
            <div className="text-xs text-gray-400">Cola Offline</div>
          </div>
        </div>
      </div>

      {/* Controles - SOLO Iniciar/Detener */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex space-x-2">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors font-semibold text-lg"
            >
              <Play className="w-5 h-5" />
              <span>▶ Iniciar Streaming</span>
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-colors font-semibold text-lg"
            >
              <Square className="w-5 h-5" />
              <span>⏹ Detener Streaming</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {queueSize > 0 && (
        <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {queueSize} frames en cola offline
            </span>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Sin conexión al servidor
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
