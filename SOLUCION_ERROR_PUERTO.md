# 🔧 Solución: Error "Port Already in Use"

## ❌ Error:
```
Error: listen EADDRINUSE: address already in use :::3001
```

## 🔍 Causa:
Hay un proceso anterior del backend que sigue ocupando el puerto 3001.

---

## ✅ Solución Rápida:

### Opción 1: Terminar el proceso automáticamente

```powershell
# 1. Encontrar el proceso en el puerto 3001
netstat -ano | findstr :3001

# 2. Terminar el proceso (reemplaza PID con el número que aparezca)
taskkill /PID [PID] /F
```

### Opción 2: Usar un script automatizado

```powershell
# Todo en un comando
netstat -ano | findstr :3001 | ForEach-Object { $_.Split(' ')[-1] } | ForEach-Object { taskkill /PID $_ /F }
```

---

## 🚀 Después de Terminar el Proceso:

```powershell
# En apps/api
cd apps/api
npm run dev
```

---

## 🎯 Verificación:

Abre en el navegador: `http://localhost:3001/health`

Deberías ver:
```json
{"status":"healthy","timestamp":"..."}
```

---

## 📝 Prevención:

Para evitar este error en el futuro:

1. **Siempre usar `Ctrl+C` para detener el servidor** antes de cerrar la terminal
2. **Verificar que no haya procesos en el puerto** antes de iniciar:
   ```powershell
   netstat -ano | findstr :3001
   ```
3. **Crear un script de limpieza** (opcional):
   ```powershell
   # kill-port.ps1
   param([int]$Port = 3001)
   Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
     ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

---

## 🔗 Comandos Útiles:

| Comando | Descripción |
|---------|-------------|
| `netstat -ano \| findstr :3001` | Ver qué proceso usa el puerto 3001 |
| `taskkill /PID [n] /F` | Terminar proceso por PID |
| `tasklist \| findstr node` | Ver todos los procesos de Node.js |
| `taskkill /F /IM node.exe` | Terminar TODOS los procesos de Node.js (⚠️ usar con cuidado) |

---

**✅ Problema resuelto**: El backend ahora está corriendo correctamente en el puerto 3001.
