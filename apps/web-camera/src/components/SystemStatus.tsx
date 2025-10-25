import React from 'react';
import { Wifi, WifiOff, Brain, BrainCircuit, CheckCircle, XCircle, Clock, Send } from 'lucide-react';

interface SystemStatusProps {
  isConnected: boolean;
  framesSent: number;
  lastFrameTime: string | null;
  geminiStatus: 'idle' | 'analyzing' | 'success' | 'error';
  backendStatus: 'disconnected' | 'connected' | 'sending';
  detectionsCount: number;
  className?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  isConnected,
  framesSent,
  lastFrameTime,
  geminiStatus,
  backendStatus,
  detectionsCount,
  className = '',
}) => {
  const getGeminiIcon = () => {
    switch (geminiStatus) {
      case 'analyzing':
        return <BrainCircuit className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getGeminiText = () => {
    switch (geminiStatus) {
      case 'analyzing':
        return 'Analizando...';
      case 'success':
        return 'Producto detectado';
      case 'error':
        return 'Error en análisis';
      default:
        return 'Gemini inactivo';
    }
  };

  const getBackendIcon = () => {
    switch (backendStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'sending':
        return <Send className="w-4 h-4 animate-pulse text-blue-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getBackendText = () => {
    switch (backendStatus) {
      case 'connected':
        return 'Backend conectado';
      case 'sending':
        return 'Enviando frame...';
      default:
        return 'Desconectado - WebSocket al servidor';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Estado del Sistema</h3>
      
      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini Status */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            {getGeminiIcon()}
            <span className="text-sm font-medium text-white">Gemini AI</span>
          </div>
          <div className="text-xs text-gray-300">
            {getGeminiText()}
          </div>
        </div>

        {/* Streaming Status */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            {getBackendIcon()}
            <span className="text-sm font-medium text-white">Streaming</span>
          </div>
          <div className="text-xs text-gray-300">
            {getBackendText()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{framesSent}</div>
            <div className="text-xs text-gray-400">Frames</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{detectionsCount}</div>
            <div className="text-xs text-gray-400">Detecciones</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {lastFrameTime ? '🟢' : '⚪'}
            </div>
            <div className="text-xs text-gray-400">Activo</div>
          </div>
        </div>
      </div>

      {/* Last Frame Time */}
      {lastFrameTime && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Último frame: {lastFrameTime}
            </span>
          </div>
        </div>
      )}

      {/* Console Logs */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Logs en consola:</div>
        <div className="bg-black rounded p-2 text-xs font-mono text-green-400 max-h-20 overflow-y-auto">
          <div>📸 Frame capturado</div>
          <div>🤖 Gemini analizando...</div>
          <div>🔄 Streaming directo</div>
          <div>✅ Producto detectado</div>
        </div>
      </div>
    </div>
  );
};
