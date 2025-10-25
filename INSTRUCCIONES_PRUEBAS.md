# 🧪 INSTRUCCIONES PARA EJECUTAR PRUEBAS

## ⚠️ CONFIGURACIÓN INICIAL REQUERIDA

### 1. Crear archivo `.env` en la raíz del proyecto

```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY
```

Crea un archivo `.env` con este contenido (copia y pega):

```env
# Database (actualiza con tu conexión real de Neon o PostgreSQL local)
DATABASE_URL="postgresql://user:password@localhost:5432/smart_trolley?schema=public"

# Gemini API - MODO FAKE para pruebas sin API key
GEMINI_API_KEY=fake_key_for_testing
GEMINI_MODEL=gemini-robotics-er-1.5
GEMINI_FAKE=1

# Video Streaming Configuration
VIDEO_FRAME_SEND_FPS=2
VIDEO_FRAME_RES_W=640
VIDEO_FRAME_RES_H=360
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200

# WebSocket
WS_URL=http://localhost:3001

# JWT Authentication
JWT_SECRET=supersecretkey_change_in_production_12345

# API Server
PORT=3001
NODE_ENV=development

# Frontend/Dashboard
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

**IMPORTANTE**: Actualiza `DATABASE_URL` con tu conexión real de PostgreSQL.

### 2. Ejecutar Comandos de Setup

Copia y pega estos comandos en tu terminal:

```bash
# 1. Migración de base de datos
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY
npx prisma migrate dev --name transform_to_video_detection
npx prisma generate

# 2. Instalar dependencias del backend
cd apps/api
npm install

# 3. Instalar dependencias del mobile
cd ../mobile-shelf
npm install

# 4. Instalar dependencias del dashboard (si existe)
cd ../dashboard
npm install 2>/dev/null || echo "Dashboard dependencies skipped"

# 5. Volver a la raíz
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY
```

### 3. Seed de Base de Datos (Opcional pero Recomendado)

Actualiza `seed-database.js` para incluir productos con visual description:

```javascript
// Agregar al seed existente:
await prisma.product.createMany({
  data: [
    {
      name: 'Coca-Cola 350ml',
      visualDescription: 'Lata roja con logo blanco de Coca-Cola',
      detectionKeywords: ['coca', 'cola', 'lata', 'roja'],
      category: 'Bebidas',
    },
    {
      name: 'Sprite 350ml',
      visualDescription: 'Lata verde con logo Sprite',
      detectionKeywords: ['sprite', 'lata', 'verde', 'limón'],
      category: 'Bebidas',
    },
    {
      name: 'Lays Original 100gr',
      visualDescription: 'Bolsa amarilla de papas Lays',
      detectionKeywords: ['lays', 'papas', 'bolsa', 'amarilla'],
      category: 'Snacks',
    },
  ],
});
```

Luego ejecuta:
```bash
node seed-database.js
```

---

## 🚀 EJECUTAR EL SISTEMA

### Opción A: En 3 Terminales Separadas

**Terminal 1 - Backend:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/api
GEMINI_FAKE=1 npm run dev
```

**Terminal 2 - Mobile App:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/mobile-shelf
npx expo start
# Presiona 'a' para Android o 'i' para iOS
```

**Terminal 3 - Dashboard (opcional):**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/dashboard
npm run dev
```

### Opción B: Script Automatizado

Crea `start-all.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando Smart Trolley System...${NC}"

# Terminal 1: Backend
echo -e "${BLUE}📡 Starting Backend API...${NC}"
osascript -e 'tell app "Terminal" to do script "cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/api && GEMINI_FAKE=1 npm run dev"'

# Esperar 3 segundos
sleep 3

# Terminal 2: Mobile
echo -e "${BLUE}📱 Starting Mobile App...${NC}"
osascript -e 'tell app "Terminal" to do script "cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/mobile-shelf && npx expo start"'

# Terminal 3: Dashboard
echo -e "${BLUE}🖥️  Starting Dashboard...${NC}"
osascript -e 'tell app "Terminal" to do script "cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/dashboard && npm run dev"'

echo -e "${GREEN}✅ All services starting!${NC}"
echo ""
echo "Backend:   http://localhost:3001"
echo "Dashboard: http://localhost:3000"
echo "Mobile:    Use Expo app"
```

Luego:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 🧪 PROBAR EL SISTEMA

### 1. Verificar Backend
```bash
curl http://localhost:3001/api/health
```

### 2. Testing con Mobile App

1. Abre Expo app en tu teléfono
2. Escanea el QR code
3. Ingresa:
   - **Trolley ID**: 1
   - **Operator ID**: 1
   - **Nombre**: Test User
4. Presiona "Iniciar Sesión"
5. La cámara debería empezar a grabar
6. Mete productos (o simula con objetos)

### 3. Verificar Detecciones

**En modo FAKE**, las detecciones se disparan por keywords en frameId:
- Si el frame contiene "coca" → detecta Coca-Cola
- Si el frame contiene "sprite" → detecta Sprite
- Si el frame contiene "lays" → detecta Lays

**Ver logs del backend** para confirmar detecciones.

### 4. Ver Dashboard

Abre http://localhost:3000 y verás:
- Detecciones en tiempo real
- Progreso del trolley
- Productos detectados

---

## 🐛 TROUBLESHOOTING

### "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Actualiza `DATABASE_URL` en `.env`
- O usa Neon (serverless)

### "WebSocket connection failed"
- Verifica que backend esté corriendo en puerto 3001
- Verifica firewall
- Revisa logs del backend

### "Camera permission denied"
- En iOS: Settings → Expo Go → Allow Camera
- En Android: Settings → Apps → Expo Go → Permissions → Camera

### "No se detectan productos en modo FAKE"
- Verifica que `GEMINI_FAKE=1` esté configurado
- Revisa logs del backend
- Los frameIds deben contener keywords: "coca", "sprite", "lays"

---

## 📊 VERIFICAR QUE TODO FUNCIONA

### Checklist:
- [ ] Backend corriendo en puerto 3001
- [ ] Mobile app abre sin errores
- [ ] Cámara funciona y muestra vista previa
- [ ] WebSocket conectado (indicador verde en app)
- [ ] Frames se envían (contador incrementa)
- [ ] Detecciones aparecen en el feed
- [ ] Dashboard muestra actualizaciones en tiempo real

---

## 🎬 DEMO FLOW COMPLETO

1. **Backend**: Levanta en terminal 1
2. **Mobile**: Levanta en terminal 2, escanea QR
3. **Setup**: Ingresa trolley 1, operator 1, nombre "Test"
4. **Inicio**: Presiona "Iniciar"
5. **Grabación**: Cámara activa, frames enviándose
6. **Detección**: En modo FAKE, detecta automáticamente
7. **Dashboard**: Abre localhost:3000, ve actualizaciones
8. **Finalizar**: Presiona "Finalizar Sesión"

---

## 🔧 COMANDOS ÚTILES

```bash
# Ver logs de Prisma
npx prisma studio

# Resetear base de datos
npx prisma migrate reset

# Ver base de datos
npx prisma studio

# Limpiar todo y reinstalar
rm -rf node_modules apps/*/node_modules
npm install
cd apps/api && npm install
cd ../mobile-shelf && npm install
cd ../dashboard && npm install
```

---

## 🚀 PRÓXIMO PASO

**AHORA EJECUTA**:

```bash
# 1. Crea el archivo .env con el contenido de arriba
nano .env
# Pega el contenido, Ctrl+O para guardar, Ctrl+X para salir

# 2. Ejecuta la migración
npx prisma migrate dev --name transform_to_video_detection
npx prisma generate

# 3. Instala dependencias
cd apps/api && npm install && cd -
cd apps/mobile-shelf && npm install && cd -

# 4. Inicia backend
cd apps/api && GEMINI_FAKE=1 npm run dev
```

Luego en otra terminal:
```bash
# 5. Inicia mobile
cd apps/mobile-shelf && npx expo start
```

¡Listo para probar! 🎉

