# Montaje de Hardware

Guía para el montaje físico de teléfonos Android en trolleys y configuración de kiosk mode.

## Materiales Necesarios

### Por Trolley (3 Shelves)

| Item | Cantidad | Costo Unitario | Costo Total |
|------|----------|----------------|-------------|
| Smartphone Android usado | 3 | $100 | $300 |
| Power bank 10,000 mAh | 3 | $20 | $60 |
| Soporte ajustable para teléfono | 3 | $15 | $45 |
| Cable USB (Micro-USB o USB-C) | 6 | $5 | $30 |
| Cinta adhesiva de doble cara 3M | 1 rollo | $10 | $10 |
| Tiras LED 5V USB con difusor | 3m | $25 | $25 |
| Etiquetas QR impresas laminadas | 3 | $2 | $6 |
| **TOTAL POR TROLLEY** | | | **$476** |

**Para 3 trolleys**: ~$1,428 USD

**Alternativa económica**: Reutilizar smartphones corporativos retirados → **Costo real: ~$150/trolley**

---

## Diseño de Montaje

### Vista Lateral del Trolley

```
┌─────────────────────────────────┐
│   📱 Teléfono (Shelf 1 - Top)   │ ← Soporte ajustable
│   ╔═════════════════════╗       │
│   ║  [  Shelf 1  ]      ║       │ ← Repisa con productos
│   ╚═════════════════════╝       │
│                                 │
│   📱 Teléfono (Shelf 2 - Mid)   │
│   ╔═════════════════════╗       │
│   ║  [  Shelf 2  ]      ║       │
│   ╚═════════════════════╝       │
│                                 │
│   📱 Teléfono (Shelf 3 - Bot)   │
│   ╔═════════════════════╗       │
│   ║  [  Shelf 3  ]      ║       │
│   ╚═════════════════════╝       │
│                                 │
│   🔋 Power Banks (lateral)      │
└─────────────────────────────────┘
```

### Vista Frontal de una Shelf

```
      📱 Teléfono
      ↓
┌─────[Cámara]─────┐
│      ↓           │
│   ┌─────────────┐│
│   │QR  Productos││ ← Shelf
│   │📋  🥤🥤🥤   ││
│   └─────────────┘│
└──────────────────┘

Campo de visión (FOV): ~90°
Distancia: 30-40 cm
```

---

## Paso a Paso: Montaje de Teléfono

### 1. Seleccionar Posición del Soporte

**Ubicación ideal**:
- **Lado derecho o izquierdo** de la repisa (no centro, para no obstruir acceso)
- **Altura**: Alineado con el centro vertical de la repisa
- **Distancia**: 30-40 cm desde la repisa

**Criterios**:
- La cámara debe apuntar **perpendicular** a la repisa (ángulo 90°)
- Debe cubrir **toda el área** de la repisa sin recortes
- No debe obstruir el movimiento del operador

---

### 2. Instalar el Soporte

**Tipo de soporte recomendado**: Brazo flexible con pinza o adhesivo

**Opciones**:

#### Opción A: Soporte con Pinza
- Ajustar pinza al borde del marco del trolley
- Ventaja: No daña el trolley, fácil de remover
- Desventaja: Puede aflojarse con vibración

#### Opción B: Soporte Adhesivo 3M
- Limpiar superficie del trolley con alcohol
- Aplicar cinta adhesiva de doble cara 3M VHB
- Presionar firmemente por 30 segundos
- Esperar 24h para adherencia máxima
- Ventaja: Muy estable, soporta vibraciones
- Desventaja: Difícil de remover sin dejar residuo

**Recomendación**: Opción B (adhesivo) para instalación permanente, Opción A (pinza) para pruebas temporales.

---

### 3. Montar el Teléfono

**Pasos**:
1. Colocar el teléfono en el soporte (orientación **vertical** u **horizontal** según FOV)
2. Ajustar ángulo de la cámara:
   - Apuntar directamente al **centro de la repisa**
   - Verificar FOV con la app de cámara (preview)
3. Asegurar tornillos o clips del soporte
4. Probar estabilidad (sacudir suavemente el trolley, no debe moverse)

**Orientación recomendada**: **Horizontal (landscape)** para mejor FOV de repisas anchas

---

### 4. Conectar Power Bank

**Ubicación del power bank**: Lateral del trolley (bolsillo o pegado con velcro)

**Conexión**:
1. Conectar cable USB del power bank al teléfono
2. Verificar que el teléfono esté **cargando** (icono de batería)
3. Habilitar "Carga rápida" en settings del teléfono (si está disponible)

**Gestión de cables**:
- Usar **clips adhesivos** para fijar cable al marco del trolley
- Evitar cables sueltos que puedan enredarse
- Dejar **holgura suficiente** para vibración durante movimiento

---

### 5. Verificar Campo de Visión (FOV)

**Proceso**:
1. Abrir app de cámara en el teléfono
2. Verificar que se vea **toda la repisa** en el preview
3. Colocar productos de prueba en las esquinas de la repisa
4. Verificar que aparezcan en el preview
5. Ajustar ángulo si es necesario

**Herramienta**: Regla o cinta métrica para asegurar distancia uniforme

---

## Kiosk Mode (Modo Quiosco)

### Objetivo

Prevenir que el teléfono sea usado para otros propósitos o que la app se cierre accidentalmente.

### Configuración en Android

#### Método 1: Modo Kiosk Nativo (Android 9+)

**Pasos**:
1. Ir a **Settings → Developer Options**
2. Habilitar **"Stay Awake"** (pantalla siempre encendida cuando conectada)
3. Habilitar **"USB Debugging"** (opcional, para desarrollo)
4. Usar app de terceros como **"Fully Kiosk Browser"** o **"SureLock"**

**Con Fully Kiosk Browser** (recomendado):
1. Descargar desde Google Play
2. Configurar como "Launcher" (iniciador) por defecto
3. Configurar para abrir app Smart Trolley al inicio
4. Habilitar "Lock Settings" para evitar salir
5. Deshabilitar botones de navegación

---

#### Método 2: App Launcher Custom

**Concepto**: Crear una app launcher mínima que solo abre Smart Trolley app

**Ventajas**: Control total sobre qué se puede hacer

**Desventajas**: Requiere desarrollo adicional

---

#### Método 3: Manual Pin (Simple pero Funcional)

**Android Task Pinning**:
1. Abrir Smart Trolley app
2. Presionar botón "Recientes" (⎵ o ▦)
3. Tocar ícono de la app → **"Pin"** o **"Anclar"**
4. Ahora la app no se puede cerrar sin PIN

**Desactivar**: Presionar "Atrás" + "Recientes" simultáneamente, ingresar PIN

**PIN sugerido**: 1234 (compartir con equipo)

---

## Iluminación con LED

Ver [Iluminación y FOV](lighting-and-fov.md) para detalles completos.

**Resumen de montaje**:
1. Pegar tira LED en la **parte inferior** del shelf superior (apuntando hacia abajo)
2. Conectar a power bank via USB
3. Usar **difusor de silicona** para evitar reflejos directos
4. Intensidad: ~500-800 lumens (ajustable con dimmer si está disponible)

---

## Etiquetado QR

Ver [Etiquetado QR](qr-labeling.md) para detalles completos.

**Resumen**:
- Imprimir QR codes con `shelf_id` codificado
- Laminar (resistente al agua/grasa)
- Pegar en **esquina superior derecha** de cada repisa
- Tamaño: 5×5 cm

---

## Checklist de Montaje por Trolley

### Hardware
- [ ] 3 smartphones Android cargados al 100%
- [ ] 3 power banks cargados al 100%
- [ ] 3 soportes ajustables instalados
- [ ] 3 cables USB conectados
- [ ] Cables asegurados con clips
- [ ] Tiras LED instaladas y funcionando
- [ ] 3 etiquetas QR pegadas

### Software
- [ ] Smart Trolley app instalada en los 3 teléfonos
- [ ] Cada app configurada con su `shelf_id` (vía QR o manual)
- [ ] Kiosk mode habilitado en los 3 teléfonos
- [ ] "Stay Awake" habilitado
- [ ] WiFi configurado y conectado
- [ ] Prueba de captura: Al menos 1 scan exitoso por teléfono

### Pruebas
- [ ] Captura de imagen: Imagen clara y sin blur
- [ ] FOV: Toda la repisa visible
- [ ] Upload: Scan llega al backend (verificar en dashboard)
- [ ] Iluminación: Sin reflejos, productos claramente visibles
- [ ] Estabilidad: Soportes no se mueven al empujar trolley

---

## Mantenimiento

### Diario
- [ ] Verificar nivel de batería de power banks (recargar si <20%)
- [ ] Limpiar lente de cámara con paño de microfibra
- [ ] Verificar que apps estén funcionando (check dashboard)

### Semanal
- [ ] Reajustar soportes si se han aflojado
- [ ] Limpiar superficies adhesivas si acumulan polvo
- [ ] Actualizar app móvil si hay nueva versión

### Mensual
- [ ] Revisar cables USB por desgaste
- [ ] Reemplazar etiquetas QR si están dañadas
- [ ] Prueba de stress: Mover trolley por el almacén y verificar estabilidad

---

## Troubleshooting

### Problema: Imagen borrosa (motion blur)

**Causa**: Teléfono vibra durante captura

**Solución**:
- Reforzar soporte con adhesivo adicional
- Usar soporte más rígido (metal vs plástico)
- Capturar imagen solo cuando trolley esté detenido (implementar detección de movimiento en app)

---

### Problema: FOV no cubre toda la repisa

**Causa**: Ángulo de cámara incorrecto o distancia muy corta/larga

**Solución**:
- Alejar teléfono 5-10 cm
- Ajustar ángulo hacia arriba/abajo
- Usar cámara gran angular (si el teléfono tiene multiple cámaras)

---

### Problema: Power bank se descarga rápido (<8h)

**Causa**: Capacidad insuficiente o batería degradada

**Solución**:
- Reemplazar power bank con uno de 20,000 mAh
- Conectar directo a corriente AC si hay toma cerca
- Reducir brillo de pantalla del teléfono

---

## Diagrama de Conexiones

```
┌──────────────┐
│  Teléfono    │
│  Android     │
│              │
│  [Cámara]    │ ← Apunta a shelf
└──────┬───────┘
       │ USB-C/Micro-USB
       ↓
┌──────────────┐
│  Power Bank  │
│  10,000 mAh  │
│  (5V/2A)     │
└──────────────┘

┌──────────────┐
│  Tira LED    │
│  5V USB      │
└──────┬───────┘
       │ USB
       ↓
┌──────────────┐
│  Power Bank  │
│  (mismo)     │
└──────────────┘
```

**Nota**: Si se usa un power bank con 2 puertos USB, conectar tanto el teléfono como el LED al mismo power bank.

---

## Plantilla de Colocación (Imprimible)

**Para asegurar uniformidad entre trolleys**:

1. Crear plantilla de cartón con:
   - Marca de posición del soporte (X cm desde borde)
   - Marca de altura (Y cm desde base de shelf)
   - Marca de ángulo (línea de referencia perpendicular)

2. Usar plantilla en cada trolley para replicar setup exacto

**Beneficio**: Consistencia en FOV, facilita troubleshooting

---

## Referencias

- [Iluminación y FOV](lighting-and-fov.md) — Setup de iluminación
- [Etiquetado QR](qr-labeling.md) — Generación de QR codes
- [Mobile Expo Setup](../setup/mobile-expo-setup.md) — Configuración de app

