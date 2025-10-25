# Decisiones de Arquitectura (ADR Index)

Este documento registra las decisiones arquitectónicas clave tomadas durante el diseño del MVP Smart Trolley.

**Formato**: Cada ADR sigue la estructura: Contexto → Decisión → Consecuencias

---

## ADR-0001: Imágenes Cada 5 Segundos sobre Video Continuo

**Fecha**: 2025-10-25  
**Estado**: Aceptado  
**Autores**: Equipo Smart Trolley

### Contexto
Necesitamos capturar el contenido de las repisas del trolley mientras los operadores agregan productos. Tenemos dos opciones principales:
1. **Video continuo** (streaming a 15-30 fps)
2. **Imágenes estáticas** en intervalos regulares

### Opciones Consideradas

| Criterio | Video Continuo | Imágenes Cada 5s |
|----------|----------------|------------------|
| **Ancho de banda** | 2-5 Mbps constante | ~400 KB cada 5s (~0.64 Mbps pico) |
| **Consumo batería** | Alto (cámara siempre activa) | Bajo (cámara activa 0.5s/5s) |
| **Complejidad técnica** | Media (codec, buffering) | Baja (HTTP multipart simple) |
| **Trazabilidad** | Requiere segmentación de frames | Cada imagen es snapshot único |
| **Procesamiento LLM** | Necesita seleccionar frames representativos | Directo, 1 imagen = 1 análisis |
| **Costo de almacenamiento** | Alto (video comprimido ~1GB/hora) | Moderado (~2-3 GB/hora/shelf) |

### Decisión
**Capturar 1 imagen JPEG cada 5 segundos** por teléfono.

**Razones**:
1. **Suficiente frecuencia**: El operador típicamente tarda >5s en colocar cada grupo de productos
2. **Menor consumo de recursos**: Batería, ancho de banda, y almacenamiento
3. **Simplicidad de implementación**: HTTP POST con FormData vs streaming protocols
4. **Granularidad de análisis**: Cada imagen se analiza independientemente, sin necesidad de correlación temporal
5. **Trazabilidad clara**: Cada scan es un registro único con timestamp, fácil de auditar

### Consecuencias

#### Positivas ✅
- Implementación más rápida (crítico para 36h de hack)
- Menor infraestructura (no requiere media server)
- Fácil de depurar (cada imagen es un archivo estático)
- Escalable (agregar más teléfonos no satura red)

#### Negativas ❌
- Posible pérdida de acciones entre intervalos (si el operador mueve productos muy rápido)
- No capturamos "movimiento" (aunque no es necesario para el caso de uso)

#### Mitigaciones
- Intervalo de 5s es suficiente para que la mano del operador salga del frame
- Si se detecta movimiento borroso (motion blur), bajar el score de confidence

#### Alternativas Futuras
Si el MVP tiene éxito, considerar:
- Video a demanda solo cuando hay cambios detectados (motion detection local)
- Reducir intervalo a 3s en situaciones de alta velocidad

---

## ADR-0002: Tres Aplicaciones Android Independientes por Repisa

**Fecha**: 2025-10-25  
**Estado**: Aceptado  
**Autores**: Equipo Smart Trolley

### Contexto
El trolley estándar tiene **3 repisas** (top, mid, bottom). Necesitamos capturar imágenes de cada una. Opciones:
1. Un teléfono con **cámara gran angular** que capture todas las repisas en una sola imagen
2. **Tres teléfonos** independientes, uno por repisa
3. Un teléfono con **mecanismo motorizado** que rota entre repisas

### Opciones Consideradas

| Criterio | 1 Teléfono Multi-Repisa | 3 Teléfonos Independientes | 1 Teléfono con Motor |
|----------|-------------------------|---------------------------|---------------------|
| **Hardware requerido** | 1 teléfono + soporte central | 3 teléfonos + 3 soportes | 1 teléfono + motor + controlador |
| **Ángulo de cámara** | Oblicuo, distorsión | Perpendicular óptimo | Óptimo, pero complejidad mecánica |
| **Resolución por repisa** | ~400px/repisa (divide FOV) | 1280px completo | 1280px completo |
| **Tolerancia a fallos** | SPOF (si falla, pierde todo) | Redundante (fallo aislado) | SPOF + punto de fallo mecánico |
| **Escalabilidad** | Difícil (trolleys con 4+ repisas) | Fácil (N repisas = N teléfonos) | Difícil (más repisas = más rotación) |
| **Costo** | $150 (1 teléfono usado) | $450 (3 teléfonos usados) | $200+ (teléfono + motor + Arduino) |

### Decisión
**Usar 3 teléfonos Android independientes**, uno fijo por repisa.

**Razones**:
1. **Máxima calidad de imagen**: Cada cámara apunta perpendicularmente a su repisa, sin distorsión
2. **Simplicidad de montaje**: Soportes fijos, sin partes móviles
3. **Tolerancia a fallos**: Si un teléfono falla, los otros 2 siguen funcionando
4. **Escalabilidad**: Agregar más repisas es trivial (solo agregar más teléfonos)
5. **Reutilización de hardware**: Smartphones Android viejos abundan en empresas

### Consecuencias

#### Positivas ✅
- Setup físico simple y confiable
- Cada teléfono opera independientemente (desacoplamiento)
- Configuración por app: escanear QR con `shelf_id` al inicio
- Posibilidad de mejorar solo una repisa sin afectar otras

#### Negativas ❌
- Costo inicial mayor ($450 vs $150)
- Más dispositivos que mantener/cargar
- Posible desincronización de capturas (aunque no crítico)

#### Mitigaciones
- Reutilizar smartphones corporativos retirados (costo ~$0)
- Power banks de 10,000 mAh mantienen operación 8+ horas
- Cola offline en cada teléfono mitiga problemas de conectividad

#### Configuración de Cada App
Cada instancia de la app móvil se configura con:
```json
{
  "shelf_id": 1,  // Escaneo de QR al inicio
  "trolley_id": 456,  // Asignado manualmente o vía QR
  "flight_id": 123,  // Cargado desde backend al inicio de turno
  "scan_interval_ms": 5000
}
```

---

## ADR-0003: JPEG 1280px con Compresión Quality 80%

**Fecha**: 2025-10-25  
**Estado**: Aceptado  
**Autores**: Equipo Smart Trolley

### Contexto
Las imágenes capturadas deben balancear:
- **Calidad suficiente** para que el Vision LLM detecte logos y productos
- **Tamaño manejable** para upload rápido y costos razonables
- **Resolución coherente** con pricing de APIs de visión (muchos cobran por píxel)

### Opciones Consideradas

| Formato | Resolución | Quality | Tamaño Promedio | Pros | Contras |
|---------|-----------|---------|-----------------|------|---------|
| PNG sin compresión | 1920x1080 | Lossless | 2-4 MB | Máxima calidad | Muy pesado, upload lento |
| JPEG Quality 90% | 1920x1080 | Alta | 800 KB - 1.2 MB | Excelente calidad | Aún pesado |
| **JPEG Quality 80%** | **1280x960** | **Buena** | **200-400 KB** | Balance ideal | Ligera pérdida |
| JPEG Quality 60% | 640x480 | Media | 50-100 KB | Muy liviano | Logos difíciles de leer |

### Decisión
**JPEG con quality 80%, resolución máxima 1280px** en el lado largo (aspect ratio proporcional).

**Parámetros exactos**:
```javascript
{
  format: 'jpeg',
  quality: 0.80,
  maxWidth: 1280,
  maxHeight: 1280,  // Se ajusta proporcionalmente
  skipProcessing: false
}
```

**Razones**:
1. **Resolución suficiente**: A 30-40cm de distancia, un logo de 5cm ocupa ~150-200px, más que suficiente
2. **Tamaño manejable**: 200-400 KB se sube en <2s con WiFi/4G estándar
3. **Costo de LLM**: GPT-4 Vision cobra por tokens de imagen; 1280x960 = ~1,228 tokens vs 1920x1080 = ~2,073 tokens (40% más barato)
4. **Almacenamiento**: 400 KB × 12 fotos/min × 60 min = ~288 MB/hora/shelf → 2.6 GB/turno/trolley (3 shelves × 3 horas)

### Consecuencias

#### Positivas ✅
- Uploads rápidos incluso con conexión 4G regular
- Costos de LLM optimizados sin sacrificar precisión
- Almacenamiento manejable (100-200 GB/semana para 10 trolleys)

#### Negativas ❌
- Ligera pérdida de calidad vs PNG lossless (pero imperceptible para el caso de uso)
- Productos muy pequeños (<2cm) podrían ser difíciles de identificar

#### Mitigaciones
- Probar con dataset real durante primeras horas del hack
- Si accuracy < 85%, incrementar a quality 85% o resolution 1600px
- Evitar productos muy pequeños en repisas inferiores (posicionamiento estratégico)

#### Benchmarks Esperados
Basado en pruebas con GPT-4 Vision en productos similares:
- Latas de bebidas (330ml): **Accuracy ~95%** a 1280px
- Botellas de agua (500ml): **Accuracy ~98%** a 1280px
- Snacks empacados: **Accuracy ~85-90%** a 1280px

---

## ADR-0004: Umbral de Confianza 0.80 con Revisión Manual

**Fecha**: 2025-10-25  
**Estado**: Aceptado  
**Autores**: Equipo Smart Trolley

### Contexto
Los modelos de Vision LLM retornan un score de `confidence` (0.0 - 1.0) por cada detección. Necesitamos definir umbrales para:
- Aceptar detecciones automáticamente
- Marcar para revisión humana
- Rechazar por baja confiabilidad

### Opciones Consideradas

| Umbral | Auto-Aceptar | Advertencia | Rechazar | Trade-off |
|--------|--------------|-------------|----------|-----------|
| 0.95 | ≥0.95 | 0.80-0.94 | <0.80 | Muy conservador, muchas revisiones |
| **0.80** | **≥0.80** | **0.60-0.79** | **<0.60** | **Balance ideal** |
| 0.70 | ≥0.70 | 0.50-0.69 | <0.50 | Más automático, mayor riesgo de error |

### Decisión
Implementar **sistema de semáforo con tres niveles**:

| Confidence | Color | Acción | Severidad de Alerta |
|------------|-------|--------|-------------------|
| **≥ 0.80** | 🟢 Verde | Aceptar automáticamente | Sin alerta |
| **0.60 - 0.79** | 🟡 Amarillo | Permitir pero marcar para revisión | `warning` |
| **< 0.60** | 🔴 Rojo | Requiere validación manual obligatoria | `critical` |

**Razones**:
1. **Basado en benchmarks**: GPT-4 Vision típicamente da confidence >0.85 en objetos claros, 0.70-0.80 en parcialmente ocultos, <0.60 en ambiguos
2. **Balance operativo**: Evita fatiga de alertas (threshold muy alto) y errores críticos (threshold muy bajo)
3. **Adaptabilidad**: El operador puede ajustar thresholds desde dashboard si es necesario

### Consecuencias

#### Positivas ✅
- Automatización de ~80-90% de detecciones (asumiendo buena iluminación)
- Intervención humana solo cuando realmente hay ambigüedad
- Datos de confidence permiten mejorar modelo iterativamente

#### Negativas ❌
- 10-20% de scans requerirán revisión manual (pero es aceptable para MVP)
- Posibles falsos negativos si threshold es muy alto

#### Mitigaciones
- Iluminación uniforme con LED para maximizar confidence
- Prompt few-shot con imágenes de referencia de productos conocidos
- Dashboard muestra distribución de confidence en tiempo real para ajustar si es necesario

#### Implementación en Alertas
```javascript
if (confidence >= 0.80) {
  // Verde: No generar alerta
  return null;
} else if (confidence >= 0.60) {
  // Amarillo: Alerta de advertencia
  createAlert({
    type: 'low_confidence',
    severity: 'warning',
    message: `${sku}: Confianza media (${confidence.toFixed(2)}). Revisar manualmente.`
  });
} else {
  // Rojo: Alerta crítica
  createAlert({
    type: 'low_confidence',
    severity: 'critical',
    message: `${sku}: Confianza baja (${confidence.toFixed(2)}). Validación manual requerida.`
  });
}
```

---

## ADR-0005: Cola Offline en Teléfono con Reintentos Automáticos

**Fecha**: 2025-10-25  
**Estado**: Aceptado  
**Autores**: Equipo Smart Trolley

### Contexto
Los almacenes pueden tener WiFi intermitente o zonas con cobertura 4G débil. Si un teléfono no puede enviar un scan inmediatamente, tenemos opciones:
1. **Fallar silenciosamente** y perder el scan
2. **Mostrar error al operador** y esperar que reintente
3. **Cola offline** con reintentos automáticos en background

### Opciones Consideradas

| Estrategia | Implementación | Pros | Contras |
|------------|----------------|------|---------|
| Sin reintentos | Alert al usuario, descarta scan | Simple | Pérdida de datos |
| Cola en memoria | Array en RAM, se pierde al cerrar app | Rápido | No persiste |
| **Cola persistente** | AsyncStorage/SQLite local | **Resiliente** | **Complejidad** |

### Decisión
**Implementar cola persistente con AsyncStorage** (React Native):

**Mecanismo**:
1. Al capturar imagen, intentar envío inmediato vía `POST /scan`
2. Si falla (timeout, error de red, 5xx):
   - Guardar imagen + metadata en AsyncStorage
   - Añadir a cola de pending scans
3. Cada 30 segundos, background task verifica cola:
   - Si hay conexión, reintentar envío del más antiguo
   - Si éxito, eliminar de cola
   - Si falla, incrementar retry_count
4. Máximo 3 reintentos por scan
5. Límite de 50 scans en cola (FIFO, eliminar más antiguos si se llena)

**Razones**:
- **Operación sin fricciones**: El operador no necesita esperar conectividad
- **Resiliencia**: Scans no se pierden por problemas temporales de red
- **Transparencia**: El dashboard muestra "scans pendientes" del teléfono vía metadata

### Consecuencias

#### Positivas ✅
- Operación continua incluso con red intermitente
- Datos no se pierden durante movimiento entre zonas WiFi
- Sincronización automática al recuperar conectividad

#### Negativas ❌
- Complejidad de implementación (gestión de cola, retry logic)
- Almacenamiento local puede llenarse (mitigado con límite de 50)
- Dashboard puede mostrar datos con delay (pero es aceptable)

#### Mitigaciones
- Indicador visual en app móvil: "X scans pendientes de envío"
- Notificación al operador si cola llega a 40+ items (señal de problema de red persistente)
- Limpieza automática de scans >24h de antigüedad

#### Implementación Técnica
```javascript
// Estructura de un scan pendiente en AsyncStorage
{
  id: 'scan_local_1234',
  image_base64: '...',  // Imagen comprimida en base64
  metadata: {
    flight_id: 123,
    trolley_id: 456,
    shelf_id: 1,
    captured_at: '2025-10-26T10:15:30Z',
    retry_count: 0,
    last_retry_at: null
  }
}

// Background task (cada 30s)
async function processPendingQueue() {
  const queue = await AsyncStorage.getItem('scan_queue');
  if (!queue || queue.length === 0) return;
  
  for (const pendingScan of queue) {
    if (pendingScan.retry_count >= 3) {
      // Descarta después de 3 intentos
      removeScanFromQueue(pendingScan.id);
      continue;
    }
    
    try {
      await uploadScan(pendingScan);
      removeScanFromQueue(pendingScan.id);
    } catch (error) {
      pendingScan.retry_count++;
      pendingScan.last_retry_at = new Date().toISOString();
      updateScanInQueue(pendingScan);
    }
  }
}
```

---

## Resumen de Decisiones

| ADR | Decisión | Impacto |
|-----|----------|---------|
| **ADR-0001** | Imágenes cada 5s | 🟢 Reduce complejidad, suficiente frecuencia |
| **ADR-0002** | 3 teléfonos por trolley | 🟢 Máxima calidad, tolerancia a fallos |
| **ADR-0003** | JPEG 1280px quality 80% | 🟢 Balance calidad/tamaño/costo |
| **ADR-0004** | Umbral confidence 0.80 | 🟢 Automatización con control humano |
| **ADR-0005** | Cola offline persistente | 🟢 Resiliencia ante fallas de red |

---

## Próximas Decisiones (Post-MVP)

Decisiones diferidas para versiones futuras:
- **ADR-0006**: ¿Edge processing con TensorFlow Lite o seguir con cloud?
- **ADR-0007**: ¿Redis queue para desacoplar ingesta de procesamiento?
- **ADR-0008**: ¿Agregar modelo de detección de daños/calidad?
- **ADR-0009**: ¿Implementar batch analysis (agrupar scans de mismo trolley)?

---

## Referencias

- [Arquitectura de Contexto](context-architecture.md) — Visión general del sistema
- [Modelo de Datos](data-model.md) — Cómo se almacenan las decisiones
- [Flujo Técnico de Scan](sequence-scan.md) — Implementación de ADRs en el flujo

