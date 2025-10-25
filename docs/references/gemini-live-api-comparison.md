# Comparación: Implementación Actual vs Gemini Live API

Este documento compara nuestra implementación actual con el ejemplo de Google Gemini Live API Web Console.

## 📊 Resumen de Diferencias

| Aspecto | Nuestra Implementación | Gemini Live API Demo |
|---------|------------------------|---------------------|
| **Modo de Captura** | Frames cada 5 segundos | Stream continuo |
| **Procesamiento** | Análisis independiente por frame | Análisis continuo con contexto |
| **Contexto** | Sin memoria entre frames | Mantiene contexto de conversación |
| **Latencia** | ~6.7 segundos end-to-end | Potencialmente más baja |
| **Complejidad** | ⭐⭐ Moderada | ⭐⭐⭐ Alta |
| **Uso de Tokens** | ~100K tokens/día (estimado) | Significativamente más alto |
| **Requisitos** | HTTP + WebSocket | Live API (audiencia limitada) |

## ✅ Fortalezas de Nuestra Implementación Actual

### 1. **Simplicidad Operativa**
- ✅ Captura cada 5s es suficiente para el use case
- ✅ Fácil de depurar (cada frame es independiente)
- ✅ Manejo de errores más simple

### 2. **Costo Eficiente**
- ✅ Solo analiza frames relevantes (no todo el stream)
- ✅ Uso controlado de API tokens
- ✅ Predictible en costos

### 3. **Latencia Aceptable**
- ✅ 6.7s desde captura hasta alerta (<10s objetivo)
- ✅ Cooldown de 1.2s evita duplicados
- ✅ Optimizaciones adicionales posibles

### 4. **Requisitos Técnicos**
- ✅ Usa Gemini standard API (accesible)
- ✅ Compatible con infrastructura actual
- ✅ No requiere Live API access

## 🚀 Mejoras Posibles Inspiradas en Live API

### 1. **Context Window Mejorado**

**Idea**: Mantener historial de detecciones en el prompt

```typescript
// En geminiService.ts
function buildPrompt(catalog, recentDetections) {
  const recentContext = recentDetections
    .slice(-3) // Últimas 3 detecciones
    .map(d => `- ${d.productName} detectado ${d.count} veces`)
    .join('\n');

  return `Contexto reciente:
${recentContext}

Eres un sistema de visión EN TIEMPO REAL...
`;
}
```

### 2. **Deduplicación Inteligente**

**Actual**: Cooldown fijo de 1.2s  
**Mejorado**: Cooldown adaptativo basado en la acción

```typescript
// En videoStream.ts
function getCooldownForAction(action: string): number {
  const cooldowns = {
    'placing_in_trolley': 1500,  // Más largo
    'removing_from_trolley': 2000,
    'reorganizing': 800,          // Más corto
  };
  return cooldowns[action] || 1200;
}
```

### 3. **Batch Processing**

**Idea**: Procesar múltiples frames en paralelo cuando sea posible

```typescript
// Processar últimos 3 frames juntos si no hay detección previa
async function analyzeFramesBatch(frames: Frame[]) {
  const results = await Promise.all(
    frames.map(frame => analyzeFrame(frame.data, catalog))
  );
  
  // Consolidar resultados
  return consolidateDetections(results);
}
```

### 4. **Feedback Loop**

**Idea**: Usar confirmaciones del operador para mejorar precisión

```typescript
// Evento: product_confirmed
socket.on('product_confirmed', (data) => {
  // Ajustar threshold dinámicamente
  adjustConfidenceThreshold(data.productId, data.actual);
});
```

## 📝 Decisión: No Migrar a Live API

### Razones

1. **Acceso Limitado**
   - Live API está en fase early access
   - Nuestro use case no requiere ultra baja latencia

2. **Complejidad vs Beneficio**
   - Mayor complejidad de implementación
   - Beneficio marginal para catering aéreo

3. **Costos**
   - Stream continuo consume más tokens
   - Costos menos predecibles

4. **Use Case Específico**
   - Detectar colocación de productos no requiere análisis continuo
   - 5 segundos es suficientemente rápido

## 🎯 Recomendaciones Inmediatas

### Prioridad Alta

1. **Implementar cooldown adaptativo** (30 min de trabajo)
2. **Añadir contexto reciente al prompt** (1 hora de trabajo)
3. **Métricas de latencia por etapa** (1 hora de trabajo)

### Prioridad Media

1. **Batch processing para frames cercanos** (2 horas)
2. **Feedback loop con confirmaciones** (3 horas)
3. **A/B testing de thresholds** (2 horas)

### Prioridad Baja (Futuro)

1. **Explorar Live API cuando esté en GA** (POC)
2. **Multi-frame analysis con video snippets** (mejora significativa)
3. **On-device preprocessing** (optimización avanzada)

## 📚 Referencias

- [Google Gemini Live API Repo](https://github.com/google-gemini/live-api-web-console)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Our Technical Flow](docs/flows/technical-scan.md)
