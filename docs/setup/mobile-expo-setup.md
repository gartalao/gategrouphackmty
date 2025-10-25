# Setup de Mobile App (Expo React Native)

Guía conceptual para la configuración de la aplicación móvil Android que captura imágenes de las repisas.

**Nota**: Este documento es solo documentación. No contiene código real.

---

## Resumen de la App

**Propósito**: Capturar automáticamente imágenes de una repisa cada 5 segundos y enviarlas al backend.

**Características clave**:
- ✅ Modo quiosco (kiosk mode) — la app no se puede cerrar
- ✅ Captura automática con timer
- ✅ Compresión de imágenes en el dispositivo
- ✅ Cola offline con reintentos
- ✅ Configuración vía QR code

---

## Requisitos de Hardware

### Teléfonos Android

**Especificaciones mínimas**:
- Android 8.0+ (API level 26+)
- Cámara trasera de 8 MP o superior
- 2 GB RAM
- 16 GB almacenamiento interno
- WiFi 802.11n o superior

**Teléfonos recomendados** (usados/retirados):
- Samsung Galaxy S7/S8 ($50-100 USD usado)
- Motorola G6/G7 ($60-120 USD usado)
- Xiaomi Redmi Note 7/8 ($80-150 USD usado)

**Total necesario**: 3 teléfonos × $100 promedio = **$300 USD** (reutilizando hardware corporativo = $0)

---

### Power Banks

**Especificaciones**:
- Capacidad: ≥10,000 mAh
- Output: 5V/2A mínimo
- Cable: USB-A a Micro-USB o USB-C (según teléfono)

**Duración estimada**:
- Consumo de app: ~300 mAh/hora
- Power bank de 10,000 mAh: ~30+ horas de operación continua

**Recomendados**:
- Anker PowerCore 10000
- Xiaomi Mi Power Bank 3
- Aukey PB-N36

---

## Permisos de Android Requeridos

Configuración en `app.json` (conceptual):

```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WAKE_LOCK"
      ]
    }
  }
}
```

### Descripción de Permisos

| Permiso | Propósito |
|---------|-----------|
| `CAMERA` | Capturar fotos con cámara trasera |
| `WRITE_EXTERNAL_STORAGE` | Guardar imágenes comprimidas temporalmente |
| `READ_EXTERNAL_STORAGE` | Leer imágenes para upload |
| `INTERNET` | Enviar scans al backend via HTTP |
| `ACCESS_NETWORK_STATE` | Detectar si hay WiFi/4G disponible |
| `WAKE_LOCK` | Mantener pantalla/CPU activa durante operación |

---

## Modo Quiosco (Kiosk Mode)

**Objetivo**: Evitar que el operador cierre o salga de la app accidentalmente.

### Estrategias de Implementación

#### 1. Expo Keep Awake

Mantiene la pantalla encendida:

```javascript
import { activateKeepAwakeAsync, deactivateKeepAwakeAsync } from 'expo-keep-awake';

// Al iniciar la app
activateKeepAwakeAsync();
```

#### 2. Navigation Lock

Evitar que el botón "Atrás" cierre la app:

```javascript
import { BackHandler } from 'react-native';

useEffect(() => {
  const backAction = () => {
    // No hacer nada (bloquear)
    return true;
  };
  
  const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
  return () => backHandler.remove();
}, []);
```

#### 3. Modo Quiosco del Sistema (Avanzado)

Configuración manual en Android:
1. Settings → Developer Options → "Stay Awake" (ON)
2. Usar app de terceros como "Kiosk Browser" o "SureLock"
3. Configurar la app Smart Trolley como app única permitida

---

## Lógica de Captura Automática

### Timer de 5 Segundos

**Conceptualmente**:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    await captureAndUpload();
  }, 5000);  // 5 segundos
  
  return () => clearInterval(interval);
}, []);
```

### Función de Captura

**Pasos**:
1. Activar cámara trasera
2. Capturar foto en alta resolución
3. Comprimir a JPEG 80%, max 1280px
4. Intentar upload inmediato
5. Si falla, guardar en cola offline

**Pseudocódigo**:

```javascript
async function captureAndUpload() {
  try {
    // 1. Capturar
    const photo = await camera.takePictureAsync({
      quality: 1.0,  // Máxima calidad inicial
      skipProcessing: false
    });
    
    // 2. Comprimir
    const compressed = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.80, format: 'jpeg' }
    );
    
    // 3. Preparar FormData
    const formData = new FormData();
    formData.append('image', {
      uri: compressed.uri,
      type: 'image/jpeg',
      name: 'scan.jpg'
    });
    formData.append('flight_id', flightId);
    formData.append('trolley_id', trolleyId);
    formData.append('shelf_id', shelfId);
    formData.append('captured_by', username);
    
    // 4. Upload
    const response = await fetch(`${API_URL}/scan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      timeout: 10000  // 10s timeout
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    // 5. Success
    const data = await response.json();
    console.log('Scan uploaded:', data.scan_id);
    
  } catch (error) {
    // 6. Error → cola offline
    await saveToOfflineQueue(compressed.uri, metadata);
  }
}
```

---

## Compresión de Imagen

### Configuración Recomendada

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| **Format** | JPEG | Mejor compresión que PNG |
| **Quality** | 0.80 | Balance calidad/tamaño |
| **Max Width** | 1280px | Suficiente para Vision LLM |
| **Max Height** | Auto (proporcional) | Mantener aspect ratio |

### Tamaños Esperados

**Antes de compresión**:
- Resolución: 3024 × 4032 px (típico de 12 MP)
- Tamaño: 2-4 MB

**Después de compresión**:
- Resolución: 1280 × 1707 px
- Tamaño: 200-400 KB

**Reducción**: ~85-90%

---

## Configuración por QR Code

### Flujo de Configuración Inicial

1. **Primera apertura** de la app → Mostrar pantalla "Escanear QR de Shelf"
2. Operador **escanea QR** pegado en la repisa
3. QR contiene JSON:
   ```json
   {
     "shelf_id": 1,
     "trolley_id": 456,
     "flight_id": 123,
     "position": "top"
   }
   ```
4. App guarda configuración en **AsyncStorage**
5. Muestra pantalla de confirmación:
   ```
   ✅ Configuración exitosa
   
   Flight: AA2345
   Trolley: TRLLY-001
   Shelf: Top (1/3)
   
   Status: Listo para operar
   ```

### Generación de QR Codes

**Herramienta**: [qr-code-generator.com](https://www.qr-code-generator.com) o similar

**Contenido** (ejemplo para Shelf 1):
```json
{"shelf_id":1,"trolley_id":456,"flight_id":123,"position":"top"}
```

**Imprimir**:
- Tamaño: 5×5 cm
- Material: Laminado resistente al agua
- Ubicación: Esquina superior derecha de cada repisa

---

## Estrategia de Cola Offline

### ¿Por Qué Cola Offline?

**Problema**: WiFi intermitente en almacén puede causar pérdida de scans.

**Solución**: Guardar scans fallidos localmente y reintentar automáticamente.

### Mecanismo de Cola

**Almacenamiento**: AsyncStorage de React Native

**Estructura de un item en cola**:
```json
{
  "id": "scan_local_1234",
  "image_uri": "file:///data/user/0/.../image_123.jpg",
  "metadata": {
    "flight_id": 123,
    "trolley_id": 456,
    "shelf_id": 1,
    "captured_at": "2025-10-26T10:15:30Z",
    "retry_count": 0,
    "last_retry_at": null
  }
}
```

### Lógica de Reintentos

**Conceptualmente**:

```javascript
// Background task que corre cada 30 segundos
useEffect(() => {
  const retryInterval = setInterval(async () => {
    const queue = await AsyncStorage.getItem('pending_scans');
    const pendingScans = JSON.parse(queue || '[]');
    
    for (const scan of pendingScans) {
      if (scan.retry_count >= 3) {
        // Descartar después de 3 intentos
        await removeScanFromQueue(scan.id);
        continue;
      }
      
      try {
        await uploadScan(scan);
        await removeScanFromQueue(scan.id);  // Éxito
      } catch (error) {
        // Incrementar retry_count
        scan.retry_count++;
        scan.last_retry_at = new Date().toISOString();
        await updateScanInQueue(scan);
      }
    }
  }, 30000);  // Cada 30 segundos
  
  return () => clearInterval(retryInterval);
}, []);
```

### Límites de Cola

- **Máximo items**: 50 scans
- **Política**: FIFO (First In, First Out)
- **Cuando se llena**: Eliminar el más antiguo antes de agregar nuevo

---

## Interfaz de Usuario (UI)

### Pantalla Principal

**Elementos**:

```
┌──────────────────────────────────────┐
│  Smart Trolley - Shelf Scan          │
│                                      │
│  Flight: AA2345                      │
│  Trolley: TRLLY-001                  │
│  Shelf: Top (1/3)                    │
│                                      │
│  [        Vista de Cámara          ] │
│  [                                 ] │
│  [                                 ] │
│  [                                 ] │
│  [                                 ] │
│                                      │
│  Status: 🟢 Operativo                │
│  Scans enviados hoy: 142             │
│  Pendientes: 0                       │
│                                      │
│  Próximo scan en: 3s                 │
└──────────────────────────────────────┘
```

### Indicadores Visuales

| Indicador | Color | Significado |
|-----------|-------|-------------|
| 🟢 Verde | Status OK | Conectado, operando normalmente |
| 🟡 Amarillo | Advertencia | Cola offline activa (1-10 scans pendientes) |
| 🔴 Rojo | Error | Sin conexión, cola llena (>10 scans) |
| 🔋 Batería | Dinámico | Nivel de batería del dispositivo |

---

## Persistencia de Estado

### Datos Almacenados en AsyncStorage

| Key | Valor | Propósito |
|-----|-------|-----------|
| `shelf_config` | JSON de configuración | Flight, trolley, shelf IDs |
| `auth_token` | JWT token | Autenticación con backend |
| `pending_scans` | Array de scans | Cola offline |
| `stats_today` | Contadores | Scans enviados, errores, etc. |
| `last_sync_at` | Timestamp | Última sincronización exitosa |

### Limpieza de Datos

- **Al inicio del día**: Resetear `stats_today`
- **Después de 24h**: Eliminar scans de cola offline
- **Al cambiar de flight**: Limpiar configuración anterior

---

## Pruebas y Debugging

### Modo de Prueba (Test Mode)

**Activación**: Tocar 5 veces el logo de la app

**Funcionalidades**:
- Ver logs en pantalla
- Forzar scan manual (botón visible)
- Ver cola offline completa
- Simular errores de red
- Cambiar intervalo de scan (1s para testing)

### Logs a Implementar

```javascript
console.log('[SCAN] Iniciando captura...');
console.log('[SCAN] Imagen capturada: 1280x960, 342 KB');
console.log('[UPLOAD] Enviando a backend...');
console.log('[UPLOAD] ✅ Éxito, scan_id: 789');
console.log('[QUEUE] Agregado a cola offline (total: 3)');
console.log('[QUEUE] Reintento 1/3 para scan_local_1234');
```

---

## Seguridad y Privacidad

### Consideraciones

1. **Imágenes locales**: Borrar después de upload exitoso
2. **Token JWT**: Almacenar en AsyncStorage de forma segura
3. **HTTPS**: Usar solo conexiones seguras en producción
4. **Sin data personal**: Las imágenes solo contienen productos, no personas

---

## Build y Distribución

### Build de APK para Android

**Comando** (conceptual):
```bash
eas build --platform android --profile production
```

**Alternativa sin cuenta de Expo**:
```bash
expo build:android
```

### Instalación en Teléfonos

**Opción 1**: Expo Go (para desarrollo)
- Instalar "Expo Go" desde Google Play
- Escanear QR code de `npx expo start`

**Opción 2**: APK directo (para producción)
- Transferir APK via USB o link
- Habilitar "Instalar apps de fuentes desconocidas"
- Instalar APK

---

## Checklist de Setup

- [ ] Instalar Node.js y npm
- [ ] Instalar Expo CLI: `npm install -g expo-cli`
- [ ] Crear proyecto: `npx create-expo-app mobile-shelf`
- [ ] Instalar dependencias: Camera, ImageManipulator, KeepAwake
- [ ] Configurar permisos en `app.json`
- [ ] Implementar lógica de captura automática
- [ ] Implementar cola offline
- [ ] Implementar lectura de QR para configuración
- [ ] Implementar UI con status indicators
- [ ] Probar en dispositivo físico Android
- [ ] Generar APK de producción
- [ ] Instalar en 3 teléfonos
- [ ] Configurar cada teléfono con su QR de shelf

---

## Troubleshooting

### Error: "Camera permission denied"

**Solución**: Ir a Settings → Apps → Smart Trolley → Permissions → Habilitar "Camera"

### Error: "Network request failed"

**Causa**: IP incorrecta en `EXPO_PUBLIC_API_URL`

**Solución**: Usar IP local de WiFi (ej: `192.168.1.100`), no `localhost`

### App se cierra al presionar botón Atrás

**Solución**: Implementar handler de `BackHandler` para bloquear

---

## Referencias

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [Variables de Entorno](env-variables.md) — Configuración de API_URL
- [Contratos de API](../api/contracts.md) — Endpoint POST /scan

