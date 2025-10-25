# 🚀 INICIO RÁPIDO - Sistema de Detección en Tiempo Real

## ✅ Estado Actual
**SISTEMA COMPLETAMENTE FUNCIONAL Y LISTO PARA USAR**

---

## 🎯 Inicio en 3 Pasos

### 1️⃣ Verificar que el sistema esté corriendo

```bash
# Ver procesos activos
ps aux | grep -E "nodemon|vite" | grep -v grep
```

**Si NO ves procesos**, inicia el sistema:
```bash
./start.sh
```

### 2️⃣ Abrir la aplicación

Abre tu navegador en: **http://localhost:3002/**

### 3️⃣ Iniciar streaming

1. Haz clic en el botón **"▶ Iniciar Streaming"**
2. Abre la consola del navegador (F12) para ver los logs
3. Muestra productos a la cámara

**¡Listo!** El sistema detectará productos automáticamente.

---

## 🔍 Verificación Rápida

### Backend funcionando:
```bash
curl http://localhost:3001
```
Debe devolver: `{"status": "ok", "message": "Smart Trolley API...", ...}`

### Frontend funcionando:
```bash
curl -I http://localhost:3002
```
Debe devolver: `HTTP/1.1 200 OK`

---

## 📊 Qué Ver en la Consola del Navegador

Cuando hagas clic en "Iniciar Streaming", deberías ver:

```
✅ [LiveRecording] Componente montado. Esperando clic en Iniciar...
✅ [LiveRecording] 🚀 Conectando al backend vía WebSocket...
✅ [WebSocket] ✅ Conectado a ws://localhost:3001
✅ [LiveRecording] ✅ WebSocket conectado
✅ [LiveRecording] 🎬 Iniciando sesión de scan...
✅ [WebSocket] ✅ Scan iniciado: {scanId: X}
✅ [LiveRecording] ▶ Streaming AUTOMÁTICO iniciado
✅ [CameraView] 🎬 Streaming iniciado a 2 fps
✅ [LiveRecording] 📸 Frame 1 capturado
✅ [LiveRecording] 📡 Frame 1 enviado al backend
```

---

## 🎨 Qué Ver en la UI

### Panel "Estado del Sistema"

**Gemini AI:**
- 🟢 "Analizando..." cuando procesa frames
- 🟢 "Producto detectado" cuando encuentra algo

**Streaming:**
- 🟢 "Backend conectado" (si conexión exitosa)
- 🔴 "Desconectado - WebSocket al servidor" (si falla)

**Estadísticas:**
- **Frames**: Contador que incrementa cada 500ms
- **Detecciones**: Número de productos detectados
- **Activo**: 🟢 si está transmitiendo

### Lista de Detecciones

Aparecerán automáticamente los productos detectados con:
- Nombre del producto
- Hora de detección
- Nivel de confianza (badge verde)

---

## 🐛 Si Algo Sale Mal

### 1. WebSocket no conecta

**Síntoma:** UI muestra "Desconectado - WebSocket al servidor"

**Solución:**
```bash
# Reiniciar todo
killall -9 node nodemon vite
./start.sh

# Esperar 5 segundos, luego refrescar navegador con Ctrl+Shift+R
```

### 2. No hay video de cámara

**Síntoma:** Pantalla negra o error de permisos

**Solución:**
- Dar permisos de cámara al navegador
- Verificar que no haya otra app usando la cámara
- Refrescar la página

### 3. No se detectan productos

**Síntoma:** Streaming funciona pero no aparecen detecciones

**Solución:**
```bash
# Ver logs del backend
tail -f logs/backend.log

# Buscar errores de Gemini o base de datos
```

---

## 📁 Archivos de Configuración

### `/apps/web-camera/.env`
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true
```

### `/apps/api/.env`
```env
DATABASE_URL="postgresql://..."
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-robotics-er-1.5-preview
PORT=3001
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200
```

**NOTA:** Estos archivos ya fueron creados automáticamente.

---

## 🎯 Productos Detectables

El sistema está configurado para detectar estos 8 productos:

1. **Coca-Cola 350ml** (lata roja con texto blanco)
2. **Coca-Cola Zero 350ml** (lata negra)
3. **Sprite 350ml** (lata verde/transparente)
4. **Pepsi 350ml** (lata azul)
5. **Agua Natural 500ml** (botella transparente)
6. **Lays Original 100gr** (bolsa amarilla)
7. **Lays Queso 100gr** (bolsa naranja)
8. **Doritos Nacho 100gr** (bolsa roja/naranja)

**Detección por:**
- 🎨 Color (rojo, verde, azul, amarillo, etc.)
- 📦 Forma (lata, botella, bolsa)
- 🔤 Texto visible en etiquetas

---

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f logs/backend.log   # Backend
tail -f logs/webcam.log    # Frontend

# Detener todo
pkill -f nodemon && pkill -f vite

# Reiniciar todo
./start.sh

# Ver base de datos
npx prisma studio
# Ir a http://localhost:5555

# Ver procesos
ps aux | grep -E "node|vite" | grep -v grep
```

---

## 📸 Tips para Mejores Detecciones

1. **Iluminación:** Buena luz directa sobre los productos
2. **Distancia:** 30-50cm de la cámara
3. **Enfoque:** Mostrar el producto claramente
4. **Estabilidad:** Mantener el producto quieto 1-2 segundos
5. **Etiquetas:** Mostrar el lado con la marca/logo

---

## 🎬 Demo Rápida

1. Abre http://localhost:3002/
2. Clic en "Iniciar Streaming"
3. Abre una imagen de Coca-Cola en otra ventana
4. Muéstrala a la cámara
5. ¡Debería detectarse en < 2 segundos!

---

## 📞 Soporte

Si el sistema no funciona después de seguir estos pasos:

1. Verifica los logs: `tail -f logs/backend.log`
2. Revisa la consola del navegador (F12)
3. Lee el documento completo: `WEBSOCKET_FIXED.md`

---

**Última actualización:** 25 de octubre de 2025
**Estado:** ✅ TOTALMENTE FUNCIONAL

