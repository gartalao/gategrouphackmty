# Script de Demostración

Guía paso a paso para presentar el MVP Smart Trolley durante HackMTY (2-3 minutos).

## Objetivo de la Demo

Mostrar a los jueces que el sistema:
1. ✅ Captura automáticamente imágenes de trolleys
2. ✅ Detecta productos con Vision LLM
3. ✅ Genera alertas en tiempo real
4. ✅ Muestra KPIs en dashboard
5. ✅ Funciona end-to-end sin intervención manual

---

## Preparación (Antes de la Presentación)

### 1. Hardware Setup (10 minutos antes)

- [ ] **Trolley preparado** con 3 teléfonos Android montados y encendidos
- [ ] **Power banks** cargados al 100%
- [ ] **LEDs encendidos** e iluminando las repisas
- [ ] **Productos de demo** en un lado (para agregar durante la demo)
- [ ] **WiFi/4G conectado** y verificado

### 2. Software Setup

- [ ] **Dashboard abierto** en laptop/proyector mostrando `/trolleys/456`
- [ ] **Backend corriendo** y respondiendo (`/health` retorna 200)
- [ ] **Base de datos** poblada con flight y flight_requirements
- [ ] **Un scan inicial** ya realizado (para mostrar que funciona)

### 3. Productos de Demo

**Lista de productos visibles**:
- 6 latas de Coca-Cola (SKU: COK-REG-330)
- 6 botellas de Agua (SKU: WTR-REG-500)
- 3 bolsas de Pretzels (SKU: SNK-PRT-50)

**Flight requirements configurado**:
- Coca-Cola: 12 esperadas
- Agua: 6 esperadas
- Pretzels: 3 esperadas

**Estado inicial** (antes de demo):
- Shelf 1 (Top): 6 Coca-Colas (faltante de 6) 🔴
- Shelf 2 (Mid): 0 Aguas (faltante de 6) 🔴
- Shelf 3 (Bot): 0 Pretzels (faltante de 3) 🔴

---

## Script de Presentación (2-3 Minutos)

### [0:00 - 0:30] Introducción del Problema

**Guión**:

> "Hola, somos el equipo **Smart Trolley**. En GateGroup procesan miles de trolleys al día para vuelos comerciales. El problema: el proceso de Pick & Pack es 100% manual, con errores en el 10-15% de los casos. Un faltante de agua en un vuelo de 8 horas no se puede corregir."

**Visual**: Mostrar trolley físico con repisas vacías.

---

### [0:30 - 1:00] Presentación de la Solución

**Guión**:

> "Nuestra solución usa **visión por computadora** para validar automáticamente el contenido de cada trolley en tiempo real. Tenemos 3 teléfonos Android —uno por repisa— que capturan fotos cada 5 segundos y las envían a un modelo de Vision LLM que identifica productos y cantidades."

**Visual**: Apuntar a los 3 teléfonos montados en el trolley.

> "Todo se muestra en este dashboard en vivo. Aquí vemos el estado actual del trolley para el vuelo AA2345."

**Visual**: Mostrar dashboard en pantalla/proyector.

---

### [1:00 - 2:00] Demostración en Vivo

#### Paso 1: Agregar Coca-Colas a Shelf 1

**Acción**: Tomar 6 latas de Coca-Cola adicionales y colocarlas en la repisa superior.

**Guión**:

> "Voy a agregar las Coca-Colas faltantes. Noten que el operador solo agrega productos —no escanea nada manualmente."

**Esperar 5-10 segundos** (el teléfono captura automáticamente).

**Visual en Dashboard**:
- Shelf 1 cambia de 🔴 Rojo a 🟢 Verde
- Contador actualiza: "COK-REG-330: 12/12 ✅"

**Guión**:

> "El sistema detectó automáticamente las 12 Coca-Colas. Shelf 1 ahora está verde —completa."

---

#### Paso 2: Agregar Aguas a Shelf 2 (Provocar Alerta)

**Acción**: Agregar solo **4 botellas de agua** en lugar de 6 (intencional).

**Guión**:

> "Ahora agrego el agua... pero 'accidentalmente' solo pongo 4 en lugar de 6."

**Esperar 5-10 segundos**.

**Visual en Dashboard**:
- Shelf 2 cambia de 🔴 a 🟡 Amarillo
- **Alerta aparece**: "⚠️ Shelf 2: Faltante 2 Aguas (4/6)"
- Contador: "WTR-REG-500: 4/6 ❌ Diff: -2"

**Guión**:

> "El sistema detecta inmediatamente que faltan 2 aguas y genera una alerta en tiempo real. El operador puede corregir antes de que el trolley se despache."

---

#### Paso 3: Corregir el Error

**Acción**: Agregar las 2 botellas de agua faltantes.

**Guión**:

> "Ahora corrijo agregando las 2 botellas que faltaban."

**Esperar 5-10 segundos**.

**Visual en Dashboard**:
- Shelf 2 cambia de 🟡 a 🟢
- Alerta se marca como **resuelta automáticamente**
- Contador: "WTR-REG-500: 6/6 ✅"

**Guión**:

> "Perfecto. El sistema confirma que ahora tenemos las 6 aguas correctas."

---

#### Paso 4: Completar Shelf 3

**Acción**: Agregar 3 bolsas de Pretzels a la repisa inferior.

**Guión**:

> "Finalmente agrego los snacks."

**Esperar 5-10 segundos**.

**Visual en Dashboard**:
- Shelf 3 cambia de 🔴 a 🟢
- **Trolley completo**: Status general 🟢 "100% Completo, listo para despacho"

---

### [2:00 - 2:30] KPIs y Beneficios

**Guión**:

> "El dashboard también muestra KPIs en tiempo real: exactitud del 92%, tiempo promedio de 7 minutos por trolley, confianza promedio del modelo de 0.87. Todo esto permite a GateGroup reducir errores, acelerar operaciones y tener trazabilidad completa."

**Visual**: Cambiar a vista `/kpis` mostrando gráficas.

---

### [2:30 - 3:00] Cierre

**Guión**:

> "En resumen: **Smart Trolley** hace el Pick & Pack más rápido, más preciso y más sostenible. Construimos esto en 36 horas con React Native, Node.js, Postgres y GPT-4 Vision. Gracias."

**Visual**: Volver a mostrar trolley físico completo + dashboard.

---

## Variaciones del Script

### Si Solo Hay 1 Minuto

**Condensar a**:
1. Problema (10s)
2. Solución (15s)
3. Demo en vivo con 1 alerta (25s)
4. KPIs (5s)
5. Cierre (5s)

---

### Si Hay 5 Minutos

**Agregar**:
- Explicación técnica de Vision LLM
- Mostrar código del JSON Schema
- Demo de WebSocket en vivo (Network tab de DevTools)
- Mostrar flujo de cola offline (desconectar WiFi y reconectar)

---

## Respuestas a Preguntas Frecuentes de Jueces

### "¿Qué pasa si la cámara pierde conectividad?"

> "Implementamos una cola offline en el teléfono. Si pierde WiFi, las imágenes se guardan localmente y se reenvían automáticamente cuando se recupera la conexión. El operador puede seguir trabajando sin interrupciones."

---

### "¿Qué tan preciso es el modelo de Vision?"

> "Con iluminación adecuada, el modelo alcanza 90-95% de accuracy. Usamos un umbral de confianza de 0.80: si el modelo está inseguro, genera una alerta para revisión manual en lugar de asumir."

---

### "¿Cuánto cuesta operar esto?"

> "El costo principal es el Vision LLM. Con GPT-4o Mini, cada imagen cuesta ~$0.0004, lo que significa ~$20-30 USD por trolley al día. Comparado con el costo de un error (productos desperdiciados, clientes insatisfechos), el ROI es inmediato."

---

### "¿Esto reemplaza a los operadores?"

> "No, esto los **asiste**. El operador sigue haciendo el picking. El sistema solo valida automáticamente que no haya errores, como un 'copiloto' que revisa su trabajo en tiempo real."

---

### "¿Cómo escala esto?"

> "El sistema puede manejar 10-15 trolleys simultáneos con la infraestructura actual. Para escalar a 100+, agregaríamos batch processing y potencialmente edge computing con modelos locales más livianos."

---

## Checklist Pre-Demo (5 Minutos Antes)

### Hardware
- [ ] Trolley en posición visible para jueces
- [ ] 3 teléfonos encendidos y apps corriendo
- [ ] LEDs encendidos
- [ ] Productos de demo preparados al lado

### Software
- [ ] Backend corriendo: `curl http://localhost:3001/health` → 200 OK
- [ ] Dashboard abierto en laptop conectado a proyector
- [ ] WebSocket conectado (indicador verde en dashboard)
- [ ] Flight y requirements cargados en DB

### Presentación
- [ ] Slides de backup (si falla la demo en vivo)
- [ ] Screenshots de dashboard como fallback
- [ ] Video grabado de demo anterior (plan B)

### Personas
- [ ] **Presentador**: Persona que habla y explica
- [ ] **Operador**: Persona que agrega productos al trolley
- [ ] **Tech support**: Persona que monitorea backend/logs en laptop (opcional)

---

## Plan B: Si Falla la Demo en Vivo

### Opción 1: Video Pre-Grabado

Grabar video de 2 minutos del flujo completo funcionando. Reproducir si hay problemas técnicos.

### Opción 2: Screenshots Comentados

Presentar screenshots del dashboard mostrando:
1. Estado inicial con alertas
2. Scan procesándose
3. Alertas resolviéndose
4. Estado final verde

### Opción 3: Demo con Mock Data

Simular eventos de WebSocket manualmente desde backend:

```javascript
// En backend, endpoint de emergencia
app.post('/demo/emit-scan', (req, res) => {
  io.emit('scan_processed', mockScanData);
  res.json({ ok: true });
});
```

Disparar eventos con Postman durante la presentación.

---

## Timing Ideal

| Tiempo | Actividad | Visual |
|--------|-----------|--------|
| 0:00-0:30 | Introducción del problema | Trolley vacío |
| 0:30-1:00 | Explicar solución | Dashboard + hardware |
| 1:00-1:20 | Agregar Coca-Colas | Dashboard actualiza |
| 1:20-1:40 | Agregar Aguas (con error) | Alerta aparece |
| 1:40-2:00 | Corregir error | Alerta resuelta |
| 2:00-2:30 | Mostrar KPIs | Vista de métricas |
| 2:30-3:00 | Cierre y Q&A | Pantalla final |

---

## Referencias

- [Criterios de Éxito](success-criteria.md) — Qué deben evaluar los jueces
- [Flujo Operativo](../flows/operational.md) — Proceso completo del sistema
- [KPIs y Métricas](../kpis/kpis-metrics.md) — Qué mostrar en dashboard

