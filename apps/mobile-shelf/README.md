# Mobile Shelf App

Aplicación React Native (Expo) para captura automática de imágenes de repisas en trolleys de catering aéreo.

**⚠️ NOTA**: Este directorio NO contiene código fuente. Esta documentación describe conceptualmente la aplicación móvil del sistema Smart Trolley.

---

## Propósito

Capturar automáticamente imágenes de una repisa cada 5 segundos y enviarlas al backend para análisis con Vision LLM.

---

## Características Principales

- ✅ **Captura automática** cada 5 segundos con timer
- ✅ **Compresión de imágenes** a JPEG 1280px, quality 80%
- ✅ **Upload a backend** vía POST multipart/form-data
- ✅ **Cola offline** para reintentos cuando no hay conectividad
- ✅ **Configuración vía QR** code (shelf_id, trolley_id, flight_id)
- ✅ **Kiosk mode** para evitar cierre accidental
- ✅ **Keep awake** para operación continua

---

## Stack Tecnológico (Conceptual)

- **Framework**: React Native con Expo
- **Cámara**: `expo-camera`
- **Compresión**: `expo-image-manipulator`
- **QR Scanner**: `expo-barcode-scanner`
- **Storage local**: `AsyncStorage`
- **Keep awake**: `expo-keep-awake`
- **Networking**: `fetch` API

---

## Flujo de Uso

### 1. Configuración Inicial

```
[Primera apertura]
  ↓
[Pantalla: "Escanear QR de esta Shelf"]
  ↓
[Operador escanea QR en repisa]
  ↓
[App guarda: shelf_id, trolley_id, flight_id]
  ↓
[Pantalla: "✅ Configuración exitosa"]
  ↓
[Pantalla principal: Vista de cámara + status]
```

### 2. Operación Continua

```
[Timer cada 5000ms]
  ↓
[Capturar foto con cámara trasera]
  ↓
[Comprimir a JPEG 1280px, quality 80%]
  ↓
[Preparar FormData con metadata]
  ↓
[POST /api/scan]
  ↓
¿Éxito?
  ├─ Sí → [Continuar]
  └─ No → [Guardar en cola offline]
             ↓
           [Reintentar cada 30s]
```

---

## Configuración

### Variables de Entorno

Ver [Variables de Entorno](../../docs/setup/env-variables.md) para la lista completa.

**Archivo**: `.env`

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001/api
EXPO_PUBLIC_SCAN_INTERVAL_MS=5000
EXPO_PUBLIC_IMAGE_QUALITY=0.80
EXPO_PUBLIC_IMAGE_MAX_WIDTH=1280
```

**Nota**: Usar IP local de la red WiFi, NO `localhost`.

---

## Estructura de Datos

### Scan Payload

```typescript
{
  image: File (JPEG),
  flight_id: number,
  trolley_id: number,
  shelf_id: number,
  captured_by: string (username)
}
```

### Configuración en AsyncStorage

```json
{
  "shelf_id": 1,
  "trolley_id": 456,
  "flight_id": 123,
  "position": "top"
}
```

---

## Pantallas

### 1. QR Scanner Screen

- Activa cámara frontal o trasera
- Detecta QR code con formato JSON
- Valida estructura y guarda en AsyncStorage
- Navega a Main Screen

### 2. Main Screen (Operación)

```
┌──────────────────────────────┐
│ Smart Trolley - Shelf Scan   │
├──────────────────────────────┤
│ Flight: AA2345               │
│ Trolley: TRLLY-001           │
│ Shelf: Top (1/3)             │
│                              │
│ [  Vista de Cámara (live)  ] │
│                              │
│ Status: 🟢 Operativo         │
│ Scans enviados: 142          │
│ Pendientes: 0                │
│                              │
│ Próximo scan en: 3s          │
└──────────────────────────────┘
```

---

## Manejo de Errores

### Error de Red

```javascript
try {
  await fetch(`${API_URL}/scan`, { method: 'POST', body: formData });
} catch (error) {
  // Guardar en cola offline
  await saveToOfflineQueue({ image, metadata });
  // Actualizar UI: "⚠️ Offline - 1 scan pendiente"
}
```

### Cola Offline Llena

- Límite: 50 scans
- Política: FIFO (eliminar más antiguo si se llena)
- Alerta visual: "🔴 Cola llena - Verificar conectividad"

---

## Testing

### Pruebas Manuales

1. **Captura**: Verificar que se toma foto cada 5s
2. **Compresión**: Verificar tamaño ~200-400 KB
3. **Upload**: Ver scan nuevo en dashboard
4. **Offline**: Desconectar WiFi, verificar que guarda en cola
5. **Reconexión**: Conectar WiFi, verificar que envía scans pendientes

### Métricas de Éxito

- ✅ Captura exitosa cada 5s (±500ms)
- ✅ Tamaño de imagen: 200-400 KB
- ✅ Upload exitoso >95% del tiempo
- ✅ Cola offline retiene hasta 50 scans

---

## Deployment

### Build de APK

```bash
# Desarrollo (Expo Go)
npx expo start

# Producción (APK standalone)
eas build --platform android --profile production
```

### Instalación en Dispositivos

1. Transferir APK vía USB o link
2. Habilitar "Instalar apps de fuentes desconocidas"
3. Instalar APK
4. Abrir app y escanear QR de configuración
5. Verificar captura automática

---

## Troubleshooting

### App no captura imágenes

- Verificar permisos de cámara en Settings
- Verificar que timer esté activo
- Revisar logs en consola de Expo

### Upload falla constantemente

- Verificar `EXPO_PUBLIC_API_URL` es correcto
- Ping al backend: `curl http://<IP>:3001/health`
- Verificar que backend acepta multipart/form-data

### Batería se agota rápido

- Reducir brillo de pantalla
- Usar power bank de mayor capacidad
- Reducir frecuencia de scan a 10s (temporal)

---

## Referencias

- [Mobile Expo Setup](../../docs/setup/mobile-expo-setup.md) — Guía completa de configuración
- [Variables de Entorno](../../docs/setup/env-variables.md) — Configuración de API_URL
- [Contratos de API](../../docs/api/contracts.md) — Especificación del endpoint POST /scan
- [Hardware Mounting](../../docs/ops/hardware-mounting.md) — Montaje físico de teléfonos

