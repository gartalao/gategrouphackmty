# Roles y Tareas para 36 Horas

División de trabajo por roles y estimación de tareas para completar el MVP en 36 horas de HackMTY.

## Equipo Recomendado (4-5 Personas)

| Rol | Responsabilidades | Skills Requeridos |
|-----|-------------------|-------------------|
| **Mobile Developer** (1) | App React Native Expo | React Native, cámara, AsyncStorage |
| **Backend Developer** (1-2) | API Express, Vision LLM, DB | Node.js, PostgreSQL, APIs REST |
| **Frontend Developer** (1) | Dashboard Next.js | React, Next.js, Tailwind, WebSocket |
| **DevOps/Full-stack** (1) | Setup infraestructura, integración | Neon, Vercel, debugging general |

**Líder de Proyecto**: Coordina, maneja tiempos, presenta demo

---

## División de Tareas por Rol

### 📱 Mobile Developer

#### Horas 0-6: Setup y Captura Básica
- [ ] Crear proyecto Expo con React Native (30 min)
- [ ] Configurar permisos de cámara en `app.json` (15 min)
- [ ] Implementar captura de foto con `expo-camera` (1 hora)
- [ ] Implementar compresión con `expo-image-manipulator` (1 hora)
- [ ] Crear timer de 5 segundos para captura automática (30 min)
- [ ] Implementar upload vía FormData a backend (1 hora)
- [ ] Probar en dispositivo Android físico (1 hora)

**Entregable**: App que captura y envía fotos cada 5s

#### Horas 6-12: UI y Configuración
- [ ] Implementar scanner de QR code con `expo-barcode-scanner` (1 hora)
- [ ] Guardar configuración (shelf_id, trolley_id) en AsyncStorage (30 min)
- [ ] Crear pantalla principal con status e indicadores (1.5 horas)
- [ ] Habilitar keep-awake para evitar suspensión (15 min)
- [ ] Implementar kiosk mode / task pinning (30 min)
- [ ] Estilos básicos con Tailwind/styled-components (1 hora)
- [ ] Testing en 3 dispositivos simultáneamente (1.5 horas)

**Entregable**: App completa con UI y configuración

#### Horas 12-24: Cola Offline y Refinamiento
- [ ] Implementar cola offline en AsyncStorage (2 horas)
- [ ] Lógica de reintentos con exponential backoff (1.5 horas)
- [ ] Indicadores visuales de estado de conexión (1 hora)
- [ ] Optimización de batería y performance (1 hora)
- [ ] Testing de escenarios offline (1.5 horas)

**Entregable**: App robusta con manejo de errores

#### Horas 24-36: Integración Final y Testing
- [ ] Integración con backend final (1 hora)
- [ ] Testing end-to-end con trolley físico (2 horas)
- [ ] Fix de bugs encontrados (2 horas)
- [ ] Preparación de APKs para los 3 teléfonos (1 hora)
- [ ] Instalación y configuración en hardware (2 horas)
- [ ] Prueba de demo completa (2 horas)

---

### 🔧 Backend Developer(s)

#### Horas 0-6: Setup de Infraestructura
- [ ] Crear proyecto Node.js + Express (30 min)
- [ ] Configurar Neon Postgres y obtener DATABASE_URL (30 min)
- [ ] Crear schema SQL con todas las tablas (1 hora)
- [ ] Setup de pg connection pool (30 min)
- [ ] Configurar variables de entorno (.env) (15 min)
- [ ] Implementar endpoint `/health` (15 min)
- [ ] Implementar endpoint `POST /auth/login` con JWT (1.5 horas)
- [ ] Poblar DB con datos de prueba (productos, flight, trolley) (1 hora)

**Entregable**: Backend básico con DB conectada

#### Horas 6-12: Endpoint de Scan
- [ ] Configurar Multer para upload de imágenes (1 hora)
- [ ] Implementar `POST /scan` que guarda imagen y metadata (2 horas)
- [ ] Integrar con OpenAI Vision API (2 horas)
- [ ] Parsear y validar JSON con Ajv (1 hora)
- [ ] Insertar scan_items en DB (1 hour)
- [ ] Testing con Postman (1 hora)

**Entregable**: Endpoint /scan funcional

#### Horas 12-24: Cálculo de Diffs y Alertas
- [ ] Implementar lógica de cálculo de diffs (2 horas)
- [ ] Implementar generación de alertas (1.5 horas)
- [ ] Configurar Socket.io para WebSocket (1 hora)
- [ ] Emitir eventos `scan_processed` y `alert_created` (1 hora)
- [ ] Implementar endpoints GET (flights, trolleys, kpis) (2.5 horas)
- [ ] Testing de integración completa (2 horas)

**Entregable**: Sistema completo de detección y alertas

#### Horas 24-36: Optimización y Deploy
- [ ] Optimización de queries SQL (1 hora)
- [ ] Implementación de error handling robusto (1.5 horas)
- [ ] Logging con Winston (1 hora)
- [ ] Deploy a Render/Railway (1.5 horas)
- [ ] Testing de carga (simular 9 cámaras simultáneas) (2 horas)
- [ ] Fix de bugs de última hora (3 horas)
- [ ] Preparación para demo (monitoreo de logs) (1 hora)

---

### 🌐 Frontend Developer

#### Horas 0-6: Setup de Dashboard
- [ ] Crear proyecto Next.js 14 (30 min)
- [ ] Configurar Tailwind CSS (30 min)
- [ ] Crear estructura de páginas (dashboard, trolleys, kpis) (1 hora)
- [ ] Configurar variables de entorno (API_URL, WS_URL) (15 min)
- [ ] Implementar login básico con JWT (1.5 horas)
- [ ] Crear componentes base (Card, Button, Badge) (1.5 horas)
- [ ] Setup de React Query (30 min)

**Entregable**: Proyecto Next.js funcional

#### Horas 6-12: Vista de Trolleys
- [ ] Implementar página `/trolleys/[id]` (2 horas)
- [ ] Crear componente ShelfCard con semáforo (1.5 horas)
- [ ] Integrar con API REST para obtener datos (1 hora)
- [ ] Configurar Socket.io client (1 hour)
- [ ] Implementar auto-refresh con React Query (30 min)
- [ ] Estilos y responsive design (1.5 horas)

**Entregable**: Vista de trolley funcional

#### Horas 12-24: KPIs y Alertas en Vivo
- [ ] Implementar página `/kpis` con gráficas (3 horas)
- [ ] Integrar Recharts para visualizaciones (1.5 horas)
- [ ] Crear componente AlertPanel (1 hora)
- [ ] Implementar WebSocket listeners para eventos en vivo (1.5 horas)
- [ ] Agregar notificaciones toast con react-hot-toast (1 hora)
- [ ] Testing de actualización en tiempo real (2 horas)

**Entregable**: Dashboard completo con KPIs y alertas

#### Horas 24-36: Refinamiento y Deploy
- [ ] Optimización de performance (lazy loading, memoization) (2 horas)
- [ ] Agregar loading states y error boundaries (1.5 horas)
- [ ] Testing en múltiples browsers (Chrome, Safari, Firefox) (1.5 horas)
- [ ] Deploy a Vercel (1 hora)
- [ ] Configurar variables de entorno en Vercel (30 min)
- [ ] Testing en producción (1 hora)
- [ ] Preparación de vista para demo en proyector (1 hora)
- [ ] Buffer para fixes (3.5 horas)

---

### ⚙️ DevOps/Full-stack

#### Horas 0-12: Infraestructura y Hardware
- [ ] Setup de Neon Postgres (compartido con Backend) (1 hora)
- [ ] Configurar repositorio Git y branches (30 min)
- [ ] Montar teléfonos en trolley físico (2 horas)
- [ ] Instalar power banks y cables (1 hora)
- [ ] Instalar tiras LED y configurar iluminación (1.5 horas)
- [ ] Generar e imprimir QR codes (1 hora)
- [ ] Laminar y pegar QR codes en repisas (1 hora)
- [ ] Verificar FOV de cada cámara (1 hora)
- [ ] Testing de hardware end-to-end (2 horas)

**Entregable**: Hardware completamente funcional

#### Horas 12-24: Integración y Monitoreo
- [ ] Ayudar con integración entre Mobile ↔ Backend (2 horas)
- [ ] Ayudar con integración entre Backend ↔ Frontend (1 hora)
- [ ] Setup de monitoreo de logs (backend y DB) (1 hora)
- [ ] Crear dashboard de costos de OpenAI (1 hora)
- [ ] Testing de escenarios de fallo (WiFi, batería) (2 horas)
- [ ] Documentar configuración de deployment (1 hora)
- [ ] Preparar scripts de backup/restore (1 hora)

**Entregable**: Sistema integrado y monitoreado

#### Horas 24-36: Preparación de Demo
- [ ] Preparar trolley con productos de demo (1 hora)
- [ ] Configurar flight_requirements para demo (30 min)
- [ ] Grabar video backup de demo (1 hora)
- [ ] Preparar slides de backup (1 hora)
- [ ] Ensayo completo de demo (2 horas)
- [ ] Setup de proyector y audio (1 hora)
- [ ] Crear checklist de verificación pre-demo (30 min)
- [ ] Buffer para emergencias (4.5 horas)

---

## Cronograma por Bloques de 6 Horas

### Bloque 1: Horas 0-6 (Sábado 8:00-14:00)
**Objetivo**: Setup e infraestructura base

- **Mobile**: Captura básica funcionando
- **Backend**: DB conectada, endpoints básicos
- **Frontend**: Proyecto creado, login
- **DevOps**: Hardware montado

**Checkpoint**: Primer scan manual exitoso (Mobile → Backend → DB)

---

### Bloque 2: Horas 6-12 (Sábado 14:00-20:00)
**Objetivo**: Funcionalidades core

- **Mobile**: UI completa, QR scanner
- **Backend**: Vision LLM integrado
- **Frontend**: Vista de trolley
- **DevOps**: LEDs instalados, QRs pegados

**Checkpoint**: Scan automático con detección de SKUs

---

### Bloque 3: Horas 12-18 (Sábado 20:00-02:00)
**Objetivo**: Integración y tiempo real

- **Mobile**: Cola offline
- **Backend**: Diffs y alertas
- **Frontend**: WebSocket funcionando
- **DevOps**: Testing de integración

**Checkpoint**: Alerta aparece en dashboard en tiempo real

---

### Bloque 4: Horas 18-24 (Domingo 02:00-08:00)
**Objetivo**: KPIs y refinamiento

- **Mobile**: Optimización
- **Backend**: Todos los endpoints
- **Frontend**: KPIs y gráficas
- **DevOps**: Monitoreo

**Checkpoint**: Dashboard completo con todas las vistas

---

### Bloque 5: Horas 24-30 (Domingo 08:00-14:00)
**Objetivo**: Testing y fixes

- **All**: Testing end-to-end exhaustivo
- **All**: Fix de bugs encontrados
- **DevOps**: Preparar productos de demo

**Checkpoint**: Sistema funciona sin errores en escenario de demo

---

### Bloque 6: Horas 30-36 (Domingo 14:00-20:00)
**Objetivo**: Demo prep y presentación

- **All**: Ensayo de demo
- **DevOps**: Video backup, slides
- **All**: Buffer para emergencias
- **Líder**: Practicar presentación

**Checkpoint**: Demo lista, presentación pulida

---

## Reuniones de Sincronización

### Daily Standups (15 min cada 6 horas)
- ¿Qué completé en las últimas 6 horas?
- ¿Qué voy a hacer en las próximas 6 horas?
- ¿Hay blockers?

### Checkpoints Críticos (30 min)
- **Hora 12**: ¿Tenemos scan end-to-end funcionando?
- **Hora 24**: ¿Dashboard actualiza en tiempo real?
- **Hora 32**: ¿Demo funciona sin errores?

---

## Gestión de Tiempo

### Regla 70-20-10
- **70%**: Trabajo planeado
- **20%**: Integración y debugging
- **10%**: Buffer para imprevistos

### Priorización
1. **Must-have** (Horas 0-18): Captura, Vision LLM, Alertas básicas
2. **Should-have** (Horas 18-30): KPIs, Cola offline, UI pulida
3. **Nice-to-have** (Horas 30-36): Optimizaciones, features extras

**Si vamos atrasados**: Eliminar nice-to-haves primero

---

## Referencias

- [Checklist de Hoy](today-checklist.md) — Tareas específicas del día
- [Milestones](milestones.md) — Hitos por hora
- [Demo Script](../demo/demo-script.md) — Qué demostrar al final

