# 📱 Demo Móvil en Tiempo Real - Setup Rápido

## 🎯 Objetivo

Usar tu teléfono para capturar productos en tiempo real y ver las detecciones de Gemini instantáneamente en terminal y dashboard.

---

## ⚡ Setup en 3 Pasos

### 1️⃣ Obtener tu IP Local

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1

# O manualmente:
# System Preferences → Network → Advanced → TCP/IP → IPv4 Address
# Ejemplo: 192.168.1.100
```

Apunta tu IP, la necesitarás para configurar el móvil.

### 2️⃣ Ejecutar Backend con Logs Verbosos

**Terminal 1:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY

# Generar Prisma (solo primera vez)
npm run db:generate

# Instalar dependencias del API
cd apps/api
npm install

# Ejecutar con logs detallados
npm run dev
```

Verás:
```
✨ Done in XXXms
🚀 API server started
   port: 4000
   env: development
📡 WebSocket endpoint: ws://localhost:4000/ws/socket.io
💾 Storage directory: ./storage
Gemini detector initialized
   modelId: gemini-robotics-er-1.5-preview
```

### 3️⃣ Ejecutar App Móvil con QR

**Terminal 2:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/mobile-shelf

# Instalar dependencias
npm install

# Iniciar Expo (generará QR)
npm start
```

Verás un **QR code** en la terminal. Escanéalo con:
- **iOS**: Cámara nativa
- **Android**: App Expo Go (descargar de Play Store)

---

## 📱 Configurar la App Móvil

### Al abrir la app en tu teléfono:

1. **Permitir acceso a cámara**

2. **Cambiar API URL** (IMPORTANTE):
   - Tap en el campo "API URL"
   - Cambiar de `http://192.168.1.100:4000` a **TU IP LOCAL**
   - Ejemplo: `http://192.168.1.50:4000`
   - ⚠️ **Debe ser IP local, NO localhost** (tu teléfono no puede acceder a localhost)

3. **Configurar IDs** (opcional):
   - Flight ID: `1` (vuelo AA2345)
   - Trolley ID: `1` (TRLLY-001)
   - Shelf ID: `1` (Top shelf)
   - Intervalo: `5` segundos

4. **Tap "▶️ INICIAR CAPTURA"**

---

## 🎬 Demo en Vivo

### Preparación:
- Coloca algunos productos frente a la cámara:
  - Latas de Coca-Cola
  - Botellas de agua
  - Bolsas de snacks
  - Cualquier producto empacado

### Ver Resultados en Tiempo Real:

**En la Terminal del Backend** verás:
```
📸 Image saved
   imagePath: 2025/10/26/abc123.jpg
   size: 234567

🤖 Gemini detection completed
   duration: 823
   itemsCount: 3
   model: gemini-robotics-er-1.5-preview

🔍 Detections processed
   shelfId: 1
   totalDetections: 3
   uniqueProducts: 2

✅ Scan completed with Gemini
   scanId: 5
   duration: 1245
   itemsCount: 2
   provider: gemini

📡 WebSocket event emitted:
   scan_processed → trolley:1

⚠️  Alert created:
   type: missing_item
   sku: COK-REG-330
   diff: -12
```

**En el Móvil** verás:
```
📊 Estadísticas
Total: 5
✅ Exitosos: 5
❌ Errores: 0
Última: 2 items, conf: 87%

Último Scan #5
• COK-REG-330: 12 unidades (conf: 89%)
• WTR-REG-500: 6 unidades (conf: 85%)

⚠️ Alertas:
🔴 COK-REG-330: diff -12
```

**En el Dashboard** (http://localhost:3000/trolleys/1):
- 🎉 Toast: "Scan processed for Shelf 1"
- Shelf 1 cambia de color según diffs
- Tabla actualiza en tiempo real
- Nueva imagen aparece

---

## 🧪 Pruebas Sugeridas

### Test 1: Producto Completo
1. Coloca exactamente 24 latas de Coca-Cola
2. Espera 5-10 segundos
3. Verifica: Shelf 1 → 🟢 Verde (diff: 0)

### Test 2: Faltante
1. Coloca solo 20 latas
2. Verifica: Shelf 1 → 🟡 Amarillo
3. Alert: "🔴 COK-REG-330: diff -4"

### Test 3: Excedente
1. Coloca 30 latas
2. Verifica: Shelf 1 → 🟡 Amarillo
3. Alert: "🟡 COK-REG-330: diff +6"

### Test 4: Producto No Esperado
1. Coloca un producto que NO está en requirements
2. Verifica: Alert de "mismatch"

---

## 📊 Monitoreo en Tiempo Real

### Terminal Backend
Muestra cada scan con:
- ✅ Items detectados
- 📊 Confidence promedio
- ⚠️ Alertas generadas
- 📡 Eventos WebSocket emitidos

### Base de Datos (Prisma Studio - Opcional)

**Terminal 3:**
```bash
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY
npm run db:studio
```

Abre: http://localhost:5555

Ver tablas en tiempo real:
- `scans` - Cada captura
- `scan_items` - Items detectados
- `alerts` - Alertas generadas

### Dashboard Web

**Terminal 4 (Opcional):**
```bash
cd apps/dashboard
npm install
npm run dev
```

Abre: http://localhost:3000/trolleys/1

---

## 🔧 Troubleshooting

### "Network request failed" en el móvil

**Problema:** El móvil no puede conectar al backend.

**Solución:**
1. Verifica que móvil y computadora estén en la **misma WiFi**
2. Obtén tu IP local (no uses localhost):
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. Actualiza `API URL` en la app móvil
4. Verifica que el backend esté corriendo:
   ```bash
   curl http://TU_IP:4000/health
   ```

### "Camera permission denied"

Permite acceso a cámara en:
- iOS: Settings → Smart Trolley Camera → Camera
- Android: Settings → Apps → Expo Go → Permissions → Camera

### "Gemini API error"

Verifica `GEMINI_API_KEY` en `apps/api/.env`

### "No items detected"

- Asegúrate de tener buena iluminación
- Productos deben estar visibles y enfocados
- Mantén la cámara estable (no movimiento borroso)
- Espera 5-10 segundos para que procese

---

## 🎯 Flujo Completo

```
1. Móvil captura foto cada 5s
   ↓
2. Compress a JPEG 1280px
   ↓
3. Upload a http://TU_IP:4000/scan
   ↓
4. Backend normaliza con Sharp
   ↓
5. Gemini Robotics-ER detecta productos
   ↓
6. Match labels → products DB
   ↓
7. Calcular diffs vs requirements
   ↓
8. Generar alerts si hay discrepancias
   ↓
9. Emit WebSocket → Dashboard
   ↓
10. Ver en:
    • Terminal (logs detallados)
    • Móvil (stats + último scan)
    • Dashboard (tiempo real)
    • Prisma Studio (DB)
```

---

## 📸 Capturas Esperadas

```
┌─────────────────────────────────────┐
│ 📱 Smart Trolley Camera             │
├─────────────────────────────────────┤
│                                     │
│     [Vista de Cámara]               │
│                                     │
│     🔴 CAPTURANDO                   │
│                                     │
├─────────────────────────────────────┤
│ 📊 Estadísticas                     │
│ Total: 12                           │
│ ✅ Exitosos: 11                     │
│ ❌ Errores: 1                       │
│ Última: 3 items, conf: 89%          │
├─────────────────────────────────────┤
│ API URL: http://192.168.1.50:4000   │
│ Flight: 1 | Trolley: 1 | Shelf: 1   │
│ Intervalo: 5s                       │
├─────────────────────────────────────┤
│     [⏸️  DETENER]                   │
│     [📸 CAPTURA MANUAL]             │
├─────────────────────────────────────┤
│ Último Scan #5                      │
│ • COK-REG-330: 12 (89%)             │
│ • WTR-REG-500: 6 (85%)              │
│                                     │
│ ⚠️ Alertas:                         │
│ 🔴 COK-REG-330: diff -12            │
└─────────────────────────────────────┘
```

---

## 🚀 ¡Listo!

Ahora tienes:
- ✅ Backend con Gemini corriendo
- ✅ App móvil con QR generado
- ✅ Logs en tiempo real en terminal
- ✅ Dashboard con actualizaciones live
- ✅ Base de datos actualizada automáticamente

**Escanea el QR y empieza a probar con productos reales!** 📸🎉

