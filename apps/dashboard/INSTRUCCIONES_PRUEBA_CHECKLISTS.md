# 🧪 INSTRUCCIONES PARA PROBAR CHECKLISTS

## ✅ **PROBLEMAS CORREGIDOS:**

### **1. Productos Actualizados:**
- ✅ **TODOS los productos** son de los 6 disponibles
- ✅ **Santa Clara, Coca-Cola, Coca-Cola Light, Takis Fuego, Doritos, Lays (Sabritas)**

### **2. Sistema de Actualización Arreglado:**
- ✅ **Búsqueda por nombre** (no por ID)
- ✅ **Logs de consola** para debugging
- ✅ **Botón de prueba** para simular detecciones

---

## 🚀 **CÓMO PROBAR:**

### **PASO 1: Abrir Dashboard**
1. Ir a: http://localhost:3003
2. Verificar que carga correctamente

### **PASO 2: Seleccionar Checklist**
1. En el dropdown, seleccionar cualquier checklist
2. Ver que aparecen 5 productos
3. Todos deben estar como "⏳ Pendiente"

### **PASO 3: Probar con Botón de Prueba**
1. Hacer clic en "🧪 Test Detection"
2. Ver que un producto se marca como "✅ Detectado"
3. Ver que la barra de progreso se actualiza
4. Ver que el contador cambia (ej: 1/5 completados)

### **PASO 4: Probar Múltiples Detecciones**
1. Hacer clic varias veces en "🧪 Test Detection"
2. Ver que los productos se van marcando
3. Ver que la confianza y cantidad se actualizan
4. Ver que el progreso llega a 100%

### **PASO 5: Cambiar Checklist**
1. Seleccionar otra checklist
2. Ver que se resetea el progreso
3. Probar nuevamente con "🧪 Test Detection"

---

## 🔍 **DEBUGGING:**

### **Consola del Navegador:**
1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Ver logs como:
   ```
   🎯 Checklist: Product detected: {product_name: "Santa Clara", ...}
   ✅ Checklist: Updated product: Santa Clara Status: detected
   ```

### **Si No Funciona:**
1. Verificar que hay una checklist seleccionada
2. Verificar que el botón "🧪 Test Detection" está visible
3. Verificar logs en consola
4. Recargar la página si es necesario

---

## 📋 **CHECKLISTS DISPONIBLES:**

### **1. 🥤 Checklist Bebidas (3 productos)**
- Santa Clara (1x)
- Coca-Cola (1x)
- Coca-Cola Light (1x)

### **2. 🍿 Checklist Snacks (3 productos)**
- Takis Fuego (1x)
- Doritos (1x)
- Lays (Sabritas) (1x)

### **3. 🥤 Checklist Refrescos (3 productos)**
- Coca-Cola (1x)
- Coca-Cola Light (1x)
- Santa Clara (1x)

### **4. 🥔 Checklist Papas (3 productos)**
- Lays (Sabritas) (1x)
- Doritos (1x)
- Takis Fuego (1x)

### **5. 🛒 Checklist Mixto (5 productos)**
- Santa Clara (1x)
- Coca-Cola (1x)
- Takis Fuego (1x)
- Doritos (1x)
- Lays (Sabritas) (1x)

---

## 🎯 **RESULTADO ESPERADO:**

### **Funcionamiento Correcto:**
- ✅ **Selección de checklist** funciona
- ✅ **Botón de prueba** simula detecciones
- ✅ **Productos se marcan** automáticamente
- ✅ **Progreso se actualiza** en tiempo real
- ✅ **Logs aparecen** en consola
- ✅ **Animaciones funcionan**

### **Para Demo Real:**
- ✅ **WebSocket conectado** a puerto 3001
- ✅ **Detecciones reales** de Gemini
- ✅ **Productos físicos** se detectan automáticamente
- ✅ **Checklist se completa** sin intervención manual

---

## 🚀 **¡LISTO PARA PROBAR!**

**El sistema está corregido y listo para funcionar con los productos reales disponibles.** 🎉
