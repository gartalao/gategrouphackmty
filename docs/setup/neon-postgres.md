# Setup de Neon Postgres

Guía paso a paso para configurar la base de datos PostgreSQL usando **Neon** (servicio serverless).

## ¿Por Qué Neon?

**Ventajas para hackathons**:
- ✅ Setup en **menos de 5 minutos**
- ✅ Free tier generoso (512 MB RAM, 3 GB storage)
- ✅ No requiere servidor propio
- ✅ Auto-scaling y auto-pause (ahorro de costos)
- ✅ Conexión estándar PostgreSQL (compatible con cualquier ORM)
- ✅ Branching de base de datos (útil para testing)

**Alternativas consideradas**:
- **Supabase**: Más completo (incluye auth, storage), pero más overhead
- **PostgreSQL local**: Requiere instalación y configuración manual
- **AWS RDS**: Más caro y complejo de configurar

---

## Paso 1: Crear Cuenta en Neon

1. Ir a [https://neon.tech](https://neon.tech)
2. Hacer clic en **"Sign Up"**
3. Opciones de registro:
   - GitHub (recomendado para velocidad)
   - Google
   - Email

**Tiempo**: ~1 minuto

---

## Paso 2: Crear Proyecto

1. Una vez logueado, hacer clic en **"Create a Project"**
2. Configuración:
   - **Project Name**: `smart-trolley-hackmty`
   - **Region**: Elegir más cercano (ej: `us-east-1` o `eu-central-1`)
   - **PostgreSQL Version**: `16` (latest stable)
   - **Compute Size**: `Shared` (suficiente para MVP)

3. Hacer clic en **"Create Project"**

**Tiempo**: ~30 segundos (Neon provisiona automáticamente)

---

## Paso 3: Obtener Connection String

Neon muestra inmediatamente el **Connection String** (también llamado `DATABASE_URL`).

**Formato**:
```
postgresql://[username]:[password]@[endpoint]/[database]?sslmode=require
```

**Ejemplo**:
```
postgresql://smart_trolley_user:AbCdEf123456@ep-cool-water-12345.us-east-1.aws.neon.tech/smart_trolley_db?sslmode=require
```

### Componentes de la URL

| Parte | Descripción | Ejemplo |
|-------|-------------|---------|
| `username` | Usuario de DB (auto-generado) | `smart_trolley_user` |
| `password` | Contraseña (auto-generada) | `AbCdEf123456` |
| `endpoint` | Hostname del servidor Neon | `ep-cool-water-12345.us-east-1.aws.neon.tech` |
| `database` | Nombre de la base de datos | `smart_trolley_db` |
| `sslmode` | **Siempre `require`** (Neon requiere SSL) | `require` |

### Guardar en Seguro

⚠️ **IMPORTANTE**: Esta contraseña se muestra **solo una vez**. Guardarla inmediatamente en:
- Gestor de contraseñas (1Password, LastPass, etc.)
- Variable de entorno local (`.env` — no commitear a Git)

**Copiar el string completo** para usar en el siguiente paso.

---

## Paso 4: Crear el Schema de Tablas

Neon no incluye editor SQL en el tier gratuito. Opciones para ejecutar el schema:

### Opción A: Usando `psql` (Command Line)

**Prerequisitos**: Tener `psql` instalado localmente

**macOS** (con Homebrew):
```bash
brew install postgresql
```

**Ubuntu/Debian**:
```bash
sudo apt-get install postgresql-client
```

**Windows**: Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)

**Conectar a Neon**:
```bash
psql "postgresql://smart_trolley_user:AbCdEf123456@ep-cool-water-12345.us-east-1.aws.neon.tech/smart_trolley_db?sslmode=require"
```

**Ejecutar schema** (copiar desde [data-model.md](../architecture/data-model.md)):
```sql
-- Crear tablas una por una
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    unit_price DECIMAL(10,2),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... (continuar con todas las tablas)
```

---

### Opción B: Usando DBeaver o TablePlus (GUI)

**DBeaver** (gratuito, multiplataforma):
1. Descargar desde [dbeaver.io](https://dbeaver.io)
2. Nueva Conexión → PostgreSQL
3. Ingresar datos del Connection String:
   - Host: `ep-cool-water-12345.us-east-1.aws.neon.tech`
   - Port: `5432`
   - Database: `smart_trolley_db`
   - Username: `smart_trolley_user`
   - Password: `AbCdEf123456`
   - ✅ Habilitar "Use SSL"
4. Test Connection → OK
5. Abrir SQL Editor y pegar schema completo
6. Ejecutar (Ctrl+Enter)

**TablePlus** (comercial, UI más moderna):
- Similar a DBeaver pero con interfaz más pulida
- Trial de 14 días gratuito

---

### Opción C: Script de Node.js (Automatizado)

**Archivo**: `scripts/setup-db.js`

```javascript
const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL;

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Neon requiere SSL
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Neon Postgres');

    const schema = fs.readFileSync('./schema.sql', 'utf8');
    await client.query(schema);
    
    console.log('✅ Schema creado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
```

**Ejecutar**:
```bash
export DATABASE_URL="postgresql://..."
node scripts/setup-db.js
```

---

## Paso 5: Poblar Datos de Prueba

### Insertar Productos de Ejemplo

```sql
INSERT INTO products (sku, name, category, brand, unit_price, image_url) VALUES
('COK-REG-330', 'Coca-Cola Regular 330ml', 'Bebidas', 'Coca-Cola', 1.50, NULL),
('COK-ZER-330', 'Coca-Cola Zero 330ml', 'Bebidas', 'Coca-Cola', 1.50, NULL),
('PEP-REG-330', 'Pepsi Regular 330ml', 'Bebidas', 'PepsiCo', 1.50, NULL),
('WTR-REG-500', 'Agua Natural 500ml', 'Bebidas', 'Bonafont', 0.80, NULL),
('WTR-SPK-500', 'Agua con Gas 500ml', 'Bebidas', 'Topo Chico', 1.00, NULL),
('JUC-ORA-250', 'Jugo de Naranja 250ml', 'Bebidas', 'Jumex', 1.20, NULL),
('JUC-APP-250', 'Jugo de Manzana 250ml', 'Bebidas', 'Jumex', 1.20, NULL),
('SNK-PRT-50', 'Pretzels Salados 50g', 'Snacks', 'Snyder''s', 2.00, NULL),
('SNK-CHI-40', 'Chips Papas 40g', 'Snacks', 'Lays', 1.80, NULL),
('SNK-NUT-35', 'Nueces Mixtas 35g', 'Snacks', 'Planters', 2.50, NULL);
```

### Crear Usuario de Prueba

```sql
-- Primero instalar bcrypt para hash de password (en backend)
-- Password hash para "password123"
INSERT INTO users (username, password_hash, full_name, role) VALUES
('operator01', '$2b$10$N9qo8uLOickgx2ZnVGvJveY/sUpMKrX8TDmX2hjXqR/EoG1z3iHRS', 'Juan Pérez', 'operator'),
('admin', '$2b$10$N9qo8uLOickgx2ZnVGvJveY/sUpMKrX8TDmX2hjXqR/EoG1z3iHRS', 'Admin Sistema', 'admin');
```

### Crear Vuelo y Trolley de Prueba

```sql
-- Vuelo de ejemplo
INSERT INTO flights (flight_number, departure_time, origin, destination, status) VALUES
('AA2345', '2025-10-26 14:30:00', 'MEX', 'JFK', 'scheduled');

-- Trolley de ejemplo
INSERT INTO trolleys (trolley_code, flight_id, status, total_shelves, assigned_at) VALUES
('TRLLY-001', 1, 'in_progress', 3, NOW());

-- Shelves del trolley
INSERT INTO shelves (trolley_id, shelf_number, qr_code, position) VALUES
(1, 1, 'QR-TRLLY001-SH1', 'top'),
(1, 2, 'QR-TRLLY001-SH2', 'middle'),
(1, 3, 'QR-TRLLY001-SH3', 'bottom');

-- Flight requirements de ejemplo
INSERT INTO flight_requirements (flight_id, trolley_id, product_id, expected_quantity, priority) VALUES
(1, 1, 1, 24, 'normal'),    -- 24 Coca-Colas
(1, 1, 4, 30, 'critical'),  -- 30 Aguas (crítico)
(1, 1, 8, 12, 'normal'),    -- 12 Pretzels
(1, 1, 2, 12, 'normal'),    -- 12 Coca-Colas Zero
(1, 1, 6, 18, 'normal');    -- 18 Jugos Naranja
```

---

## Paso 6: Verificar Conexión desde Backend

**Test de conexión** (Node.js):

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa. Timestamp del servidor:', result.rows[0].now);
    
    const products = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`✅ Productos en catálogo: ${products.rows[0].count}`);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
```

---

## Configuración Avanzada (Opcional)

### Branching (para testing)

Neon permite crear "branches" de la DB (similar a Git):

1. Dashboard de Neon → **"Branches"**
2. **"Create Branch"** desde `main`
3. Nombre: `testing`
4. Usar connection string del branch para pruebas

**Ventaja**: Puedes experimentar sin afectar la DB principal.

---

### Configuración de Roles y Permisos

Por defecto, Neon crea un usuario con privilegios completos. Para producción futura:

```sql
-- Crear usuario de solo lectura (para dashboards)
CREATE USER dashboard_viewer WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dashboard_viewer;

-- Crear usuario de escritura limitada (para backend)
CREATE USER backend_api WITH PASSWORD 'another_secure_password';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO backend_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO backend_api;
```

---

### Auto-pause (Ahorro de Recursos)

Neon pausa automáticamente la DB si no hay actividad por 5 minutos (en free tier).

**Implicación**:
- Primera query después de pausa tarda ~1-2 segundos (cold start)
- Para hackathon, esto es aceptable
- Para producción, considerar plan pago con "always-on"

**Nota**: Durante el hack, la DB se mantendrá activa por el tráfico constante de scans.

---

## Troubleshooting

### Error: "SSL connection required"

**Solución**: Asegurarse de que el connection string incluya `?sslmode=require`

```javascript
// ✅ Correcto
ssl: { rejectUnauthorized: false }

// ❌ Incorrecto (sin SSL)
ssl: false
```

---

### Error: "password authentication failed"

**Solución**: Verificar que el password esté URL-encoded si contiene caracteres especiales

```javascript
// Si password es: P@ssw0rd!123
// URL-encoded: P%40ssw0rd%21123

const encoded = encodeURIComponent('P@ssw0rd!123');
const DATABASE_URL = `postgresql://user:${encoded}@host/db`;
```

---

### Error: "too many connections"

**Causa**: Free tier de Neon limita a **100 conexiones concurrentes**

**Solución**: Usar connection pooling

```javascript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,  // Máximo 10 conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

---

## Respaldos y Exportación

### Exportar Schema

```bash
pg_dump --schema-only "$DATABASE_URL" > schema_backup.sql
```

### Exportar Datos

```bash
pg_dump "$DATABASE_URL" > full_backup.sql
```

### Restaurar (en otra instancia)

```bash
psql "$NEW_DATABASE_URL" < full_backup.sql
```

---

## Monitoreo en Neon Dashboard

El dashboard de Neon provee métricas básicas:
- **Queries ejecutadas**: Contador en tiempo real
- **Storage usado**: GB utilizados del límite
- **Uptime**: Estado de la DB (active/paused)
- **Branches**: Lista de branches activos

**Acceso**: [https://console.neon.tech/app/projects/YOUR_PROJECT_ID](https://console.neon.tech)

---

## Siguiente Paso

Guardar el `DATABASE_URL` en variables de entorno del backend:

👉 Ver [Variables de Entorno](env-variables.md)

---

## Referencias

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Connection Pooling](https://node-postgres.com/features/pooling)
- [Modelo de Datos](../architecture/data-model.md) — Schema completo

