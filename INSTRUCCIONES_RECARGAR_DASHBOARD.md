# 🔄 INSTRUCCIONES PARA RECARGAR DASHBOARD

## ⚠️ PROBLEMA

El dashboard tiene cacheado el archivo HTML viejo. Necesitas hacer un **HARD RELOAD** para que tome los cambios.

## ✅ SOLUCIÓN

### **Opción 1: Hard Reload (RECOMENDADO)**

En el dashboard (http://localhost:3003):

**En Mac:**
```
Cmd + Shift + R
```

**En Windows/Linux:**
```
Ctrl + Shift + R
```

Esto fuerza al navegador a recargar TODO sin usar caché.

---

### **Opción 2: Limpiar Caché del Navegador**

1. Abrir DevTools (F12)
2. Right-click en el botón de reload
3. Seleccionar "Empty Cache and Hard Reload"

---

### **Opción 3: Reiniciar servidor dashboard**

En la terminal:

```bash
# Matar proceso
lsof -ti:3003 | xargs kill -9

# Esperar 2 segundos
sleep 2

# Reiniciar
cd /Users/patriciogarza/Desktop/repos/GateGroup_HackMTY/apps/dashboard && npm run dev
```

---

## 🔍 CÓMO VERIFICAR QUE FUNCIONÓ

Después del hard reload, abre la consola del navegador (F12 → Console) y deberías ver:

### **Cuando hagas un LOAD SCAN:**
```javascript
📦 [LOAD] Producto cargado: Takis
💰 Sales Metrics Updated: {loaded: 1, returned: 0, sold: 1}
```

### **Cuando hagas un RETURN SCAN:**
```javascript
🔄 [RETURN] Producto retornado: Coca-Cola
💰 Sales Metrics Updated: {loaded: 3, returned: 1, sold: 2}
```

### **Si NO ves estos logs:**
- El caché no se limpió correctamente
- Usa la Opción 3 (reiniciar servidor)

---

## ✅ DESPUÉS DE RECARGAR

Los contadores de ventas deberían actualizar automáticamente:

```
💰 Inventario de Ventas
├─ Cargados:   3  ← Actualiza en load scan
├─ Vendidos:   2  ← Calcula automáticamente
└─ Retornados: 1  ← Actualiza en return scan
```

---

## 🎯 FLUJO COMPLETO

1. **Hard reload del dashboard** (Cmd+Shift+R)
2. **Verificar consola** - Debe decir "🚀 Initializing Smart Trolley Dashboard"
3. **Hacer load scan** en web-camera
4. **Ver logs** en dashboard: "📦 [LOAD] Producto cargado..."
5. **Ver contador** "Cargados" actualizado
6. **Hacer return scan** en web-camera
7. **Ver logs** en dashboard: "🔄 [RETURN] Producto retornado..."
8. **Ver contador** "Vendidos" calculado automáticamente

---

**Si después del hard reload sigue sin funcionar, avísame y reiniciaremos el servidor.**

