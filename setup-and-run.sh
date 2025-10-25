#!/bin/bash

# Smart Trolley - Setup and Run Script
# Configura y ejecuta todo el sistema para pruebas

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Smart Trolley - Setup & Run Script   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado${NC}"
    echo -e "${BLUE}📝 Creando .env con configuración de desarrollo...${NC}"
    
    cat > .env << 'EOF'
# Database (actualiza con tu conexión real)
DATABASE_URL="postgresql://user:password@localhost:5432/smart_trolley?schema=public"

# Gemini API - MODO FAKE para pruebas
GEMINI_API_KEY=fake_key_for_testing
GEMINI_MODEL=gemini-robotics-er-1.5
GEMINI_FAKE=1

# Video Streaming
VIDEO_FRAME_SEND_FPS=2
VIDEO_FRAME_RES_W=640
VIDEO_FRAME_RES_H=360
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200

# WebSocket
WS_URL=http://localhost:3001

# JWT
JWT_SECRET=supersecretkey_change_in_production_12345

# API Server
PORT=3001
NODE_ENV=development

# Frontend/Dashboard
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
EOF

    echo -e "${GREEN}✅ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Actualiza DATABASE_URL en .env con tu conexión real${NC}"
    echo ""
    read -p "Presiona Enter para continuar o Ctrl+C para editar .env primero..."
fi

# Install dependencies
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
echo ""

echo -e "${BLUE}  → Backend API...${NC}"
cd apps/api
npm install --silent 2>&1 | grep -v "^npm WARN" || true
cd ../..

echo -e "${BLUE}  → Mobile App...${NC}"
cd apps/mobile-shelf
npm install --silent 2>&1 | grep -v "^npm WARN" || true
cd ../..

echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# Prisma migration
echo -e "${BLUE}🗄️  Ejecutando migración de Prisma...${NC}"
npx prisma migrate dev --name transform_to_video_detection --skip-seed || {
    echo -e "${YELLOW}⚠️  Migración falló o ya existe${NC}"
}

echo -e "${BLUE}🔧 Generando cliente de Prisma...${NC}"
npx prisma generate

echo -e "${GREEN}✅ Base de datos lista${NC}"
echo ""

# Ask what to run
echo -e "${YELLOW}¿Qué quieres ejecutar?${NC}"
echo "1) Solo Backend API"
echo "2) Backend + Mobile"
echo "3) Todo (Backend + Mobile + Dashboard)"
echo "4) Solo instalar y salir"
read -p "Selecciona (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Iniciando Backend API...${NC}"
        cd apps/api
        GEMINI_FAKE=1 npm run dev
        ;;
    2)
        echo -e "${GREEN}🚀 Iniciando Backend y Mobile...${NC}"
        
        # Backend en nueva terminal
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/apps/api && GEMINI_FAKE=1 npm run dev"'
        
        sleep 2
        
        # Mobile en otra terminal
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/apps/mobile-shelf && npx expo start"'
        
        echo -e "${GREEN}✅ Servicios iniciados en nuevas terminales${NC}"
        ;;
    3)
        echo -e "${GREEN}🚀 Iniciando todos los servicios...${NC}"
        
        # Backend
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/apps/api && GEMINI_FAKE=1 npm run dev"'
        
        sleep 2
        
        # Mobile
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/apps/mobile-shelf && npx expo start"'
        
        sleep 2
        
        # Dashboard (si existe)
        if [ -d "apps/dashboard" ]; then
            osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/apps/dashboard && npm run dev"'
        fi
        
        echo -e "${GREEN}✅ Todos los servicios iniciados${NC}"
        ;;
    4)
        echo -e "${GREEN}✅ Setup completado. Sal y ejecuta manualmente${NC}"
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  URLs de los servicios:${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:3001${NC}"
echo -e "  Dashboard: ${BLUE}http://localhost:3000${NC}"
echo -e "  Mobile:    ${BLUE}Usa la app Expo Go${NC}"
echo ""
echo -e "${YELLOW}📱 Para mobile: Escanea el QR code con Expo Go${NC}"
echo -e "${YELLOW}🐛 Logs: Revisa las terminales que se abrieron${NC}"
echo ""

