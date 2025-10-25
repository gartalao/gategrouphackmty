import React, { useState } from 'react';
import { User, Truck, ArrowRight, AlertCircle } from 'lucide-react';

interface OperatorSetupProps {
  onStartSession: (data: { trolleyId: number; operatorId: number; operatorName: string }) => void;
}

export const OperatorSetup: React.FC<OperatorSetupProps> = ({ onStartSession }) => {
  const [trolleyId, setTrolleyId] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!trolleyId.trim()) {
      newErrors.trolleyId = 'ID del trolley es requerido';
    } else if (isNaN(Number(trolleyId))) {
      newErrors.trolleyId = 'ID del trolley debe ser un número';
    }

    if (!operatorId.trim()) {
      newErrors.operatorId = 'ID del operador es requerido';
    } else if (isNaN(Number(operatorId))) {
      newErrors.operatorId = 'ID del operador debe ser un número';
    }

    if (!operatorName.trim()) {
      newErrors.operatorName = 'Nombre del operador es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onStartSession({
        trolleyId: Number(trolleyId),
        operatorId: Number(operatorId),
        operatorName: operatorName.trim(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Smart Trolley
          </h1>
          <p className="text-gray-400">
            Configuración de sesión de picking
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trolley ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID del Trolley
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={trolleyId}
                onChange={(e) => setTrolleyId(e.target.value)}
                placeholder="Ej: 123"
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.trolleyId ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
            {errors.trolleyId && (
              <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.trolleyId}</span>
              </div>
            )}
          </div>

          {/* Operator ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID del Operador
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="Ej: 456"
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.operatorId ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
            {errors.operatorId && (
              <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.operatorId}</span>
              </div>
            )}
          </div>

          {/* Operator Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Operador
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.operatorName ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
            {errors.operatorName && (
              <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.operatorName}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white transition-colors"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="space-y-1 text-xs">
                <li>• Asegúrate de tener permisos de cámara</li>
                <li>• La sesión se grabará automáticamente</li>
                <li>• Los productos se detectarán en tiempo real</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
