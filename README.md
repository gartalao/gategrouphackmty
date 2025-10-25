# 🎥 Smart Trolley - Detección en Tiempo Real con Gemini

Sistema de detección visual de productos en tiempo real para trolleys de catering aéreo usando **Gemini Robotics-ER 1.5**.

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
# Backend
cd apps/api && npm install

# Web Camera
cd apps/web-camera && npm install
```

### 2. Configurar Variables de Entorno

**`apps/api/.env`**:
```env
DATABASE_URL="tu_conexion_neon_o_postgres"
GEMINI_API_KEY="tu_api_key_aqui"
PORT=3001
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
JWT_SECRET=any_secret_key
```

**`apps/web-camera/.env`**:
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
```

### 3. Migrar Base de Datos
```bash
npx prisma db push
node seed-products.js
```

### 4. Ejecutar el Sistema

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Web Camera:**
```bash
cd apps/web-camera
npm run dev
```

### 5. Usar la Aplicación
```
Abre: http://localhost:3002/
Clic en: "▶ Iniciar Streaming"
Muestra productos a la cámara
```

---

## 🏗️ Arquitectura

```
🌐 Web Camera App (React + Vite)
    ↓ WebSocket (2 fps)
🔧 Backend API (Node.js + Express)
    ↓ REST API
🤖 Gemini Robotics-ER 1.5
    ↓ JSON Response
📊 ProductDetection → Database
    ↓ WebSocket Event
🌐 Web App actualiza UI

Latencia: ~1-2 segundos
```

---

## 📦 Productos Detectables

El sistema detecta productos por **COLOR, FORMA y TEXTO visible**:

### Bebidas (Latas):
- 🥤 Coca-Cola 350ml (lata roja)
- 🥤 Coca-Cola Zero 350ml (lata negra)
- 🥤 Sprite 350ml (lata verde)
- 🥤 Pepsi 350ml (lata azul)

### Bebidas (Botellas):
- 💧 Agua Natural 500ml (botella transparente)

### Snacks (Bolsas):
- 🍟 Lays Original 100gr (bolsa amarilla)
- 🍟 Lays Queso 100gr (bolsa naranja)
- 🌮 Doritos Nacho 100gr (bolsa roja)

---

## 🛠️ Stack Tecnológico

### Frontend:
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client
- WebRTC (getUserMedia)

### Backend:
- Node.js + Express
- Socket.IO Server
- Prisma ORM
- PostgreSQL (Neon)
- Gemini Robotics-ER 1.5 REST API

---

## 🎯 Características

- ✅ **Detección en tiempo real** (2 fps)
- ✅ **Streaming automático** al hacer clic en Iniciar
- ✅ **Gemini Robotics-ER 1.5** para análisis visual
- ✅ **WebSocket bidireccional** para latencia mínima
- ✅ **Detección por COLOR, FORMA y TEXTO** (sin SKUs)
- ✅ **Cooldown anti-duplicados** (1.2 segundos)
- ✅ **UI simplificada** (solo Iniciar/Detener)
- ✅ **Server-side processing** (API key segura)

---

## 📁 Estructura del Proyecto

```
GateGroup_HackMTY/
├── apps/
│   ├── api/                    # Backend Node.js
│   │   ├── src/index.js
│   │   ├── services/
│   │   │   └── geminiService.js   # Gemini REST API
│   │   └── routes/
│   │       ├── videoStream.js     # WebSocket streaming
│   │       └── detections.js      # REST endpoints
│   │
│   ├── web-camera/             # Web App React
│   │   └── src/
│   │       ├── pages/
│   │       │   └── LiveRecording.tsx  # Página principal
│   │       ├── components/
│   │       │   ├── CameraView.tsx      # Vista de cámara
│   │       │   ├── DetectionFeed.tsx   # Lista de detecciones
│   │       │   └── StatusPanel.tsx     # Controles
│   │       └── services/
│   │           ├── websocketService.ts  # Cliente WebSocket
│   │           └── cameraService.ts     # Manejo de cámara
│   │
│   └── dashboard/              # Dashboard (opcional)
│
├── prisma/
│   └── schema.prisma           # Modelo de datos
│
└── seed-products.js            # Seed de productos
```

---

## 🔌 API WebSocket

### Eventos Cliente → Backend:
```typescript
start_scan({ trolleyId, operatorId }) → { scanId, status }
frame({ scanId, frameId, jpegBase64, ts }) → void
end_scan({ scanId }) → { status, endedAt }
```

### Eventos Backend → Cliente:
```typescript
product_detected({
  trolley_id,
  product_id,
  product_name,
  detected_at,
  confidence,
  box_2d
})
```

---

## 🎬 Flujo de Uso

1. Usuario abre http://localhost:3002/
2. Hace clic en **"▶ Iniciar Streaming"**
3. WebSocket conecta al backend
4. Sesión de scan se crea automáticamente
5. Cámara inicia streaming a 2 fps
6. Cada frame se envía al backend automáticamente
7. Backend analiza con Gemini
8. Detecciones aparecen en UI automáticamente

**Todo automático después del clic inicial** ✅

---

## 🐛 Troubleshooting

### "Sin conexión al servidor"
- Verifica que backend esté corriendo: `curl http://localhost:3001`
- Verifica`.env` en `apps/web-camera`
- Recarga la página: Ctrl+Shift+R

### "Gemini inactivo"
- Es normal hasta que se reciba la primera detección
- Muestra un producto a la cámara
- Espera 1-2 segundos

### "No se detectan productos"
- Verifica logs del backend para errores de Gemini
- Asegúrate de usar productos de la lista
- Mejora la iluminación
- Acerca más el producto

---

## 📊 Métricas

- **Latencia**: ~1-2 segundos end-to-end
- **FPS**: 2 frames por segundo
- **Threshold**: 0.70 de confianza
- **Cooldown**: 1.2 segundos por producto

---

## 📝 Licencia

MIT - GateGroup Smart Trolley Team
