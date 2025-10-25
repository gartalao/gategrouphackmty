# Variables de Entorno

Especificación de todas las variables de entorno necesarias para configurar los componentes del sistema Smart Trolley.

## Variables por Componente

### Backend (API Express)

Archivo: `apps/api/.env`

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `PORT` | Puerto donde escucha el servidor | `3001` | ❌ (default: 3001) |
| `DATABASE_URL` | Connection string de Neon Postgres | `postgresql://user:pass@host/db?sslmode=require` | ✅ |
| `OPENAI_API_KEY` | API key de OpenAI para Vision LLM | `sk-proj-abc123...` | ✅ |
| `JWT_SECRET` | Secret para firmar tokens JWT | `my_super_secret_key_2025` | ✅ |
| `STORAGE_DIR` | Directorio para almacenar imágenes | `./storage/scans` | ❌ (default: `./storage`) |
| `NODE_ENV` | Entorno de ejecución | `development` o `production` | ❌ (default: `development`) |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` | ❌ (default: `*`) |
| `LOG_LEVEL` | Nivel de logging | `info`, `debug`, `error` | ❌ (default: `info`) |

---

### Dashboard (Next.js)

Archivo: `apps/dashboard/.env.local`

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | URL del backend API | `http://localhost:3001/api` | ✅ |
| `NEXT_PUBLIC_WS_URL` | URL del WebSocket | `ws://localhost:3001` | ✅ |

**Nota**: Variables con prefijo `NEXT_PUBLIC_` son expuestas al cliente (browser).

---

### Mobile (Expo React Native)

Archivo: `apps/mobile-shelf/.env`

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `EXPO_PUBLIC_API_URL` | URL del backend API | `http://192.168.1.100:3001/api` | ✅ |
| `EXPO_PUBLIC_SCAN_INTERVAL_MS` | Intervalo entre scans en milisegundos | `5000` | ❌ (default: 5000) |
| `EXPO_PUBLIC_IMAGE_QUALITY` | Calidad de compresión JPEG (0-1) | `0.80` | ❌ (default: 0.80) |
| `EXPO_PUBLIC_IMAGE_MAX_WIDTH` | Ancho máximo de imagen en px | `1280` | ❌ (default: 1280) |

**Nota**: Variables con prefijo `EXPO_PUBLIC_` son expuestas en el bundle de la app.

---

## Ejemplos de Archivos `.env`

### `apps/api/.env`

```bash
# Puerto del servidor
PORT=3001

# Base de datos (Neon Postgres)
DATABASE_URL=postgresql://smart_trolley_user:AbCdEf123456@ep-cool-water-12345.us-east-1.aws.neon.tech/smart_trolley_db?sslmode=require

# OpenAI Vision API
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901

# Autenticación JWT
JWT_SECRET=my_super_secret_key_for_hackmty_2025_change_in_production

# Storage
STORAGE_DIR=./storage/scans

# Entorno
NODE_ENV=development

# CORS (permitir dashboard local)
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

---

### `apps/dashboard/.env.local`

```bash
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# URL del WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

**Para producción** (Vercel deploy):
```bash
NEXT_PUBLIC_API_URL=https://api.smarttrolley.com/api
NEXT_PUBLIC_WS_URL=wss://api.smarttrolley.com
```

---

### `apps/mobile-shelf/.env`

```bash
# URL del backend API (usar IP local para desarrollo)
# Encontrar IP con: ifconfig (Mac/Linux) o ipconfig (Windows)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001/api

# Configuración de captura
EXPO_PUBLIC_SCAN_INTERVAL_MS=5000
EXPO_PUBLIC_IMAGE_QUALITY=0.80
EXPO_PUBLIC_IMAGE_MAX_WIDTH=1280
```

**Nota importante**: `localhost` NO funciona en Expo (el teléfono no puede acceder a localhost de la computadora). Usar IP local de la red WiFi.

---

## Cómo Obtener Valores de las Variables

### 1. `DATABASE_URL`

Obtener de Neon Postgres después de crear proyecto:

1. Ir a [console.neon.tech](https://console.neon.tech)
2. Seleccionar proyecto `smart-trolley-hackmty`
3. Dashboard → **"Connection Details"**
4. Copiar el connection string completo

**Formato**:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

⚠️ **Verificar que incluya `?sslmode=require`** al final.

Ver guía completa: [Neon Postgres Setup](neon-postgres.md)

---

### 2. `OPENAI_API_KEY`

Obtener API key de OpenAI:

1. Ir a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Hacer login o crear cuenta
3. Click en **"Create new secret key"**
4. Nombre: `smart-trolley-hackmty`
5. Copiar la key (empieza con `sk-proj-...`)

⚠️ **Se muestra solo una vez**. Guardar en seguro.

**Costo estimado para 36h de hack**:
- Modelo: `gpt-4o-mini`
- Imágenes: ~7,000
- Costo: $70-140 USD

**Alternativa gratuita** (para testing inicial):
- Usar mock responses en el backend
- Implementar después cuando funcione el flujo completo

---

### 3. `JWT_SECRET`

Generar un secret aleatorio seguro:

**Opción A: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción B: OpenSSL**
```bash
openssl rand -hex 32
```

**Opción C: Manual (menos seguro)**
```
my_super_secret_key_for_hackmty_2025_change_in_production
```

**Resultado esperado** (ejemplo):
```
4f3d8a9c2e1b7f6a5d8c3e9f1a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
```

---

### 4. `CORS_ORIGIN`

Configurar según entorno:

**Desarrollo local**:
```bash
CORS_ORIGIN=http://localhost:3000
```

**Múltiples orígenes** (separados por coma):
```bash
CORS_ORIGIN=http://localhost:3000,http://192.168.1.100:3000
```

**Producción**:
```bash
CORS_ORIGIN=https://dashboard.smarttrolley.com
```

**Permitir todo** (⚠️ solo para dev):
```bash
CORS_ORIGIN=*
```

---

### 5. IP Local para Mobile App

Encontrar IP de tu computadora en la red WiFi:

**macOS**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux**:
```bash
hostname -I | awk '{print $1}'
```

**Windows** (PowerShell):
```powershell
ipconfig | findstr IPv4
```

**Resultado esperado**:
```
192.168.1.100  (o similar)
```

Usar esta IP en `EXPO_PUBLIC_API_URL`:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

---

## Validación de Variables

### Script de Validación (Node.js)

Archivo: `scripts/validate-env.js`

```javascript
require('dotenv').config();

const requiredVars = {
  backend: ['DATABASE_URL', 'OPENAI_API_KEY', 'JWT_SECRET'],
  dashboard: ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL'],
  mobile: ['EXPO_PUBLIC_API_URL']
};

function validateEnv(vars, prefix = '') {
  const missing = [];
  
  for (const varName of vars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error(`❌ ${prefix}Faltan variables de entorno:`);
    missing.forEach(v => console.error(`   - ${v}`));
    return false;
  }
  
  console.log(`✅ ${prefix}Todas las variables requeridas están presentes`);
  return true;
}

// Validar backend
if (process.argv.includes('--backend')) {
  validateEnv(requiredVars.backend, '[Backend] ');
}

// Validar dashboard
if (process.argv.includes('--dashboard')) {
  validateEnv(requiredVars.dashboard, '[Dashboard] ');
}

// Validar mobile
if (process.argv.includes('--mobile')) {
  validateEnv(requiredVars.mobile, '[Mobile] ');
}
```

**Uso**:
```bash
node scripts/validate-env.js --backend
node scripts/validate-env.js --dashboard
node scripts/validate-env.js --mobile
```

---

## Seguridad y Buenas Prácticas

### ✅ SÍ Hacer

1. **Usar archivos `.env` locales** (no commitear a Git)
   ```bash
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Diferentes secrets por entorno**
   - Development: `JWT_SECRET_DEV`
   - Production: `JWT_SECRET_PROD` (diferente valor)

3. **Rotar API keys** después del hackathon
   - Eliminar `OPENAI_API_KEY` usada
   - Generar nueva para proyecto real

4. **Usar gestores de secrets** en producción
   - Vercel: Environment Variables
   - Render: Environment Variables
   - AWS: Secrets Manager

---

### ❌ NO Hacer

1. ❌ **NO** commitear `.env` a Git
2. ❌ **NO** hardcodear secrets en código
   ```javascript
   // ❌ MAL
   const JWT_SECRET = 'mi_secret_123';
   
   // ✅ BIEN
   const JWT_SECRET = process.env.JWT_SECRET;
   ```

3. ❌ **NO** exponer variables sensibles en frontend
   ```javascript
   // ❌ MAL (DATABASE_URL no debe estar en cliente)
   NEXT_PUBLIC_DATABASE_URL=postgresql://...
   
   // ✅ BIEN (solo exponer URLs de API pública)
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. ❌ **NO** compartir `.env` por Slack/WhatsApp
   - Usar gestores de contraseñas (1Password shared vault)
   - O cifrar con GPG antes de compartir

---

## Ejemplo de Setup Completo

### Paso 1: Clonar Variables de Ejemplo

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Dashboard
cp apps/dashboard/.env.example apps/dashboard/.env.local

# Mobile
cp apps/mobile-shelf/.env.example apps/mobile-shelf/.env
```

### Paso 2: Rellenar Valores

Editar cada `.env` con los valores obtenidos arriba.

### Paso 3: Validar

```bash
cd apps/api
node ../../scripts/validate-env.js --backend
```

### Paso 4: Probar Conexión

```bash
# Backend
cd apps/api
npm run test:db  # Script que hace SELECT NOW()

# Dashboard
cd apps/dashboard
npm run dev  # Verificar que conecta a backend

# Mobile
cd apps/mobile-shelf
npx expo start  # Escanear QR y probar en teléfono
```

---

## Variables Opcionales Avanzadas

Para optimización o debugging:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MAX_IMAGE_SIZE_MB` | Tamaño máximo de imagen permitido | `10` |
| `VISION_MODEL` | Modelo de OpenAI a usar | `gpt-4o-mini` |
| `VISION_TIMEOUT_MS` | Timeout para llamadas a Vision API | `15000` |
| `DB_POOL_MAX` | Máximo conexiones en pool de DB | `10` |
| `SCAN_RETENTION_DAYS` | Días para retener imágenes | `7` |
| `ENABLE_OFFLINE_QUEUE` | Habilitar cola offline en mobile | `true` |
| `MAX_OFFLINE_QUEUE_SIZE` | Máximo items en cola offline | `50` |

---

## Troubleshooting

### Error: "DATABASE_URL is not defined"

**Solución**:
```bash
# Verificar que el archivo .env existe
ls -la apps/api/.env

# Verificar que dotenv está cargando
# En apps/api/index.js (primera línea):
require('dotenv').config();
```

---

### Error: "fetch failed" al llamar API desde mobile

**Causa**: IP incorrecta o backend no escuchando en todas las interfaces

**Solución**:
```javascript
// Backend debe escuchar en 0.0.0.0, no en localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

---

## Referencias

- [Neon Postgres Setup](neon-postgres.md) — Obtener DATABASE_URL
- [API Express Setup](api-express-setup.md) — Configuración del backend
- [Dashboard Next Setup](dashboard-next-setup.md) — Configuración del dashboard
- [Mobile Expo Setup](mobile-expo-setup.md) — Configuración de app móvil

