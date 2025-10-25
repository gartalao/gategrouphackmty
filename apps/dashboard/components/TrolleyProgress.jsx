import React from 'react';

export default function TrolleyProgress({ requirements = [], detectedProducts = [] }) {
  // Create map of detected counts
  const detectedMap = detectedProducts.reduce((acc, product) => {
    acc[product.product_id] = product.count;
    return acc;
  }, {});

  // Calculate progress for each requirement
  const progressData = requirements.map((req) => {
    const detected = detectedMap[req.product_id] || 0;
    const expected = req.expected_quantity;
    const percentage = expected > 0 ? Math.min((detected / expected) * 100, 100) : 0;

    let status = 'pending';
    if (detected >= expected) status = 'complete';
    else if (detected > 0) status = 'in_progress';

    return {
      ...req,
      detected,
      expected,
      percentage,
      status,
      diff: detected - expected,
    };
  });

  const totalExpected = requirements.reduce((sum, req) => sum + req.expected_quantity, 0);
  const totalDetected = Object.values(detectedMap).reduce((sum, count) => sum + count, 0);
  const overallPercentage = totalExpected > 0 ? (totalDetected / totalExpected) * 100 : 0;

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>Progreso del Trolley</span>
      </h3>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progreso General</span>
          <span>
            {totalDetected} / {totalExpected} ({Math.round(overallPercentage)}%)
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {progressData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay requisitos definidos para este trolley</p>
          </div>
        ) : (
          progressData.map((item) => (
            <ProductProgressCard key={item.product_id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function ProductProgressCard({ item }) {
  const statusConfig = {
    complete: {
      icon: '✓',
      color: 'bg-green-600',
      textColor: 'text-green-400',
      borderColor: 'border-green-500',
    },
    in_progress: {
      icon: '⏳',
      color: 'bg-yellow-600',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500',
    },
    pending: {
      icon: '○',
      color: 'bg-gray-600',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-600',
    },
  };

  const config = statusConfig[item.status];

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${config.borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${config.textColor}`}>{config.icon}</span>
          <div>
            <p className="text-white font-semibold">{item.product_name || item.name}</p>
            {item.category && (
              <p className="text-gray-500 text-sm">{item.category}</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-white font-bold text-lg">
            {item.detected} / {item.expected}
          </p>
          {item.diff !== 0 && (
            <p className={item.diff > 0 ? 'text-yellow-500' : 'text-red-500'} style={{ fontSize: '0.875rem' }}>
              {item.diff > 0 ? '+' : ''}{item.diff}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mt-3">
        <div
          className={`${config.color} h-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(item.percentage, 100)}%` }}
        />
      </div>

      {item.priority === 'critical' && item.status !== 'complete' && (
        <div className="mt-2 text-red-400 text-sm font-medium flex items-center gap-1">
          <span>🚨</span>
          <span>Producto crítico</span>
        </div>
      )}
    </div>
  );
}

