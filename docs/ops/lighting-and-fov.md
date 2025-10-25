# Iluminación y Campo de Visión (FOV)

Guía para optimizar la iluminación y el campo de visión de las cámaras para maximizar la accuracy del Vision LLM.

## Importancia de la Iluminación

La **iluminación uniforme** es crítica para:
- ✅ Máxima confianza (confidence) de detecciones
- ✅ Reducir sombras y reflejos
- ✅ Permitir captura clara de logos y etiquetas
- ✅ Consistencia entre diferentes horas del día

**Impacto medido** (basado en benchmarks de modelos de visión):
- Iluminación óptima: Confidence promedio **0.90-0.95**
- Iluminación pobre: Confidence promedio **0.60-0.75**

---

## Configuración de Iluminación

### Tiras LED 5V USB con Difusor

**Especificaciones**:
- **Voltaje**: 5V DC (alimentación USB)
- **Corriente**: 1-2A (depende de longitud)
- **Temperatura de color**: 5000-6000K (blanco frío, similar a luz de día)
- **CRI (Índice de Reproducción Cromática)**: ≥80 (colores precisos)
- **Longitud por shelf**: 30-50 cm
- **Difusor**: Silicona opaca (evita puntos de luz directa)

**Ejemplo de producto**: "USB LED Strip 5V Daylight White with Diffuser" (~$8-12 USD por metro)

---

### Ubicación de las Tiras LED

**Posición ideal**: Parte superior del trolley, apuntando **hacia abajo** sobre cada shelf

```
   ┌─────────────────────────────┐
   │     [Tira LED con difusor]  │ ← Pegada aquí
   ├─────────────────────────────┤
   │  ↓↓↓ Luz difusa ↓↓↓         │
   │                             │
   │  ╔═══════════════════╗      │
   │  ║  Shelf 1 (Top)    ║ 📱   │ ← Cámara lateral
   │  ╚═══════════════════╝      │
   │                             │
   │     [Tira LED]              │
   ├─────────────────────────────┤
   │  ↓↓↓ Luz difusa ↓↓↓         │
   │  ╔═══════════════════╗      │
   │  ║  Shelf 2 (Mid)    ║ 📱   │
   │  ╚═══════════════════╝      │
   └─────────────────────────────┘
```

**Ventajas de esta configuración**:
- Luz uniforme sobre toda la superficie de la repisa
- Sin sombras proyectadas por productos (luz desde arriba)
- No interfiere con cámara lateral

---

### Instalación de Tiras LED

**Pasos**:
1. **Limpiar superficie** donde se pegará la tira (alcohol isopropílico)
2. **Cortar tira** a la longitud de la repisa (usualmente tienen marcas de corte cada 3-5 cm)
3. **Pegar** con adhesivo 3M incluido o velcro (para fácil remoción)
4. **Conectar** a power bank vía cable USB
5. **Agregar difusor** (tubo de silicona que cubre la tira) si no viene integrado

**Conexión eléctrica**:
- Opción A: Mismo power bank que el teléfono (si tiene 2 puertos USB)
- Opción B: Power bank dedicado para LEDs (si el primero no tiene suficiente capacidad)

---

## Mitigación de Reflejos

### Problema: Reflejos en Botellas/Latas

**Causa**: Luz directa rebota en superficies metálicas o plástico brillante

**Soluciones**:

#### 1. Difusor de Silicona (Recomendado)
- Convierte puntos de luz en superficie uniforme
- Reduce reflejos en ~70-80%

#### 2. Posicionamiento de Luz
- Evitar luz frontal directa hacia la cámara
- Usar luz lateral o superior (como descrito arriba)

#### 3. Polarizador en Cámara (Avanzado)
- Film polarizador adhesivo sobre lente de cámara
- Reduce reflejos pero también reduce luz total (~30%)
- Solo usar si reflejos persisten con difusor

---

### Problema: Sombras Proyectadas

**Causa**: Luz de un solo punto crea sombras duras

**Solución**: Usar **múltiples fuentes de luz** (ej: 2 tiras LED en ángulos opuestos)

```
   [LED 1]     [LED 2]
      ↓           ↓
      ╲         ╱
       ╲       ╱
        ╲     ╱
         ╲   ╱
          ╲ ╱
        ╔═══╗
        ║ 🥤║ ← Sin sombra (iluminado desde ambos lados)
        ╚═══╝
```

**Para MVP**: Una tira LED con difusor es suficiente si está bien posicionada.

---

## Campo de Visión (FOV)

### Cálculo del FOV Necesario

**Dimensiones típicas de una shelf**:
- Ancho: 40-50 cm
- Profundidad: 30-35 cm

**Cámara de smartphone típica**:
- FOV horizontal: ~70-80° (cámara principal)
- FOV gran angular: ~110-120° (si disponible)

**Distancia óptima** (para cubrir shelf completa):

```
FOV = 2 × arctan(ancho_shelf / (2 × distancia))

Para ancho = 50 cm y FOV = 75°:
distancia = 50 / (2 × tan(75°/2)) = 50 / (2 × 0.65) = ~38 cm
```

**Recomendación**: **30-40 cm** de distancia entre cámara y shelf

---

### Verificación de FOV en Campo

**Proceso**:
1. Colocar objetos de referencia en **las 4 esquinas** de la shelf
2. Abrir preview de cámara en app
3. Verificar que los 4 objetos aparezcan **completamente visibles**
4. Si algún objeto se corta, **alejar cámara** o usar cámara gran angular

**Herramienta**: Regla o cinta métrica para asegurar distancia uniforme

---

## Optimización por Tipo de Producto

### Productos con Superficies Brillantes (Latas, Botellas)

**Recomendaciones**:
- Difusor obligatorio
- Luz indirecta (rebotada en techo/pared del trolley)
- Ángulo de cámara ligeramente oblicuo (85° en lugar de 90°) para evitar reflejos directos

---

### Productos con Empaque Oscuro (Chocolate, Café)

**Recomendaciones**:
- Aumentar intensidad de luz (usar tiras LED más largas o más brillantes)
- Asegurar que la temperatura de color sea fría (6000K) para mejor contraste

---

### Productos Pequeños (<5 cm)

**Recomendaciones**:
- Acercar cámara (25-30 cm en lugar de 40 cm)
- Usar cámara con mayor resolución (≥12 MP)
- Considerar macro mode si está disponible

---

## Condiciones de Iluminación Ambiente

### Almacén con Luz Natural (Ventanas)

**Problema**: Luz variable durante el día (mañana vs tarde)

**Solución**:
- LEDs siempre encendidos (compensan variaciones)
- Cortinas o persianas para reducir luz directa del sol

---

### Almacén con Solo Luz Artificial

**Ventaja**: Condiciones más consistentes

**Recomendación**: Asegurar que las luces del almacén estén siempre encendidas durante operación

---

### Operación Nocturna

**Sin problema**: Los LEDs 5V proporcionan suficiente luz incluso en oscuridad total

---

## Benchmarks de Iluminación

### Tabla de Referencia

| Condición | Lumens en Shelf | Confidence Promedio | Recomendación |
|-----------|-----------------|---------------------|---------------|
| Oscuridad total | 0 | 0.30-0.50 | ❌ No usar |
| Luz ambiente baja | 100-300 | 0.60-0.75 | ⚠️ Agregar LEDs |
| Luz ambiente + LEDs | 500-800 | 0.85-0.95 | ✅ Óptimo |
| Luz directa intensa | 1000+ | 0.70-0.80 | ⚠️ Reduce reflejos |

**Objetivo MVP**: **500-800 lumens** en la superficie de la shelf

---

## Medición de Lumens (Opcional)

**Herramienta**: App de smartphone "Lux Meter" (Android/iOS)

**Proceso**:
1. Descargar app de medición de luz (ej: "Light Meter" en Play Store)
2. Colocar teléfono sobre shelf (sensor hacia arriba)
3. Leer valor en **lux** (1 lux ≈ 1 lumen/m²)
4. Para shelf de 0.15 m² (50cm × 30cm), objetivo: **3,000-5,000 lux**

**Conversión**:
```
500 lumens / 0.15 m² = ~3,333 lux ✅
```

---

## Checklist de Iluminación

### Antes de Operación
- [ ] Tiras LED instaladas en cada shelf
- [ ] Difusores de silicona colocados
- [ ] LEDs encendidos y funcionando
- [ ] Intensidad adecuada (medida con lux meter o prueba visual)
- [ ] Sin reflejos visibles en preview de cámara
- [ ] Power banks conectados y cargados

### Durante Operación
- [ ] LEDs permanecen encendidos todo el tiempo
- [ ] Verificar scans: Confidence promedio ≥0.85
- [ ] Si confidence baja (<0.70), revisar iluminación

### Troubleshooting
- [ ] Si reflejos: Ajustar ángulo de LED o agregar difusor
- [ ] Si sombras: Agregar segunda fuente de luz
- [ ] Si imagen oscura: Usar tira LED más larga o más brillante

---

## Alternativas Económicas

### Sin Presupuesto para LEDs

**Opción 1**: Posicionar trolley bajo las luces existentes del almacén
- Mover trolley a zona bien iluminada durante operación
- Limitación: No portátil

**Opción 2**: Linterna LED recargable pegada al trolley
- Costo: $10-15 USD
- Ventaja: Fácil de instalar
- Desventaja: Menos uniforme que tira LED

**Opción 3**: Aumentar brillo de pantalla del teléfono (iluminar con pantalla)
- Costo: $0
- Limitación: Luz muy débil, solo para emergencias

---

## Referencias

- [Montaje de Hardware](hardware-mounting.md) — Instalación completa del sistema
- [Mobile Expo Setup](../setup/mobile-expo-setup.md) — Configuración de cámara
- [JSON Schema para Visión](../api/vision-json-schema.md) — Optimización de prompts para diferentes condiciones de luz

