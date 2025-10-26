# 🔧 Arreglo del Error de Return Scan

## ❌ **Problema Identificado:**

**Error:** `Failed to start return scan`
**Causa:** El backend estaba verificando que `trolleyId` y `operatorId` existieran en la base de datos, pero la web-camera enviaba IDs hardcodeados (123, 456) que no existían.

## ✅ **Solución Implementada:**

### **Cambio 1: Usar IDs del Scan Original**
```javascript
// ANTES: Usar IDs enviados por el cliente
const trolleyIdToUse = trolleyId || originalScan.trolleyId;
const operatorIdToUse = operatorId || originalScan.operatorId;

// AHORA: Usar IDs del scan original (que sí existen)
const trolleyIdToUse = originalScan.trolleyId;
const operatorIdToUse = originalScan.operatorId;
```

### **Cambio 2: Simplificar Creación del Return Scan**
```javascript
// ANTES: Verificaciones complejas de existencia
let validTrolleyId = null;
if (trolleyIdToUse) {
  const trolleyExists = await prisma.trolley.findUnique({...});
  // ... lógica compleja
}

// AHORA: Crear directamente con IDs del scan original
const returnScan = await prisma.returnScan.create({
  data: {
    scanId,
    trolleyId: trolleyIdToUse,
    operatorId: operatorIdToUse,
    status: 'recording',
    startedAt: new Date(),
  },
});
```

### **Cambio 3: Mejor Logging y Manejo de Errores**
```javascript
// Agregado logging detallado
console.log(`[WS] 🔄 Iniciando return scan para scanId: ${scanId}`);
console.log(`[WS] 📊 Parámetros recibidos:`, { scanId, trolleyId, operatorId });

// Mejor manejo de errores
catch (error) {
  console.error('[WS] ❌ Error starting return scan:', error);
  console.error('[WS] 📝 Error details:', {
    message: error.message,
    stack: error.stack,
    payload: payload
  });
  ack?.({ error: `Failed to start return scan: ${error.message}` });
}
```

## 🎯 **Resultado:**

**El return scan ahora debería funcionar correctamente porque:**
- ✅ Usa IDs válidos del scan original
- ✅ No depende de IDs hardcodeados del cliente
- ✅ Tiene mejor logging para debuggear
- ✅ Manejo de errores más detallado

## 🧪 **Próxima Prueba:**

1. **Recarga la web-camera** para aplicar cambios
2. **Inicia un scan normal** (carga)
3. **Presiona "Escanear Retorno"**
4. **Verifica** que no hay errores en consola
5. **Revisa logs del backend** para confirmar éxito

## 📊 **Logs Esperados:**

**Backend:**
```
[WS] 🔄 Iniciando return scan para scanId: 48
[WS] 📊 Parámetros recibidos: { scanId: 48, trolleyId: 123, operatorId: 456 }
[WS] 🔄 Creando return scan para scan original 48
[WS] 📊 Usando trolleyId: [ID_REAL], operatorId: [ID_REAL]
[WS] ✅ Return Scan [ID] started for original scan 48
```

**Web-camera:**
```
[WebSocket] 📡 Enviando start_return_scan: {scanId: 48, trolleyId: 123, operatorId: 456}
[WebSocket] ✅ Return scan iniciado: {returnScanId: [ID], scanId: 48, status: 'recording'}
```

**¡El return scan debería funcionar ahora!** 🚀
