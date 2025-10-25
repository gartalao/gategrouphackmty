# 🔍 LOGS COMPLETOS ACTIVADOS - Sistema de Diagnóstico

**Fecha:** 25 de octubre de 2025, 4:35 PM  
**Estado:** 🟢 SISTEMA REINICIADO CON LOGS DETALLADOS

---

## ✅ QUÉ SE HIZO

He agregado **LOGS COMPLETOS** en **TODOS** los componentes del sistema:

1. **Frontend - CameraService** - Captura de frames
2. **Frontend - LiveRecording** - Manejo de frames
3. **Frontend - WebSocketService** - Envío de frames
4. **Backend - VideoStream** - Recepción de frames
5. **Backend - GeminiService** - Llamadas a Gemini API

**Ahora verás EXACTAMENTE dónde está el problema.**

---

## 🚀 INSTRUCCIONES PARA PROBAR

### Paso 1: Cerrar TODAS las pestañas de localhost:3002

Cierra completamente el navegador o al menos todas las pestañas de la aplicación.

### Paso 2: Abrir en MODO INCÓGNITO

**Chrome:**
```
Cmd + Shift + N (Mac)
Ctrl + Shift + N (Windows/Linux)
```

**Firefox:**
```
Cmd + Shift + P (Mac)
Ctrl + Shift + P (Windows/Linux)
```

### Paso 3: Abrir la aplicación

```
http://localhost:3002/
```

### Paso 4: Abrir la consola del navegador

Presiona **F12** o **Cmd+Option+I** (Mac)

Ve a la pestaña **"Console"**

### Paso 5: Hacer clic en "Iniciar Streaming"

Haz clic en el botón verde **"▶ Iniciar Streaming"**

### Paso 6: Mostrar un producto a la cámara

Muestra una **Coca-Cola** (o cualquier producto) directamente a la cámara.

**Mantén el producto visible por al menos 2-3 segundos.**

---

## 📊 LOGS QUE DEBERÍAS VER

### En la Consola del Navegador:

#### Al cargar la página:
```
[LiveRecording] Componente montado. Esperando clic en Iniciar...
[LiveRecording] 📋 Configuración:
[LiveRecording]    - WS_URL: ws://localhost:3001
[LiveRecording]    - VITE_WS_URL: ws://localhost:3001
```

#### Al hacer clic en "Iniciar":
```
[LiveRecording] 🚀 Iniciando sesión...
[WebSocket] 🔌 Iniciando conexión...
[WebSocket] ✅ CONECTADO exitosamente
[LiveRecording] ✅ Sesión iniciada. Scan ID: XX
[CameraView] 🎬 Streaming iniciado a 2 fps
```

#### Cada 500ms (2 fps) deberías ver:
```
[CameraService] 📸 Frame 1 capturado - Tamaño: XXX KB
[LiveRecording] 🎯 handleFrameCapture llamado
[LiveRecording] 📊 Estado: {isRecording: true, isPaused: false}
[LiveRecording] 📸 Frame 1 capturado a las XX:XX:XX
[LiveRecording] 🔍 Datos del frame: {frameId: "...", scanId: XX, ...}
[WebSocket] 📤 Enviando frame al backend: {...}
[WebSocket] ✅ Frame emitido exitosamente
[LiveRecording] 📡 Frame 1 ENVIADO al backend vía WebSocket
```

#### Si hay producto detectado:
```
[WebSocket] 🎯 Producto detectado: Coca-Cola 350ml
[LiveRecording] ✅ Producto detectado: Coca-Cola 350ml (92%)
```

---

## 🔍 QUÉ BUSCAR

### SI NO VES LOGS DE CAPTURA:

**Problema:** CameraService no está capturando frames

**Busca en consola:**
```
[CameraService] 🎬 Iniciando captura con intervalo: 500 ms
[CameraService] 📸 Frame X capturado
```

**Si NO aparecen:** El problema está en la inicialización de la cámara.

---

### SI VES CAPTURA PERO NO ENVÍO:

**Problema:** handleFrameCapture no se está llamando

**Busca en consola:**
```
[LiveRecording] 🎯 handleFrameCapture llamado
[LiveRecording] 📊 Estado: {...}
```

**Si NO aparecen:** El callback `onFrame` no está conectado.

---

### SI VES ENVÍO PERO NO LLEGA AL BACKEND:

**Problema:** WebSocket no está enviando o backend no recibe

**Busca en consola:**
```
[WebSocket] 📤 Enviando frame al backend
[WebSocket] ✅ Frame emitido exitosamente
```

**Luego verifica logs del backend:**
```bash
tail -f logs/backend.log
```

**Deberías ver:**
```
[WS] 📥 Frame recibido del cliente
[WS] 📊 Datos del frame: {scanId: XX, ...}
```

---

### SI LLEGA AL BACKEND PERO NO LLAMA A GEMINI:

**Busca en backend logs:**
```
[WS] ✅ Scan válido, obteniendo catálogo...
[WS] 📦 Productos en catálogo: 8
[WS] 🤖 Llamando a Gemini para análisis...
```

**Si NO aparece "Llamando a Gemini":** El problema está en la validación del scan o catálogo.

---

### SI LLAMA A GEMINI PERO NO HAY RESPUESTA:

**Busca en backend logs:**
```
[Gemini] 🚀 Iniciando análisis con Gemini API
[Gemini] 📡 Enviando request a: https://...
[Gemini] 📥 Response status: 200
[Gemini] 📦 JSON response: {...}
[Gemini] 📄 Texto extraído: ...
[Gemini] 🔍 Parsed result: {...}
```

**Si hay error 400/403/etc:** Problema con la API key o modelo.

---

## 🎯 CASOS COMUNES

### Caso 1: No se capturan frames

**Logs esperados:**
```
[CameraView] 🎬 Streaming iniciado a 2 fps
[CameraService] 🎬 Iniciando captura con intervalo: 500 ms
```

**Si faltan:** Problema en `startCapture()`

---

### Caso 2: Se capturan pero no se envían

**Logs esperados:**
```
[CameraService] 📸 Frame 1 capturado
[LiveRecording] 🎯 handleFrameCapture llamado
[LiveRecording] 📡 Frame 1 ENVIADO
```

**Si falta el envío:** `isRecording` podría ser false

---

### Caso 3: Se envían pero backend no los recibe

**Frontend logs:**
```
[WebSocket] ✅ Frame emitido exitosamente
```

**Backend logs (debería aparecer):**
```
[WS] 📥 Frame recibido del cliente
```

**Si no aparece en backend:** Problema de WebSocket

---

### Caso 4: Backend recibe pero Gemini no detecta

**Backend logs:**
```
[Gemini] 📥 Response status: 200
[Gemini] 🔍 Parsed result: {detected: false}
```

**Razones:**
- Producto no visible claramente
- Confidence < 0.70
- Gemini no reconoce el producto

---

## 📝 INFORMACIÓN QUE NECESITO

**Por favor, copia y pega:**

### 1. Logs de la consola del navegador (F12)

Desde que haces clic en "Iniciar" hasta que muestras el producto.

### 2. Logs del backend

```bash
tail -n 100 logs/backend.log
```

Ejecuta este comando y copia la salida.

---

## 🔧 COMANDOS ÚTILES

### Ver logs del backend en tiempo real:
```bash
tail -f logs/backend.log
```

### Ver logs del frontend en tiempo real:
```bash
tail -f logs/webcam.log
```

### Verificar que todo esté corriendo:
```bash
./verify-system.sh
```

---

## ⚡ ACCIÓN RÁPIDA

**HAZLO AHORA:**

1. Cierra el navegador completamente
2. Ábrelo en modo incógnito
3. Ve a http://localhost:3002/
4. Abre consola (F12)
5. Haz clic en "Iniciar Streaming"
6. **Copia TODOS los logs que aparezcan**
7. Muestra un producto a la cámara
8. Espera 3 segundos
9. **Copia TODOS los logs nuevos**
10. Ejecuta: `tail -n 100 logs/backend.log`
11. **Copia la salida**

**ENVÍAME:**
- Logs de consola del navegador (pasos 6 y 9)
- Logs del backend (paso 10)

---

## 🎯 RESULTADO ESPERADO

Si TODO funciona correctamente, deberías ver este flujo:

**Frontend:**
```
[CameraService] 📸 Frame 1 capturado - Tamaño: 45 KB
[LiveRecording] 🎯 handleFrameCapture llamado
[LiveRecording] 📡 Frame 1 ENVIADO al backend
[WebSocket] 📤 Enviando frame al backend
[WebSocket] ✅ Frame emitido exitosamente
```

**Backend:**
```
[WS] 📥 Frame recibido del cliente
[WS] 📊 Datos del frame: {scanId: 55, ...}
[WS] ✅ Scan válido
[WS] 📦 Productos en catálogo: 8
[WS] 🤖 Llamando a Gemini
[Gemini] 🚀 Iniciando análisis
[Gemini] 📡 Enviando request
[Gemini] 📥 Response status: 200
[Gemini] 🔍 Parsed result: {detected: true, product_name: "Coca-Cola 350ml", ...}
[WS] 🎯 Producto detectado: Coca-Cola 350ml
```

---

**¡Los logs te dirán EXACTAMENTE dónde está el problema! 🔍**

