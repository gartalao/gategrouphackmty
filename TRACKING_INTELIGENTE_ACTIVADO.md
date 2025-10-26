# 🧠 TRACKING INTELIGENTE DE PRODUCTOS ACTIVADO

**Fecha:** 25 de octubre de 2025, 8:40 PM  
**Estado:** 🟢 SISTEMA INTELIGENTE FUNCIONANDO

---

## 🎯 PROBLEMA ANTERIOR

**Sistema viejo (con cooldown):**
- Detecta Coca-Cola → Guarda en DB ✅
- 500ms después detecta Coca-Cola de nuevo → Cooldown activo, NO guarda ✅
- 1200ms después detecta Coca-Cola de nuevo → Cooldown expiró, guarda OTRA VEZ ❌
- **Problema:** Se guardaba el mismo producto múltiples veces

---

## ✅ NUEVO SISTEMA: Tracking Persistente

### Cómo Funciona:

El backend mantiene un **Map de productos actualmente visibles** por cada scan:

```javascript
currentlyVisibleProducts = {
  scanId_10: Set([productId_1, productId_4, productId_19]), // Coca-Cola, Sprite, Doritos
  scanId_11: Set([productId_2]), // Coca-Cola Zero
}
```

**En cada frame:**
1. Gemini detecta productos en imagen actual
2. Backend compara con productos del frame anterior
3. **NUEVOS** (no estaban antes) → Se registran en DB
4. **EXISTENTES** (ya estaban) → Se ignoran (no se registran)
5. **REMOVIDOS** (estaban pero ya no) → Se quitan del tracking

---

## 📊 EJEMPLOS DE USO

### Ejemplo 1: Un solo producto

```
Frame 1: Usuario muestra 1 Coca-Cola
├─> Gemini detecta: [Coca-Cola]
├─> Backend: Coca-Cola es NUEVA
├─> DB: ✅ Inserta 1 registro
└─> Visible: {Coca-Cola}

Frame 2: La misma Coca-Cola sigue ahí
├─> Gemini detecta: [Coca-Cola]
├─> Backend: Coca-Cola YA está visible
├─> DB: ⏸️ NO inserta (ya registrada)
└─> Visible: {Coca-Cola}

Frame 3: Usuario quita la Coca-Cola
├─> Gemini detecta: []
├─> Backend: Coca-Cola desapareció
├─> DB: No hace nada
└─> Visible: {}

Frame 4: Usuario muestra OTRA Coca-Cola
├─> Gemini detecta: [Coca-Cola]
├─> Backend: Coca-Cola es NUEVA (no estaba visible)
├─> DB: ✅ Inserta 1 registro NUEVO
└─> Visible: {Coca-Cola}
```

**Resultado:** 2 Coca-Colas detectadas en total (correctamente)

---

### Ejemplo 2: Múltiples productos

```
Frame 1: Usuario muestra 2 Coca-Colas
├─> Gemini detecta: [Coca-Cola, Coca-Cola]  ← 2 instancias
├─> Backend: Ambas son NUEVAS
├─> DB: ✅ Inserta 2 registros
└─> Visible: {Coca-Cola}  ← Solo el productId, no cantidad

Frame 2: Las 2 Coca-Colas siguen ahí
├─> Gemini detecta: [Coca-Cola, Coca-Cola]
├─> Backend: Coca-Cola YA está visible
├─> DB: ⏸️ NO inserta (ya registrada)
└─> Visible: {Coca-Cola}

Frame 3: Usuario agrega 1 Coca-Cola más (total 3)
├─> Gemini detecta: [Coca-Cola, Coca-Cola, Coca-Cola]
├─> Backend: Coca-Cola YA está visible
├─> DB: ⏸️ NO inserta (ya estaba)
└─> Visible: {Coca-Cola}
```

**Problema:** No detecta que agregaste 1 más 😕

---

## ⚠️ LIMITACIÓN ACTUAL

El sistema actual **NO cuenta cantidades**, solo detecta "presente" o "ausente".

**Para detectar cantidades necesitaríamos:**
- Conteo de instancias por Gemini
- Comparación de cantidades frame a frame
- Registrar solo la diferencia

---

## 🔧 SOLUCIÓN PARA CANTIDADES (Opcional)

Si quieres que detecte cuando agregas 1 más:

```javascript
// En lugar de Set, usar Map con cantidades
currentlyVisibleProducts = {
  scanId_10: {
    productId_1: 2,  // 2 Coca-Colas
    productId_4: 1,  // 1 Sprite
  }
}

// Al procesar frame:
framePrevio: {Coca-Cola: 2}
frameActual: {Coca-Cola: 3}
Diferencia: +1 Coca-Cola → Insertar 1 registro
```

**¿Quieres que implemente esto?**

---

## 🎯 COMPORTAMIENTO ACTUAL

### Lo que SÍ hace:

✅ Detecta producto cuando aparece por primera vez  
✅ NO lo registra múltiples veces mientras esté visible  
✅ Permite re-detectar cuando desaparece y reaparece  
✅ Detecta múltiples productos diferentes simultáneamente  

### Lo que NO hace (aún):

❌ Contar cantidades (2 Coca-Colas vs 3 Coca-Colas)  
❌ Detectar cuando agregas 1 más del mismo producto  

---

## 📊 LOGS ESPERADOS

### Escenario: Mostrar Coca-Cola, luego agregar Sprite

```
Frame 1: Solo Coca-Cola
[WS] 📦 Items detectados en frame actual: 1
[WS] 🆕 Productos NUEVOS a registrar: 1/1
[WS] ✅ Producto NUEVO registrado: Coca-Cola Regular Lata (0.95)

Frame 2: Coca-Cola sigue visible
[WS] 📦 Items detectados en frame actual: 1
[WS] ♻️ Coca-Cola Regular Lata ya está visible - NO se registra de nuevo
[WS] 🆕 Productos NUEVOS a registrar: 0/1

Frame 3: Coca-Cola + Sprite (agregaste Sprite)
[WS] 📦 Items detectados en frame actual: 2
[WS] ♻️ Coca-Cola Regular Lata ya está visible - NO se registra de nuevo
[WS] 🆕 Productos NUEVOS a registrar: 1/2
[WS] ✅ Producto NUEVO registrado: Sprite Lata (0.92)

Frame 4: Solo Sprite (quitaste Coca-Cola)
[WS] 📦 Items detectados en frame actual: 1
[WS] 🗑️ Productos removidos del frame: 1  ← Coca-Cola desapareció
[WS] ♻️ Sprite Lata ya está visible - NO se registra de nuevo
[WS] 🆕 Productos NUEVOS a registrar: 0/1

Frame 5: Sprite + Coca-Cola NUEVA
[WS] 📦 Items detectados en frame actual: 2
[WS] ♻️ Sprite Lata ya está visible - NO se registra de nuevo
[WS] 🆕 Productos NUEVOS a registrar: 1/2
[WS] ✅ Producto NUEVO registrado: Coca-Cola Regular Lata (0.95)  ← Permitido porque desapareció antes
```

---

## 🚀 CÓMO PROBAR

### 1. Cierra navegador COMPLETAMENTE

### 2. Abre en MODO INCÓGNITO

### 3. Ve a http://localhost:3002/

### 4. Consola (F12)

### 5. Inicia streaming

### 6. Prueba este flujo:

**Paso A:** Muestra 1 Coca-Cola
- Espera 2 segundos
- **Debería detectarse 1 vez** ✅
- **No más detecciones** de Coca-Cola mientras esté visible

**Paso B:** Agrega 1 Sprite (sin quitar Coca-Cola)
- Espera 2 segundos  
- **Debería detectarse solo Sprite** ✅
- **Coca-Cola NO se registra de nuevo** (ya estaba)

**Paso C:** Quita Coca-Cola (deja solo Sprite)
- Espera 1 segundo
- **No hay nuevas detecciones** (Sprite ya registrada)

**Paso D:** Vuelve a poner Coca-Cola
- Espera 2 segundos
- **Debería detectarse Coca-Cola de nuevo** ✅
- **Es nueva detección** porque desapareció antes

---

## ✨ VENTAJAS DEL NUEVO SISTEMA

### ✅ Inteligente:
- No registra duplicados innecesarios
- Tracking frame por frame
- Sabe cuándo productos salen/entran

### ✅ Eficiente:
- Menos inserts en DB
- Menos eventos a frontend
- Mejor performance

### ✅ Preciso:
- Solo registra cambios reales
- No spam de mismo producto
- Dashboard recibe datos limpios

### ✅ Escalable:
- Funciona con 1-20 productos
- Tracking ligero (solo Sets)
- No consume memoria excesiva

---

## 📝 ARCHIVOS MODIFICADOS

**`apps/api/routes/videoStream.js`:**
1. `currentlyVisibleProducts` - Map de tracking
2. `isNewProduct()` - Verifica si es nuevo
3. `updateVisibleProducts()` - Actualiza tracking
4. `cleanupVisibleProducts()` - Limpia al finalizar
5. Handler de frames - Usa tracking inteligente
6. Handler de end_scan - Limpia tracking

**`apps/web-camera/src/pages/LiveRecording.tsx`:**
1. `handleStartRecording()` - Siempre crea nueva sesión
2. `initializeSession()` - Limpia sesión anterior
3. `cleanup()` - Mejorado para finalizar scans

---

## 🎬 PARA LA DEMO

**Guión optimizado:**

```
1. "Voy a escanear productos para el trolley..."
   
2. Muestra 2 Coca-Colas
   → Sistema detecta 2 (se registran)
   → "2 Coca-Colas escaneadas" ✅
   
3. Las deja ahí
   → Sistema NO las vuelve a registrar
   → "Mismo producto, no se duplica" ✅
   
4. Agrega 1 Sprite
   → Sistema detecta solo Sprite
   → "1 Sprite escaneada" ✅
   → "Coca-Colas ya estaban, no se cuentan de nuevo"
   
5. Quita las Coca-Colas
   → Sistema actualiza tracking
   → "Coca-Colas removidas del frame"
   
6. Agrega 2 Coca-Colas NUEVAS
   → Sistema las detecta como nuevas
   → "2 Coca-Colas nuevas escaneadas" ✅
   → "Total dashboard: 4 Coca-Colas + 1 Sprite"
```

---

## 🐛 LIMITACIÓN: Conteo de Cantidades

**Problema actual:**

Si muestras 2 Coca-Colas, el sistema registra la primera vez, pero si agregas una tercera Coca-Cola (total 3), **NO detecta que ahora hay 3** porque "Coca-Cola" ya está en el tracking.

**Solución (si la necesitas):**

Modificar para trackear **cantidades** en lugar de solo "presente/ausente":

```javascript
// Tracking actual (simple):
visible: {Coca-Cola}  // Solo sabe que está presente

// Tracking mejorado (con conteo):
visible: {Coca-Cola: 2, Sprite: 1}  // Sabe cuántas hay

// Al procesar:
Frame anterior: {Coca-Cola: 2}
Frame actual:   {Coca-Cola: 3}
Diferencia: +1 → Insertar 1 registro más
```

**¿Quieres que implemente el conteo de cantidades?**

---

## 🚀 SISTEMA ACTUAL

```
✅ 20 productos en catálogo
✅ Detección multi-objeto
✅ Tracking inteligente frame-a-frame
✅ Sin duplicados innecesarios
✅ Permite re-detección al desaparecer
✅ Velocidad: ~500ms-1s
✅ Limpieza automática de tracking
```

---

**¡Sistema inteligente activado! Prueba y dime si necesitas el conteo de cantidades.** 🧠✨

