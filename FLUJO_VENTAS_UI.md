# 📊 Flujo de UI - Sistema de Ventas

## 🎯 Cómo Funciona Ahora

### **1. Scan de Carga (LOAD)**

```
Usuario hace clic en: 📦 Escanear Carga de Trolley
                      ↓
Escanea productos con la cámara:
  - Coca-Cola detectada → UI muestra: 📦 Coca-Cola Regular Lata
  - Doritos detectados  → UI muestra: 📦 Doritos
  - Takis detectados    → UI muestra: 📦 Takis
                      ↓
Sistema guarda en loadedProductsMap:
  {
    9: "Coca-Cola Regular Lata",
    20: "Doritos",
    28: "Takis"
  }
                      ↓
Usuario hace clic en: ⏹ Detener Streaming
                      ↓
Scan guardado con scanId = 32
```

---

### **2. Scan de Retorno (RETURN)**

```
Usuario hace clic en: 🔄 Escanear Retorno (Restantes)
                      ↓
Sistema CARGA productos del scan original:
  - Consulta: GET /api/scans/32/summary
  - Obtiene: [Coca-Cola, Doritos, Takis]
  - Guarda en loadedProductsMap
                      ↓
Usuario escanea lo que QUEDÓ:
  - Coca-Cola detectada → UI muestra: 🔄 Coca-Cola (Retornado)
                      ↓
Sistema guarda en returnedProducts:
  Set([9]) // Solo Coca-Cola
                      ↓
Usuario hace clic en: ⏹ Detener Streaming
                      ↓
Sistema CALCULA y MUESTRA:

  VENDIDOS (loadedIds - returnedIds):
    ✅ Doritos (VENDIDO)
    ✅ Takis (VENDIDO)
  
  RETORNADOS:
    🔄 Coca-Cola (Retornado)
```

---

## 📺 UI - Productos Detectados

### **Durante Scan de Carga:**
```
┌────────────────────────────────────────┐
│ 📦 Productos Detectados                │
├────────────────────────────────────────┤
│ 📦 Coca-Cola Regular Lata              │
│    95% confianza • hace 30s            │
├────────────────────────────────────────┤
│ 📦 Doritos                             │
│    92% confianza • hace 1m             │
├────────────────────────────────────────┤
│ 📦 Takis                               │
│    90% confianza • hace 2m             │
└────────────────────────────────────────┘
```

### **Durante Scan de Retorno:**
```
┌────────────────────────────────────────┐
│ 📦 Productos Detectados                │
├────────────────────────────────────────┤
│ 🔄 Coca-Cola (Retornado)               │
│    95% confianza • hace 10s            │
└────────────────────────────────────────┘
```

### **AL FINALIZAR Scan de Retorno:**
```
┌────────────────────────────────────────┐
│ 📊 Resumen de Ventas                   │
├────────────────────────────────────────┤
│ ✅ Doritos (VENDIDO)                   │
│    100% • Calculado                    │
├────────────────────────────────────────┤
│ ✅ Takis (VENDIDO)                     │
│    100% • Calculado                    │
├────────────────────────────────────────┤
│ 🔄 Coca-Cola (Retornado)               │
│    50% • No vendido                    │
└────────────────────────────────────────┘
```

---

## 🔄 Lógica Implementada

### `handleProductDetected()`

```typescript
if (scanType === 'load') {
  // Guardar en Map: productId → productName
  loadedProductsMap.set(productId, productName);
  
  // Mostrar: 📦 Producto (Cargado)
  setDetections([...]);
}

if (scanType === 'return') {
  // Guardar en Set de retornados
  returnedProducts.add(productId);
  
  // Mostrar: 🔄 Producto (Retornado)
  setDetections([...]);
  
  // Calcular vendidos en tiempo real
  calculateAndShowSoldProducts();
}
```

### `showSalesSummary()` (al detener return scan)

```typescript
// Calcular
const loaded = Array.from(loadedProductsMap.keys());
const returned = Array.from(returnedProducts);
const sold = loaded.filter(id => !returnedProducts.has(id));

// Limpiar UI
setDetections([]);

// Mostrar VENDIDOS
sold.forEach(id => {
  const name = loadedProductsMap.get(id);
  UI: ✅ ${name} (VENDIDO)
});

// Mostrar RETORNADOS
returned.forEach(id => {
  const name = loadedProductsMap.get(id);
  UI: 🔄 ${name} (Retornado)
});
```

---

## 🎬 Flujo Completo

```
1. Usuario: Clic en "📦 Escanear Carga"
   ↓
2. Escanea: Coca, Doritos, Takis
   UI: 📦 Coca, 📦 Doritos, 📦 Takis
   ↓
3. Usuario: Clic en "⏹ Detener"
   Sistema: Guarda scanId=32, loadedProductsMap
   ↓
4. Usuario: Clic en "🔄 Escanear Retorno"
   Sistema: Carga productos de scan 32
   ↓
5. Escanea: Solo Coca (lo que quedó)
   UI: 🔄 Coca (Retornado)
   ↓
6. Usuario: Clic en "⏹ Detener"
   ↓
7. Sistema AUTOMÁTICO:
   UI limpiar
   UI agregar: ✅ Doritos (VENDIDO)
   UI agregar: ✅ Takis (VENDIDO)
   UI agregar: 🔄 Coca (Retornado)
   ↓
8. UI final muestra:
   ✅ Doritos (VENDIDO)    ← LO QUE FALTA
   ✅ Takis (VENDIDO)      ← LO QUE FALTA
   🔄 Coca (Retornado)     ← LO QUE QUEDÓ
```

---

## ✅ Resultado Visual

Al **detener** el scan de retorno, verás:

```
╔═══════════════════════════════════════════╗
║  📊 Productos Detectados                  ║
╠═══════════════════════════════════════════╣
║                                           ║
║  ✅ Doritos (VENDIDO)                     ║
║     100% confianza • Calculado            ║
║                                           ║
║  ✅ Takis (VENDIDO)                       ║
║     100% confianza • Calculado            ║
║                                           ║
║  🔄 Coca-Cola Regular Lata (Retornado)    ║
║     50% confianza • Calculado             ║
║                                           ║
╚═══════════════════════════════════════════╝
```

**Los productos que FALTAN (vendidos) se muestran automáticamente al finalizar el scan de retorno.** ✨

---

## 🚀 Para Probar:

1. Abre http://localhost:3002
2. Clic en **"📦 Escanear Carga"**
3. Muestra: Coca, Doritos, Takis
4. Clic en **"⏹ Detener"**
5. Clic en **"🔄 Escanear Retorno"**
6. Muestra: Solo Coca
7. Clic en **"⏹ Detener"**
8. **¡Mira "Productos Detectados"!**
   - ✅ Doritos (VENDIDO)
   - ✅ Takis (VENDIDO)
   - 🔄 Coca-Cola (Retornado)

---

¡Los productos que FALTAN (se vendieron) aparecen automáticamente! 🎉

