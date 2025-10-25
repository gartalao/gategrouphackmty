import React, { useState } from 'react';
import { OperatorSetup } from './pages/OperatorSetup';
import { LiveRecording } from './pages/LiveRecording';
import { DemoMode } from './pages/DemoMode';

type AppState = 'demo' | 'setup' | 'recording';

interface SessionData {
  trolleyId: number;
  operatorId: number;
  operatorName: string;
}

function App() {
  // Ir directo al modo de grabación sin login
  const [appState, setAppState] = useState<AppState>('recording');
  const [sessionData, setSessionData] = useState<SessionData>({
    trolleyId: 123,
    operatorId: 456,
    operatorName: 'Usuario Demo'
  });

  const handleStartSession = (data: SessionData) => {
    setSessionData(data);
    setAppState('recording');
  };

  const handleEndSession = () => {
    setSessionData({
      trolleyId: 123,
      operatorId: 456,
      operatorName: 'Usuario Demo'
    });
    setAppState('recording');
  };

  const handleGoToSetup = () => {
    setAppState('setup');
  };

  const handleBackToDemo = () => {
    setAppState('demo');
  };

  return (
    <div className="App">
      {appState === 'demo' && (
        <DemoMode />
      )}

      {appState === 'setup' && (
        <div>
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <button
              onClick={handleBackToDemo}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Volver al Demo
            </button>
            <span className="text-gray-400 text-sm">Configuración Real</span>
          </div>
          <OperatorSetup onStartSession={handleStartSession} />
        </div>
      )}
      
      {appState === 'recording' && sessionData && (
        <div>
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <button
              onClick={handleBackToDemo}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Volver al Demo
            </button>
            <span className="text-gray-400 text-sm">Grabación Real</span>
          </div>
          <LiveRecording
            trolleyId={sessionData.trolleyId}
            operatorId={sessionData.operatorId}
            operatorName={sessionData.operatorName}
            onEndSession={handleEndSession}
          />
        </div>
      )}
    </div>
  );
}

export default App;
