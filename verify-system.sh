#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "🔍 VERIFICACIÓN DEL SISTEMA - Smart Trolley"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para checkmarks
check_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar archivos .env
echo "📁 Verificando archivos de configuración..."

if [ -f "apps/api/.env" ]; then
    check_ok "apps/api/.env existe"
else
    check_error "apps/api/.env NO EXISTE"
    echo "   Ejecuta: ./start.sh para crearlo"
    exit 1
fi

if [ -f "apps/web-camera/.env" ]; then
    check_ok "apps/web-camera/.env existe"
else
    check_error "apps/web-camera/.env NO EXISTE"
    echo "   Ejecuta: ./start.sh para crearlo"
    exit 1
fi

echo ""

# 2. Verificar procesos corriendo
echo "🔧 Verificando procesos..."

NODEMON_PID=$(pgrep -f "nodemon")
if [ -n "$NODEMON_PID" ]; then
    check_ok "Backend corriendo (PID: $NODEMON_PID)"
else
    check_error "Backend NO está corriendo"
    echo "   Ejecuta: ./start.sh"
    exit 1
fi

VITE_PID=$(pgrep -f "vite")
if [ -n "$VITE_PID" ]; then
    check_ok "Frontend corriendo (PID: $VITE_PID)"
else
    check_error "Frontend NO está corriendo"
    echo "   Ejecuta: ./start.sh"
    exit 1
fi

echo ""

# 3. Verificar conectividad del backend
echo "🌐 Verificando backend (puerto 3001)..."

BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    check_ok "Backend responde correctamente (HTTP 200)"
    
    # Obtener info del backend
    BACKEND_INFO=$(curl -s http://localhost:3001)
    GEMINI_MODE=$(echo $BACKEND_INFO | grep -o '"gemini_mode":"[^"]*"' | cut -d'"' -f4)
    check_ok "Modo Gemini: $GEMINI_MODE"
else
    check_error "Backend no responde (HTTP $BACKEND_RESPONSE)"
    exit 1
fi

echo ""

# 4. Verificar conectividad del frontend
echo "🌐 Verificando frontend (puerto 3002)..."

FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    check_ok "Frontend responde correctamente (HTTP 200)"
else
    check_error "Frontend no responde (HTTP $FRONTEND_RESPONSE)"
    exit 1
fi

echo ""

# 5. Probar WebSocket
echo "🔌 Probando conexión WebSocket..."

if [ -f "test-websocket.js" ]; then
    WS_TEST_OUTPUT=$(node test-websocket.js 2>&1)
    if echo "$WS_TEST_OUTPUT" | grep -q "TODAS LAS PRUEBAS PASARON"; then
        check_ok "WebSocket funcionando correctamente"
        SCAN_ID=$(echo "$WS_TEST_OUTPUT" | grep "Scan ID:" | awk '{print $3}')
        check_ok "Scan de prueba creado (ID: $SCAN_ID)"
    else
        check_error "WebSocket no está funcionando"
        echo "$WS_TEST_OUTPUT"
        exit 1
    fi
else
    check_warning "Script de prueba no encontrado (test-websocket.js)"
fi

echo ""

# 6. Verificar base de datos
echo "💾 Verificando base de datos..."

if grep -q "DATABASE_URL" apps/api/.env; then
    check_ok "DATABASE_URL configurado"
else
    check_error "DATABASE_URL no configurado"
    exit 1
fi

echo ""

# 7. Verificar API key de Gemini
echo "🤖 Verificando Gemini API..."

if grep -q "GEMINI_API_KEY" apps/api/.env; then
    API_KEY=$(grep "GEMINI_API_KEY" apps/api/.env | cut -d'=' -f2)
    if [ ${#API_KEY} -gt 10 ]; then
        check_ok "GEMINI_API_KEY configurado (${#API_KEY} caracteres)"
    else
        check_error "GEMINI_API_KEY parece inválido"
        exit 1
    fi
else
    check_error "GEMINI_API_KEY no configurado"
    exit 1
fi

echo ""

# 8. Verificar logs
echo "📋 Verificando logs..."

if [ -f "logs/backend.log" ]; then
    BACKEND_LOG_LINES=$(wc -l < logs/backend.log)
    check_ok "Backend log existe ($BACKEND_LOG_LINES líneas)"
    
    # Verificar si hay errores recientes
    RECENT_ERRORS=$(tail -n 50 logs/backend.log | grep -i "error" | wc -l)
    if [ "$RECENT_ERRORS" -gt 0 ]; then
        check_warning "$RECENT_ERRORS errores en los últimos 50 logs"
    fi
else
    check_warning "Backend log no encontrado"
fi

if [ -f "logs/webcam.log" ]; then
    WEBCAM_LOG_LINES=$(wc -l < logs/webcam.log)
    check_ok "Frontend log existe ($WEBCAM_LOG_LINES líneas)"
else
    check_warning "Frontend log no encontrado"
fi

echo ""

# Resumen final
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ SISTEMA VERIFICADO Y FUNCIONANDO CORRECTAMENTE${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🎯 Siguiente paso:"
echo "   1. Abre http://localhost:3002/ en tu navegador"
echo "   2. Haz clic en '▶ Iniciar Streaming'"
echo "   3. Muestra productos a la cámara"
echo ""
echo "📊 Para ver logs en tiempo real:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/webcam.log"
echo ""
echo "🛑 Para detener el sistema:"
echo "   pkill -f nodemon && pkill -f vite"
echo ""

