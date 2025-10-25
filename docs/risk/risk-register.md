# Registro de Riesgos

Identificación y análisis de riesgos técnicos y operativos del MVP Smart Trolley.

## Tabla de Riesgos

| ID | Riesgo | Impacto | Probabilidad | Severidad | Dueño | Plan de Mitigación |
|----|--------|---------|--------------|-----------|-------|-------------------|
| **R-001** | Iluminación pobre en almacén | Alto | Media | 🔴 Alta | Ops | Ver [Mitigaciones](mitigations.md#r-001) |
| **R-002** | FOV de cámara no cubre toda la repisa | Alto | Media | 🔴 Alta | Mobile | Ver [Mitigations](mitigations.md#r-002) |
| **R-003** | Costos de Vision LLM exceden presupuesto | Medio | Alta | 🟡 Media | Backend | Ver [Mitigations](mitigations.md#r-003) |
| **R-004** | Latencia de Vision LLM >15s | Medio | Media | 🟡 Media | Backend | Ver [Mitigations](mitigations.md#r-004) |
| **R-005** | Pérdida de conectividad WiFi/4G | Medio | Alta | 🟡 Media | Mobile | Ver [Mitigations](mitigations.md#r-005) |
| **R-006** | SKUs visualmentesimilares confunden al modelo | Alto | Media | 🔴 Alta | Backend | Ver [Mitigations](mitigations.md#r-006) |
| **R-007** | Batería de teléfonos se agota durante operación | Medio | Baja | 🟢 Baja | Ops | Ver [Mitigations](mitigations.md#r-007) |
| **R-008** | Vision LLM retorna JSON inválido | Medio | Baja | 🟢 Baja | Backend | Ver [Mitigations](mitigations.md#r-008) |
| **R-009** | Productos parcialmente ocultos no detectados | Alto | Media | 🔴 Alta | Ops | Ver [Mitigations](mitigations.md#r-009) |
| **R-010** | Rate limit de OpenAI API durante demo | Alto | Baja | 🟡 Media | Backend | Ver [Mitigations](mitigations.md#r-010) |
| **R-011** | Motion blur por movimiento del trolley | Medio | Media | 🟡 Media | Mobile | Ver [Mitigations](mitigations.md#r-011) |
| **R-012** | Dashboard WebSocket desconecta | Bajo | Baja | 🟢 Baja | Frontend | Ver [Mitigations](mitigations.md#r-012) |
| **R-013** | Base de datos alcanza límite de free tier | Bajo | Baja | 🟢 Baja | Backend | Ver [Mitigations](mitigations.md#r-013) |
| **R-014** | Teléfono se sobrecalienta | Bajo | Baja | 🟢 Baja | Ops | Ver [Mitigations](mitigations.md#r-014) |
| **R-015** | Demo falla en vivo durante presentación | Crítico | Media | 🔴 Crítica | All | Ver [Mitigations](mitigations.md#r-015) |

---

## Definiciones de Impacto

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| **Crítico** | Impide demostración o funcionalidad core | Sistema no funciona en demo |
| **Alto** | Reduce significativamente accuracy o usabilidad | Accuracy cae a <70% |
| **Medio** | Afecta experiencia pero sistema sigue usable | Latencia de 15s en lugar de 5s |
| **Bajo** | Molestia menor, workarounds disponibles | Dashboard se desconecta pero reconecta solo |

---

## Definiciones de Probabilidad

| Nivel | Descripción | Rango |
|-------|-------------|-------|
| **Alta** | Muy probable que ocurra | >50% |
| **Media** | Puede ocurrir | 20-50% |
| **Baja** | Poco probable | <20% |

---

## Severidad Calculada

```
Severidad = Impacto × Probabilidad

🔴 Alta:    Impacto Alto/Crítico + Probabilidad Media/Alta
🟡 Media:   Impacto Medio + Probabilidad Alta, o Impacto Alto + Probabilidad Baja
🟢 Baja:    Impacto Bajo o Probabilidad Baja con Impacto Medio
```

---

## Detalles de Riesgos Principales

### R-001: Iluminación Pobre en Almacén

**Descripción**: Luz natural variable o luces artificiales insuficientes reducen confidence del modelo.

**Impacto**: Confidence promedio <0.70 → Alertas de baja confianza constantes → Inutilizable

**Indicadores**:
- Confidence promedio de scans <0.75
- Más de 30% de scans con confidence <0.60

**Trigger**: Operación durante horarios de baja luz (tarde/noche) o almacén con ventanas grandes

---

### R-002: FOV de Cámara Inadecuado

**Descripción**: Ángulo o distancia de cámara no cubre toda la repisa → Productos en esquinas no visibles.

**Impacto**: Falsos negativos (productos presentes no detectados) → Alertas incorrectas

**Indicadores**:
- Items en esquinas de shelf consistentemente no detectados
- Operador reporta productos "invisibles" para cámara

**Trigger**: Montaje incorrecto de soportes, trolleys con repisas más anchas de lo esperado

---

### R-003: Costos de Vision LLM Exceden Presupuesto

**Descripción**: Uso de GPT-4o en lugar de GPT-4o Mini, o volumen de scans mayor al estimado.

**Impacto**: Costo >$500 USD durante hackathon → Presupuesto insuficiente

**Indicadores**:
- Costo acumulado >$100 en primeras 12 horas
- Más de 50,000 imágenes procesadas en 24h

**Trigger**: Configuración incorrecta de modelo, interval de scan muy corto (<5s)

---

### R-006: SKUs Visualmente Similares

**Descripción**: Coca-Cola Regular vs Coca-Cola Zero se ven casi idénticas → Confusión del modelo.

**Impacto**: Accuracy <80% para esos productos específicos

**Indicadores**:
- Confidence <0.70 consistentemente para ciertos SKUs
- Confusion matrix muestra confusión entre 2 SKUs específicos

**Trigger**: Catálogo con productos de misma marca pero variantes sutiles (light/zero, sabores similares)

---

### R-015: Demo Falla en Vivo

**Descripción**: Cualquier fallo técnico durante presentación a jueces.

**Impacto**: Proyecto desacreditado, pérdida de oportunidad de ganar

**Indicadores**:
- Backend crashed
- Dashboard no se actualiza
- Vision LLM retorna error 500
- WebSocket desconectado

**Trigger**: Murphy's Law — "Lo que puede salir mal, saldrá mal en el momento menos oportuno"

---

## Matriz de Riesgos (Visual)

```
Impacto
  ↑
Crítico │         │         │ R-015 │
        │─────────│─────────│───────│
  Alto  │         │ R-001   │       │
        │         │ R-002   │       │
        │         │ R-006   │       │
        │─────────│─────────│───────│
  Medio │         │ R-004   │ R-003 │
        │         │ R-009   │ R-005 │
        │         │ R-011   │       │
        │─────────│─────────│───────│
  Bajo  │ R-012   │ R-007   │       │
        │ R-013   │ R-008   │       │
        │ R-014   │ R-010   │       │
        └─────────│─────────│───────│→
         Baja     Media    Alta    Probabilidad
```

---

## Priorización de Mitigación

### Prioridad 1 (Crítica) — Abordar Antes de Demo
- ✅ R-015: Plan B para demo (video backup)
- ✅ R-001: Instalar LEDs en todos los trolleys
- ✅ R-002: Verificar FOV en setup inicial

### Prioridad 2 (Alta) — Abordar Durante Desarrollo
- ⚠️ R-003: Monitorear costos diariamente
- ⚠️ R-006: Few-shot prompting con imágenes de referencia
- ⚠️ R-009: Instrucciones a operador sobre colocación de productos

### Prioridad 3 (Media) — Nice to Have
- 🔵 R-004: Optimizar latencia si time permite
- 🔵 R-005: Implementar cola offline
- 🔵 R-011: Capturar solo cuando trolley esté detenido

### Prioridad 4 (Baja) — Monitorear Solamente
- 🟢 R-007, R-008, R-010, R-012, R-013, R-014: Tener workarounds listos pero no invertir tiempo preventivo

---

## Actualización del Registro

**Frecuencia**: Diaria durante el hack

**Proceso**:
1. **Standup diario**: Revisar riesgos ocurridos en últimas 24h
2. **Actualizar probabilidad**: Si un riesgo se materializó, aumentar probabilidad
3. **Agregar nuevos riesgos**: Si se identifica uno nuevo durante desarrollo
4. **Cerrar riesgos**: Si se mitiga completamente, marcar como "Resuelto"

**Dueños**:
- **Ops**: R-001, R-007, R-009, R-014
- **Mobile**: R-002, R-005, R-011
- **Backend**: R-003, R-004, R-006, R-008, R-010, R-013
- **Frontend**: R-012
- **All**: R-015

---

## Referencias

- [Mitigations](mitigations.md) — Planes de mitigación detallados para cada riesgo
- [Demo Script](../demo/demo-script.md) — Plan B para R-015
- [Lighting and FOV](../ops/lighting-and-fov.md) — Mitigación de R-001 y R-002

