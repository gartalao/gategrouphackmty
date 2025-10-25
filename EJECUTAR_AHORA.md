# 🚀 EJECUTAR SISTEMA - PASOS RÁPIDOS

## ✅ PASO 1: Crear archivo .env

Ejecuta este comando en la terminal:

```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY

cat > .env << 'EOF'
# Database (usa tu conexión de Neon o PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/smart_trolley?schema=public"

# Gemini API - REAL MODE con tu API key
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
GEMINI_MODEL=gemini-pro-vision
GEMINI_FAKE=0

# Video Streaming
VIDEO_FRAME_SEND_FPS=2
VIDEO_FRAME_RES_W=640
VIDEO_FRAME_RES_H=360
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200

# WebSocket
WS_URL=http://localhost:3001

# JWT
JWT_SECRET=supersecretkey_hackmty_2025

# API Server
PORT=3001
NODE_ENV=development

# Frontend/Dashboard
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
EXPO_PUBLIC_WS_URL=http://localhost:3001
EXPO_PUBLIC_VIDEO_FRAME_SEND_FPS=2
EOF
```

**⚠️ IMPORTANTE**: Actualiza `DATABASE_URL` con tu conexión real de PostgreSQL/Neon.

---

## ✅ PASO 2: Migración y Setup

```bash
# Migración de base de datos
npx prisma migrate dev --name transform_to_video_detection --skip-seed
npx prisma generate

# Instalar dependencias del backend
cd apps/api
npm install

# Volver a raíz e instalar mobile
cd ..
cd apps/mobile-shelf  
npm install

cd ../..
```

---

## ✅ PASO 3: Ejecutar el Sistema

### Opción A: Script Automático (Recomendado)

```bash
./setup-and-run.sh
```

Selecciona opción **2** (Backend + Mobile)

### Opción B: Manual en 2 Terminales

**Terminal 1 - Backend:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/api
npm run dev
```

**Terminal 2 - Mobile:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/mobile-shelf
npx expo start
```

Luego presiona **'a'** para Android o **'i'** para iOS

---

## 🧪 PROBAR LA DETECCIÓN REAL CON GEMINI

1. **Abre la app móvil** (escanea QR con Expo Go)

2. **Setup inicial:**
   - Trolley ID: `1`
   - Operator ID: `1`
   - Nombre: `Tu Nombre`
   - Presiona **"Iniciar Sesión"**

3. **Grabación activa:**
   - La cámara empieza a grabar
   - Frames se envían cada 500ms
   - Verás indicador verde de "Conectado"

4. **Detectar productos:**
   - Toma una **Coca-Cola** (o cualquier bebida/snack)
   - **Muéstrala a la cámara mientras la "metes" al trolley**
   - Gemini analizará y detectará el producto
   - Verás la detección en el feed en ~1-2 segundos

5. **Ver resultados:**
   - En la app: Lista de productos detectados
   - En el backend: Logs de detecciones
   - En dashboard (localhost:3000): Actualizaciones en tiempo real

---

## 🎯 MODO FAKE vs REAL

### Modo FAKE (Para testing sin consumir API):
```bash
# En .env cambia:
GEMINI_FAKE=1
```
Detectará productos basándose en keywords en el frameId.

### Modo REAL (Con Gemini - YA CONFIGURADO):
```bash
# En .env:
GEMINI_FAKE=0
GEMINI_API_KEY=AIzaSyAvU5F7oYGHxi-04bEIN5v5zwCSQg3cFco
```
Usa Gemini API real para detección visual.

---

## 📊 VERIFICAR QUE TODO FUNCIONA

### Checklist Rápido:
- [ ] `.env` creado con DATABASE_URL válida
- [ ] `npx prisma migrate dev` ejecutado sin errores
- [ ] Backend corriendo en http://localhost:3001
- [ ] Mobile app se abre en teléfono/emulador
- [ ] Indicador **verde** "Conectado" en la app
- [ ] Contador de frames incrementando
- [ ] Logs en backend muestran frames recibidos

### Comandos de Verificación:
```bash
# Verificar backend
curl http://localhost:3001

# Ver base de datos
npx prisma studio

# Ver logs de backend
# (ya deberían estar visibles en Terminal 1)
```

---

## 🐛 SOLUCIÓN RÁPIDA DE PROBLEMAS

### "Prisma migrate failed"
```bash
# Si no tienes PostgreSQL, necesitas instalarlo O usar Neon (serverless)
# Opción 1: PostgreSQL local
brew install postgresql@14
brew services start postgresql@14

# Opción 2: Usa Neon (gratis)
# Ve a: https://neon.tech
# Crea DB y copia el DATABASE_URL
```

### "Cannot connect to database"
Actualiza `DATABASE_URL` en `.env`:
```
DATABASE_URL="postgresql://username:password@host:5432/dbname?schema=public"
```

### "Gemini API error"
- Verifica que la API key es correcta
- Verifica que tienes créditos en Google Cloud
- Cambia temporalmente a `GEMINI_FAKE=1` para testing

### "WebSocket disconnected"
- Verifica que backend esté corriendo
- Verifica que no haya firewall bloqueando puerto 3001
- Revisa que `EXPO_PUBLIC_WS_URL` en .env sea correcto

---

## 📱 USAR EN TELÉFONO REAL

1. **Instala Expo Go** en tu teléfono:
   - iOS: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"

2. **Asegúrate de estar en la misma red WiFi** que tu laptop

3. **Escanea el QR** que aparece en la terminal

4. **La app se cargará** directamente en tu teléfono

---

## 🎬 FLOW COMPLETO DE PRUEBA

1. ✅ Crear `.env` con comando de arriba
2. ✅ Ejecutar migración: `npx prisma migrate dev`
3. ✅ Instalar deps: `cd apps/api && npm install && cd -`
4. ✅ Iniciar backend: `cd apps/api && npm run dev`
5. ✅ En otra terminal, iniciar mobile: `cd apps/mobile-shelf && npx expo start`
6. ✅ Escanear QR con Expo Go
7. ✅ Ingresar datos de setup
8. ✅ Iniciar grabación
9. ✅ Mostrar productos a la cámara
10. ✅ Ver detecciones en tiempo real

---

## 💡 TIPS PARA MEJOR DETECCIÓN

- **Buena iluminación** - Gemini necesita ver bien el producto
- **Muestra la etiqueta** - El texto ayuda a identificar
- **Movimiento claro** - Simula meter el producto al trolley
- **Espera 1-2 segundos** entre productos (cooldown)
- **Productos conocidos** - Usa bebidas/snacks comunes primero

---

## 🚀 SIGUIENTE PASO

**EJECUTA ESTE COMANDO AHORA:**

```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY
./setup-and-run.sh
```

Selecciona opción **2** y ¡empieza a probar! 🎉

---

**Nota**: Gemini API consume créditos. Monitor en:
https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com

