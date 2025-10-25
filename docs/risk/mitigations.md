# Plan de Mitigaciones

Estrategias detalladas para prevenir o minimizar el impacto de cada riesgo identificado.

## R-001: Iluminación Pobre en Almacén

### Mitigaciones Preventivas
- ✅ Instalar tiras LED USB en cada shelf (ver [Lighting and FOV](../ops/lighting-and-fov.md))
- ✅ Usar difusores de silicona para luz uniforme
- ✅ Configurar intensidad de LED a 500-800 lumens
- ✅ Probar captura de imágenes en horarios de baja luz natural

### Mitigaciones Reactivas
- Si confidence <0.70: Aumentar intensidad de LED o agregar segunda fuente de luz
- Si reflejos excesivos: Ajustar ángulo de LED o agregar film polarizador a cámara
- Usar modelo GPT-4o (más preciso) en lugar de Mini para scans con baja luz

### Indicadores de Activación
- Confidence promedio <0.75 en 10 scans consecutivos
- Más de 5 alertas de "low_confidence" en 1 hora

---

## R-002: FOV de Cámara Inadecuado

### Mitigaciones Preventivas
- ✅ Verificar FOV en setup inicial colocando objetos en las 4 esquinas
- ✅ Usar cámara gran angular si está disponible (FOV ≥90°)
- ✅ Mantener distancia de 30-40 cm entre cámara y shelf
- ✅ Crear plantilla de montaje para uniformidad entre trolleys

### Mitigaciones Reactivas
- Ajustar soporte de teléfono (alejar o acercar según necesidad)
- Cambiar orientación de teléfono (vertical → horizontal o viceversa)
- Usar cámara ultra-wide si disponible

### Indicadores de Activación
- Items en esquinas reportados como faltantes pero presentes físicamente
- Operador reporta productos no visibles en preview de cámara

---

## R-003: Costos de Vision LLM Exceden Presupuesto

### Mitigaciones Preventivas
- ✅ Usar GPT-4o Mini por defecto ($0.0004/imagen vs $0.005/imagen)
- ✅ Establecer alerta si costo acumulado >$100 en 24h
- ✅ Limitar scans a horarios de operación (no 24/7)
- ✅ Implementar throttling: Si shelf no ha cambiado (hash idéntico), skip LLM call

### Mitigaciones Reactivas
- Pausar scans automáticos y cambiar a modo manual (on-demand)
- Reducir frecuencia de scan: 5s → 10s → 30s
- Usar caché de resultados para imágenes similares

### Indicadores de Activación
- Costo acumulado >$50 en primeras 12 horas
- Proyección lineal indica >$300 para 36h

---

## R-004: Latencia de Vision LLM >15s

### Mitigaciones Preventivas
- ✅ Usar GPT-4o Mini (latencia típica 2-3s vs 4-5s de GPT-4o)
- ✅ Optimizar tamaño de imagen: 1280px es suficiente
- ✅ Reducir max_tokens en request a Vision API (500 en lugar de 1000)

### Mitigaciones Reactivas
- Cambiar a modelo más rápido (Claude 3 Haiku tiene latencia similar pero puede ser más estable)
- Paralelizar: Enviar 3 scans (uno por shelf) simultáneamente en lugar de secuencial
- Implementar timeout de 10s: Si LLM no responde, cancelar y reintentar

### Indicadores de Activación
- Latencia promedio >12s en 5 llamadas consecutivas
- Dashboard muestra "processing" por >20s

---

## R-005: Pérdida de Conectividad WiFi/4G

### Mitigaciones Preventivas
- ✅ Implementar cola offline en teléfono (AsyncStorage)
- ✅ Reintentos automáticos cada 30s
- ✅ Usar WiFi con power banks móviles si almacén tiene zonas sin cobertura

### Mitigaciones Reactivas
- Switch automático WiFi ↔ 4G si uno falla
- Indicador visual en app: "⚠️ Offline - X scans pendientes"
- Limitar cola a 50 scans (FIFO) para no saturar storage

### Indicadores de Activación
- Error de red en upload (ECONNREFUSED, ETIMEDOUT)
- Backend no recibe scans durante >2 minutos

---

## R-006: SKUs Visualmente Similares

### Mitigaciones Preventivas
- ✅ Few-shot prompting: Incluir imágenes de referencia de SKUs similares en prompt
- ✅ Especificar diferencias clave en prompt:
  ```
  COK-REG-330: Lata ROJA con logo blanco
  COK-ZER-330: Lata NEGRA con logo rojo
  ```
- ✅ Usar catálogo con imágenes de alta calidad

### Mitigaciones Reactivas
- Si confidence <0.80 en SKUs similares: Generar alerta para revisión manual
- Agregar campo "similar_skus" en alerta con SKUs que el modelo considera parecidos
- Post-MVP: Fine-tuning del modelo con dataset específico de GateGroup

### Indicadores de Activación
- Confusion matrix muestra >10% de confusión entre 2 SKUs específicos
- Operador reporta detecciones incorrectas de SKUs parecidos

---

## R-007: Batería de Teléfonos se Agota

### Mitigaciones Preventivas
- ✅ Usar power banks de 10,000+ mAh
- ✅ Cargar power banks al 100% antes de cada turno
- ✅ Habilitar "Battery Saver" en teléfonos (reduce brillo pero mantiene funcionalidad)
- ✅ Conectar teléfonos a corriente AC si hay toma cerca del trolley

### Mitigaciones Reactivas
- Alerta automática cuando batería del teléfono <20%
- Tener power banks de backup cargados
- Reducir frecuencia de scan (5s → 10s) para extender batería

### Indicadores de Activación
- Teléfono muestra alerta de batería baja
- App envía evento "low_battery" al backend

---

## R-008: Vision LLM Retorna JSON Inválido

### Mitigaciones Preventivas
- ✅ Usar `response_format: { type: "json_object" }` en OpenAI API
- ✅ Validar JSON con Ajv schema antes de procesarlo
- ✅ Temperatura baja (0.1) para respuestas más deterministas

### Mitigaciones Reactivas
- Log raw response de LLM para debugging
- Marcar scan como `failed` y reintentar después de 30s
- Enviar notificación a equipo si >3 errores consecutivos

### Indicadores de Activación
- JSON.parse() lanza SyntaxError
- Ajv validation retorna `false`

---

## R-009: Productos Parcialmente Ocultos

### Mitigaciones Preventivas
- ✅ Instruir a operadores: Colocar productos con logos/etiquetas hacia cámara
- ✅ Agregar nota en prompt: "Si producto está parcialmente oculto, bajar confidence y añadir nota"
- ✅ Verificar que FOV cubre toda la repisa sin zonas muertas

### Mitigaciones Reactivas
- Si modelo reporta "parcialmente visible" en notes: Generar alerta de advertencia
- Sugerir al operador reposicionar productos
- Post-scan manual: Supervisor verifica imagen y corrige si es necesario

### Indicadores de Activación
- >30% de items tienen notes como "partially hidden" o "obstructed"
- Confidence promedio para shelf específico <0.75

---

## R-010: Rate Limit de OpenAI API Durante Demo

### Mitigaciones Preventivas
- ✅ Confirmar tier de OpenAI account (Tier 1 = 500 RPM, Tier 3 = 5000 RPM)
- ✅ Agregar API key de backup (segunda cuenta)
- ✅ Implementar rate limiting en backend: Max 10 requests/min por teléfono

### Mitigaciones Reactivas
- Switch automático a API key de backup si primera retorna 429
- Exponential backoff: Esperar 5s, 10s, 20s antes de reintentar
- Durante demo: Pre-cargar scans antes de presentación (mock mode)

### Indicadores de Activación
- HTTP 429 "Too Many Requests" de OpenAI
- Error message "Rate limit exceeded"

---

## R-011: Motion Blur por Movimiento del Trolley

### Mitigaciones Preventivas
- ✅ Capturar solo cuando trolley esté detenido (detección de acelerómetro)
- ✅ Usar shutter speed alto en cámara (si configurable)
- ✅ Reforzar montaje de teléfonos para minimizar vibración

### Mitigaciones Reactivas
- Detectar blur en imagen (análisis de bordes con OpenCV) y descartar scan automáticamente
- Generar alerta: "Imagen borrosa, mover trolley más despacio"
- Aumentar delay entre scans: 5s → 7s para dar más tiempo de estabilización

### Indicadores de Activación
- Modelo reporta confidence <0.60 con notes "blurry image"
- Análisis de imagen muestra varianza de Laplacian <100 (indicador de blur)

---

## R-012: Dashboard WebSocket Desconecta

### Mitigaciones Preventivas
- ✅ Implementar reconexión automática con exponential backoff
- ✅ Heartbeat ping cada 30s para mantener conexión viva
- ✅ Fallback a polling si WebSocket no soportado

### Mitigaciones Reactivas
- Mostrar banner en dashboard: "⚠️ Desconectado - Reconectando..."
- Refetch datos via REST mientras WebSocket reconecta
- Logs de conexión en console para debugging

### Indicadores de Activación
- Socket.io emite evento "disconnect"
- No se reciben eventos durante >60s

---

## R-013: Base de Datos Alcanza Límite de Free Tier

### Mitigaciones Preventivas
- ✅ Monitorear storage usado en Neon Dashboard
- ✅ Limpiar datos de prueba antes del hack
- ✅ Configurar alertas en Neon si storage >80%

### Mitigaciones Reactivas
- Eliminar scans antiguos (>7 días) manualmente
- Upgrade a tier pago de Neon ($20/mes) si es necesario
- Reducir frecuencia de scans temporalmente

### Indicadores de Activación
- Neon Dashboard muestra >90% de storage usado
- Query INSERT retorna error "storage quota exceeded"

---

## R-014: Teléfono se Sobrecalienta

### Mitigaciones Preventivas
- ✅ Evitar exponer teléfonos a luz solar directa
- ✅ Usar casos con disipación de calor (opcional)
- ✅ Reducir brillo de pantalla al mínimo

### Mitigaciones Reactivas
- App detecta temperatura >45°C y pausa scans por 5 minutos
- Agregar ventilación (pequeño fan USB si es necesario)
- Cambiar teléfono por uno de backup

### Indicadores de Activación
- Teléfono muestra alerta de temperatura
- App envía evento "high_temperature" al backend

---

## R-015: Demo Falla en Vivo Durante Presentación

### Mitigaciones Preventivas
- ✅ **Plan A**: Demo en vivo con trolley físico
- ✅ **Plan B**: Video pre-grabado de demo completa (2-3 min)
- ✅ **Plan C**: Screenshots comentados paso a paso
- ✅ **Plan D**: Slides con diagrama y explicación teórica

### Mitigaciones Reactivas Durante Demo
1. **Si backend crashea**: Mostrar video backup inmediatamente
2. **Si dashboard no actualiza**: Refrescar página mientras presentador gana tiempo explicando
3. **Si Vision LLM falla**: Usar mock data pre-cargado (disparar eventos WebSocket manualmente)
4. **Si WiFi falla**: Switch a 4G o usar demo offline con datos pre-cargados

### Checklist Pre-Demo (10 min antes)
- [ ] Test completo end-to-end funcionando
- [ ] Video backup renderizado y listo para reproducir
- [ ] Screenshots impresos como fallback físico
- [ ] Presentador practica transición a Plan B sin pánico visible

---

## Resumen de Mitigaciones Críticas

| Riesgo | Mitigación Principal | Tiempo de Implementación |
|--------|----------------------|--------------------------|
| **R-001** | Instalar LEDs | 30 min/trolley |
| **R-002** | Verificar FOV en setup | 5 min/trolley |
| **R-003** | Usar GPT-4o Mini + monitoreo | 1 hora |
| **R-006** | Few-shot prompting | 2 horas |
| **R-015** | Grabar video backup | 30 min |

**Total esfuerzo de mitigación crítica**: ~6-8 horas

---

## Referencias

- [Registro de Riesgos](risk-register.md) — Lista completa de riesgos
- [Demo Script](../demo/demo-script.md) — Plan B y C para R-015
- [Lighting and FOV](../ops/lighting-and-fov.md) — Detalles de R-001 y R-002

