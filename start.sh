#!/bin/bash

echo "🚀 Smart Trolley - Detección en Tiempo Real"
echo "=========================================="
echo ""

# Verificar que existan los .env
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  Falta apps/api/.env - Créalo con DATABASE_URL y GEMINI_API_KEY"
    exit 1
fi

if [ ! -f "apps/web-camera/.env" ]; then
    echo "⚠️  Falta apps/web-camera/.env - Créalo con VITE_WS_URL=ws://localhost:3001"
    exit 1
fi

echo "✅ Variables de entorno configuradas"
echo ""

# Matar procesos anteriores
pkill -f "nodemon" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

echo "🔧 Iniciando Backend API (puerto 3001)..."
cd apps/api
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

sleep 3

echo "🌐 Iniciando Web Camera App (puerto 3002)..."
cd apps/web-camera
npm run dev > ../../logs/webcam.log 2>&1 &
WEBCAM_PID=$!
cd ../..

sleep 2

echo ""
echo "✅ Sistema iniciado"
echo "=========================================="
echo "Backend API:  http://localhost:3001"
echo "Web Camera:   http://localhost:3002"
echo "=========================================="
echo ""
echo "📊 Para ver logs:"
echo "  Backend:  tail -f logs/backend.log"
echo "  Web App:  tail -f logs/webcam.log"
echo ""
echo "🛑 Para detener: pkill -f nodemon && pkill -f vite"
echo ""
echo "🎬 SIGUIENTE: Abre http://localhost:3002/ y haz clic en Iniciar"

