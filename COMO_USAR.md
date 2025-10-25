# 🎯 CÓMO USAR EL SISTEMA

## ✅ SISTEMA LIMPIO Y FUNCIONAL

**Branch**: `api-streaming-functional`  
**Objetivo**: Detección en tiempo real con Gemini Robotics-ER 1.5

---

## 🚀 INICIO RÁPIDO (3 pasos)

### 1. Ejecutar el sistema
```bash
./start.sh
```

### 2. Abrir en navegador
```
http://localhost:3002/
```

### 3. Hacer clic en "▶ Iniciar Streaming"

¡Listo! El sistema detectará productos automáticamente.

---

## 🥤 PROBAR CON PRODUCTOS

Muestra a la cámara:
- 🥤 Coca-Cola (lata roja)
- 🥤 Sprite (lata verde)  
- 🥤 Pepsi (lata azul)
- 🍟 Lays (bolsa amarilla)
- 🌮 Doritos (bolsa roja)

La detección aparecerá en 1-2 segundos.

---

## 📊 LO QUE SE IMPLEMENTÓ

### ✅ Limpieza Masiva:
- Eliminados 20+ archivos .md de troubleshooting
- Eliminadas carpetas viejas de docs/
- Eliminado /apps/mobile-shelf/
- Solo código funcional

### ✅ Backend (apps/api/):
- Gemini Robotics-ER 1.5 REST API (forzado)
- Prompt optimizado para COLOR + FORMA + TEXTO
- WebSocket sin autenticación obligatoria
- Auto-manejo de IDs inexistentes
- 8 productos en base de datos

### ✅ Web Camera (apps/web-camera/):
- UI simplificada (solo Iniciar/Detener)
- Streaming automático a 2 fps
- WebSocket server-side processing
- Sin botones de "Foto Manual"
- Detección continua automática

---

## 🔧 ARQUITECTURA FINAL

```
Web Camera (http://localhost:3002)
  ↓ WebSocket @ 2 fps
Backend API (http://localhost:3001)
  ↓ REST API v1beta
Gemini Robotics-ER 1.5
  ↓ JSON
Database (Neon PostgreSQL)
  ↓ WebSocket
Web Camera UI actualiza
```

**Latencia**: ~1-2 segundos ⚡

---

## 🎬 FLUJO AUTOMÁTICO

1. Usuario hace clic en "Iniciar"
2. WebSocket conecta
3. Sesión se crea (auto-maneja trolley/operator)
4. Cámara inicia a 2 fps
5. Frames se envían automáticamente
6. Gemini analiza cada frame
7. Detecciones aparecen automáticamente

**TODO automático después del clic inicial** ✅

---

## 🐛 SI ALGO NO FUNCIONA

### Backend no responde:
```bash
curl http://localhost:3001
# Debe retornar JSON con "status":"ok"
```

### Web app no carga:
```bash
curl http://localhost:3002
# Debe retornar HTML
```

### Reiniciar todo:
```bash
pkill -f nodemon && pkill -f vite
./start.sh
```

---

## 📝 ARCHIVOS IMPORTANTES

### Backend:
- `apps/api/services/geminiService.js` - Integración Gemini
- `apps/api/routes/videoStream.js` - WebSocket handlers
- `apps/api/.env` - Variables de entorno

### Web App:
- `apps/web-camera/src/pages/LiveRecording.tsx` - Página principal
- `apps/web-camera/src/services/websocketService.ts` - Cliente WS
- `apps/web-camera/.env` - Variables de entorno

---

## ✅ ESTADO ACTUAL

**Servicios**: 🟢 Corriendo  
**Backend**: http://localhost:3001  
**Web App**: http://localhost:3002  
**Documentación**: ✅ Limpia  
**Código**: ✅ Solo lo esencial  

---

## 🎯 SIGUIENTE PASO

**ABRE EN TU NAVEGADOR**:
```
http://localhost:3002/
```

**HAZ CLIC EN**: "▶ Iniciar Streaming"

**MUESTRA**: Una Coca-Cola a la cámara

**VE**: La detección aparecer en 1-2 segundos

---

**TODO LISTO** 🚀

Sistema 100% enfocado en **REALTIME** con toda la basura eliminada.

