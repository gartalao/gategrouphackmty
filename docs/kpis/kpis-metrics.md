# KPIs y Métricas del Sistema

Este documento define las métricas clave de rendimiento (KPIs) para evaluar la efectividad del sistema Smart Trolley.

## Categorías de Métricas

1. **Exactitud** — Qué tan bien detecta productos vs realidad
2. **Eficiencia** — Tiempo y velocidad del proceso
3. **Confiabilidad** — Consistencia de las detecciones
4. **Operativas** — Alertas, resoluciones, uso del sistema

---

## 1. Métricas de Exactitud

### 1.1 Porcentaje de Exactitud (Accuracy)

**Definición**: Porcentaje de scans donde el sistema detectó correctamente todos los SKUs y cantidades.

**Fórmula**:
```
Accuracy = (Scans Correctos / Scans Totales) × 100
```

**Criterios de "Scan Correcto"**:
- Todos los items esperados fueron detectados (diff = 0 para todos)
- No hay items inesperados (excedentes)
- Confidence ≥ 0.80 para todos los items

**Query SQL**:
```sql
WITH scan_accuracy AS (
  SELECT 
    s.id as scan_id,
    COUNT(CASE WHEN ABS(
      si.detected_quantity - fr.expected_quantity
    ) = 0 AND si.confidence >= 0.80 THEN 1 END) as correct_items,
    COUNT(fr.id) as expected_items
  FROM scans s
  JOIN scan_items si ON si.scan_id = s.id
  JOIN flight_requirements fr ON fr.product_id = si.product_id 
    AND fr.trolley_id = s.trolley_id
  WHERE s.trolley_id = $1 
    AND s.status = 'completed'
    AND DATE(s.scanned_at) = $2
  GROUP BY s.id
)
SELECT 
  COUNT(CASE WHEN correct_items = expected_items THEN 1 END)::float / 
  COUNT(*)::float * 100 as accuracy_percentage
FROM scan_accuracy;
```

**Ejemplo**:
```
Trolley TRLLY-001, fecha 2025-10-26:
- Scans totales: 40
- Scans 100% correctos: 37
- Accuracy = 37/40 × 100 = 92.5%
```

**Objetivo MVP**: ≥90%

**Dashboard**: Gauge chart con colores:
- 🟢 ≥90%: Verde
- 🟡 75-89%: Amarillo
- 🔴 <75%: Rojo

---

### 1.2 Tasa de Falsos Positivos

**Definición**: Porcentaje de items detectados que en realidad no estaban presentes.

**Fórmula**:
```
False Positive Rate = (Items Detectados Incorrectamente / Total Items Detectados) × 100
```

**Cómo medir** (requiere validación manual):
- Al final del turno, supervisor compara trolley físico vs último scan
- Marca items que fueron detectados pero no están presentes

**Query SQL** (asumiendo tabla de validaciones manuales):
```sql
SELECT 
  COUNT(CASE WHEN v.actual_present = FALSE THEN 1 END)::float /
  COUNT(*)::float * 100 as false_positive_rate
FROM scan_items si
JOIN validations v ON v.scan_item_id = si.id
WHERE si.scan_id IN (
  SELECT id FROM scans WHERE trolley_id = $1 AND DATE(scanned_at) = $2
);
```

**Objetivo MVP**: <5%

---

### 1.3 Tasa de Falsos Negativos

**Definición**: Porcentaje de items presentes que NO fueron detectados.

**Fórmula**:
```
False Negative Rate = (Items Presentes No Detectados / Total Items Presentes) × 100
```

**Query SQL**:
```sql
SELECT 
  COUNT(CASE WHEN si.id IS NULL THEN 1 END)::float /
  COUNT(fr.id)::float * 100 as false_negative_rate
FROM flight_requirements fr
LEFT JOIN scan_items si ON si.product_id = fr.product_id
  AND si.scan_id IN (
    SELECT id FROM scans WHERE trolley_id = fr.trolley_id AND status = 'completed'
  )
WHERE fr.trolley_id = $1;
```

**Objetivo MVP**: <10%

---

## 2. Métricas de Eficiencia

### 2.1 Tiempo Promedio por Trolley

**Definición**: Tiempo transcurrido desde asignación de vuelo hasta marcado como "dispatched".

**Fórmula**:
```
Avg Time = AVG(dispatched_at - assigned_at)
```

**Query SQL**:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (dispatched_at - assigned_at))) as avg_seconds,
  TO_CHAR((AVG(dispatched_at - assigned_at))::interval, 'MI:SS') as formatted_time
FROM trolleys
WHERE status = 'dispatched'
  AND DATE(assigned_at) = $1;
```

**Ejemplo**:
```
Trolley TRLLY-001:
- Assigned: 10:00:00
- Dispatched: 10:07:32
- Time: 7m 32s (452 segundos)
```

**Objetivo MVP**: <8 minutos promedio

**Dashboard**: Line chart mostrando tendencia por hora del día

---

### 2.2 Throughput (Trolleys por Hora)

**Definición**: Número de trolleys completados por hora.

**Fórmula**:
```
Throughput = COUNT(trolleys WHERE status='dispatched' AND hour=X)
```

**Query SQL**:
```sql
SELECT 
  DATE_TRUNC('hour', dispatched_at) as hour,
  COUNT(*) as trolleys_completed
FROM trolleys
WHERE status = 'dispatched'
  AND DATE(dispatched_at) = $1
GROUP BY DATE_TRUNC('hour', dispatched_at)
ORDER BY hour;
```

**Ejemplo**:
```
10:00-11:00 → 6 trolleys
11:00-12:00 → 8 trolleys
12:00-13:00 → 7 trolleys
```

**Objetivo MVP**: ≥6 trolleys/hora (asumiendo 3 operadores en paralelo)

---

### 2.3 Scans por Minuto (Sistema)

**Definición**: Frecuencia de scans procesados por el sistema.

**Fórmula**:
```
Scans/min = COUNT(scans) / Minutos de Operación
```

**Query SQL**:
```sql
SELECT 
  COUNT(*)::float / 
  EXTRACT(EPOCH FROM (MAX(scanned_at) - MIN(scanned_at))) * 60 as scans_per_minute
FROM scans
WHERE DATE(scanned_at) = $1 AND status = 'completed';
```

**Capacidad teórica**:
- 3 trolleys × 3 shelves × (60s / 5s) = 108 scans/min máximo
- **Esperado en práctica**: 20-40 scans/min (no todos los trolleys activos todo el tiempo)

---

## 3. Métricas de Confiabilidad

### 3.1 Confianza Promedio (Average Confidence)

**Definición**: Promedio del score de `confidence` de todas las detecciones.

**Fórmula**:
```
Avg Confidence = AVG(confidence) de todos los scan_items
```

**Query SQL**:
```sql
SELECT 
  AVG(si.confidence) as avg_confidence,
  STDDEV(si.confidence) as stddev_confidence
FROM scan_items si
JOIN scans s ON s.id = si.scan_id
WHERE s.trolley_id = $1
  AND DATE(s.scanned_at) = $2
  AND s.status = 'completed';
```

**Ejemplo**:
```
Trolley TRLLY-001, 2025-10-26:
- Avg Confidence: 0.8675
- StdDev: 0.0842
```

**Objetivo MVP**: ≥0.85

**Dashboard**: Line chart por shelf mostrando evolución durante el picking

---

### 3.2 Confianza por Repisa

**Definición**: Confianza promedio segmentada por posición de repisa.

**Query SQL**:
```sql
SELECT 
  sh.position,
  AVG(si.confidence) as avg_confidence,
  COUNT(si.id) as total_detections
FROM scan_items si
JOIN scans s ON s.id = si.scan_id
JOIN shelves sh ON sh.id = s.shelf_id
WHERE s.trolley_id = $1
  AND DATE(s.scanned_at) = $2
GROUP BY sh.position
ORDER BY sh.position;
```

**Ejemplo**:
```
Top:    0.8950 (142 detecciones)
Middle: 0.8200 (98 detecciones)
Bottom: 0.8875 (115 detecciones)
```

**Insight**: Si bottom shelf tiene menor confidence, puede indicar problema de iluminación o ángulo de cámara.

---

### 3.3 Tasa de Scans Fallidos

**Definición**: Porcentaje de scans que no se completaron exitosamente.

**Fórmula**:
```
Failure Rate = (Scans con status='failed' / Scans Totales) × 100
```

**Query SQL**:
```sql
SELECT 
  COUNT(CASE WHEN status = 'failed' THEN 1 END)::float /
  COUNT(*)::float * 100 as failure_rate
FROM scans
WHERE DATE(scanned_at) = $1;
```

**Causas de fallo**:
- Vision LLM no disponible (503)
- JSON inválido retornado por LLM
- Timeout de red
- Error de almacenamiento

**Objetivo MVP**: <2%

---

## 4. Métricas Operativas

### 4.1 Alertas Generadas por Tipo

**Definición**: Conteo de alertas segmentado por tipo.

**Query SQL**:
```sql
SELECT 
  alert_type,
  COUNT(*) as count,
  COUNT(*)::float / SUM(COUNT(*)) OVER () * 100 as percentage
FROM alerts
WHERE DATE(created_at) = $1
GROUP BY alert_type
ORDER BY count DESC;
```

**Ejemplo**:
```
missing_item:       12 (48%)
quantity_mismatch:  8 (32%)
low_confidence:     3 (12%)
excess_item:        2 (8%)
```

**Dashboard**: Pie chart

---

### 4.2 Alertas por Severidad

**Query SQL**:
```sql
SELECT 
  severity,
  COUNT(*) as count
FROM alerts
WHERE DATE(created_at) = $1
GROUP BY severity;
```

**Ejemplo**:
```
warning:  18
critical: 7
```

---

### 4.3 Tasa de Resolución de Alertas

**Definición**: Porcentaje de alertas que fueron resueltas.

**Fórmula**:
```
Resolution Rate = (Alertas Resueltas / Alertas Totales) × 100
```

**Query SQL**:
```sql
SELECT 
  COUNT(CASE WHEN status = 'resolved' THEN 1 END)::float /
  COUNT(*)::float * 100 as resolution_rate
FROM alerts
WHERE DATE(created_at) = $1;
```

**Objetivo MVP**: ≥95%

---

### 4.4 Tiempo Promedio de Resolución (TTR)

**Definición**: Tiempo promedio desde que se crea una alerta hasta que se marca como resuelta.

**Fórmula**:
```
TTR = AVG(resolved_at - created_at) para alertas resueltas
```

**Query SQL**:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_ttr_seconds,
  TO_CHAR((AVG(resolved_at - created_at))::interval, 'MI:SS') as formatted_ttr
FROM alerts
WHERE status = 'resolved'
  AND DATE(created_at) = $1;
```

**Ejemplo**:
```
Avg TTR: 78 segundos (1m 18s)
```

**Objetivo MVP**: <2 minutos

**Dashboard**: Histogram mostrando distribución de TTR

---

### 4.5 Errores por SKU

**Definición**: SKUs que más frecuentemente generan alertas.

**Query SQL**:
```sql
SELECT 
  p.sku,
  p.name,
  COUNT(a.id) as alert_count,
  AVG(si.confidence) as avg_confidence
FROM alerts a
JOIN scan_items si ON si.id = a.scan_item_id
JOIN products p ON p.id = si.product_id
WHERE DATE(a.created_at) = $1
GROUP BY p.sku, p.name
ORDER BY alert_count DESC
LIMIT 10;
```

**Ejemplo**:
```
COK-REG-330:  5 alertas (avg conf: 0.82)
SNK-PRT-50:   4 alertas (avg conf: 0.71)
JUC-ORA-250:  3 alertas (avg conf: 0.65)
```

**Insight**: SKUs con muchas alertas pueden requerir:
- Mejor imagen de referencia en el prompt
- Reposicionamiento en shelf
- Iluminación ajustada

---

## 5. Métricas de Negocio (Opcionales)

### 5.1 Valor de Inventario por Trolley

**Definición**: Valor monetario total de productos en un trolley.

**Query SQL**:
```sql
SELECT 
  t.trolley_code,
  SUM(si.detected_quantity * p.unit_price) as total_value
FROM scan_items si
JOIN scans s ON s.id = si.scan_id
JOIN trolleys t ON t.id = s.trolley_id
JOIN products p ON p.id = si.product_id
WHERE t.id = $1
  AND s.id = (
    SELECT id FROM scans WHERE trolley_id = $1 AND status = 'completed' ORDER BY scanned_at DESC LIMIT 1
  )
GROUP BY t.trolley_code;
```

**Ejemplo**:
```
TRLLY-001: $432.50 USD
```

---

### 5.2 Tasa de Rotación de SKUs

**Definición**: Frecuencia con que cada SKU aparece en trolleys.

**Query SQL**:
```sql
SELECT 
  p.sku,
  COUNT(DISTINCT s.trolley_id) as trolleys_used_in,
  SUM(si.detected_quantity) as total_quantity_moved
FROM scan_items si
JOIN scans s ON s.id = si.scan_id
JOIN products p ON p.id = si.product_id
WHERE DATE(s.scanned_at) >= $1 
  AND DATE(s.scanned_at) <= $2
GROUP BY p.sku
ORDER BY total_quantity_moved DESC;
```

---

## Dashboard Recomendado

### Vista Principal: KPIs Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Smart Trolley KPIs - 2025-10-26                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Exactitud            92.5%  🟢                          │
│  ⏱️  Tiempo/Trolley      7m 32s 🟢                          │
│  🎯 Confianza Promedio   0.87   🟢                          │
│  ⚠️  Alertas Activas     1      🟡                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Scans Procesados                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 10:00  ▂▃▅▇█▇▅▃▂  11:00  ▃▅▇█▇▅▃  12:00            │   │
│  │ Total hoy: 156 scans                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Confianza por Repisa                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Top:    ████████████████████ 0.90                   │   │
│  │ Middle: ████████████████     0.82                   │   │
│  │ Bottom: ███████████████████  0.89                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Top 5 SKUs con Más Alertas                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. COK-REG-330   5 alertas  (conf: 0.82)            │   │
│  │ 2. SNK-PRT-50    4 alertas  (conf: 0.71)            │   │
│  │ 3. JUC-ORA-250   3 alertas  (conf: 0.65)            │   │
│  │ 4. WTR-SPK-500   2 alertas  (conf: 0.88)            │   │
│  │ 5. PEP-REG-330   1 alerta   (conf: 0.91)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Queries de Ejemplo Consolidados

### Query Master: KPIs del Día

```sql
WITH daily_stats AS (
  SELECT 
    COUNT(DISTINCT t.id) as total_trolleys,
    COUNT(DISTINCT s.id) as total_scans,
    AVG(EXTRACT(EPOCH FROM (t.dispatched_at - t.assigned_at))) as avg_trolley_time,
    AVG(si.confidence) as avg_confidence,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') as active_alerts,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'resolved') as resolved_alerts
  FROM trolleys t
  LEFT JOIN scans s ON s.trolley_id = t.id AND s.status = 'completed'
  LEFT JOIN scan_items si ON si.scan_id = s.id
  LEFT JOIN alerts a ON a.scan_item_id = si.id
  WHERE DATE(t.assigned_at) = $1
)
SELECT 
  total_trolleys,
  total_scans,
  ROUND(avg_trolley_time::numeric, 0) as avg_seconds,
  ROUND(avg_confidence::numeric, 4) as avg_confidence,
  active_alerts,
  resolved_alerts,
  ROUND((resolved_alerts::float / NULLIF(resolved_alerts + active_alerts, 0) * 100)::numeric, 2) as resolution_rate
FROM daily_stats;
```

---

## Referencias

- [Modelo de Datos](../architecture/data-model.md) — Tablas y relaciones
- [Contratos de API](../api/contracts.md) — Endpoint GET /kpis/overview
- [Flujo Operativo](../flows/operational.md) — Cómo se usan estas métricas

