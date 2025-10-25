# Checklist de Hoy

Lista de verificación de tareas críticas para completar el MVP Smart Trolley durante HackMTY.

## Día 1 (Sábado) - Horas 0-24

### Setup Inicial (Hora 0-2)

- [ ] **Repositorio Git creado** y clonado por todo el equipo
- [ ] **Neon Postgres** configurado con DATABASE_URL
- [ ] **OpenAI API Key** obtenida y verificada
- [ ] **Proyecto Mobile** (Expo) inicializado
- [ ] **Proyecto Backend** (Express) inicializado  
- [ ] **Proyecto Frontend** (Next.js) inicializado
- [ ] **Hardware** (3 teléfonos + power banks) adquirido y listo

### Funcionalidad Core (Hora 2-12)

- [ ] **Mobile App captura fotos** cada 5 segundos automáticamente
- [ ] **Backend recibe uploads** y guarda en storage
- [ ] **Vision LLM integrado** y retorna JSON válido
- [ ] **DB guarda scans** y scan_items correctamente
- [ ] **Dashboard muestra** datos básicos de trolley
- [ ] **Primer scan end-to-end** exitoso

### Integración (Hora 12-20)

- [ ] **WebSocket configurado** en backend
- [ ] **Dashboard suscrito** a WebSocket y recibe eventos
- [ ] **Cálculo de diffs** funciona correctamente
- [ ] **Alertas se generan** cuando diff ≠ 0
- [ ] **Cola offline** implementada en mobile app
- [ ] **Hardware montado** en trolley físico

### Testing (Hora 20-24)

- [ ] **Test con productos reales** en trolley
- [ ] **Accuracy ≥85%** verificado
- [ ] **Latencia <10s** desde captura a alerta
- [ ] **3 teléfonos funcionando** simultáneamente
- [ ] **Dashboard actualiza** en tiempo real sin errores

---

## Día 2 (Domingo) - Horas 24-36

### Refinamiento (Hora 24-30)

- [ ] **KPIs implementados** en dashboard (accuracy, tiempo, confidence)
- [ ] **Gráficas de Recharts** mostrando métricas
- [ ] **UI pulida** con Tailwind CSS
- [ ] **Error handling** robusto en todos los componentes
- [ ] **LEDs instalados** y iluminación optimizada
- [ ] **QR codes impresos** y pegados en repisas

### Preparación de Demo (Hora 30-34)

- [ ] **Video backup grabado** (2-3 min de demo funcionando)
- [ ] **Screenshots preparados** como plan C
- [ ] **Productos de demo** seleccionados y organizados
- [ ] **Flight requirements** configurados para demo específica
- [ ] **Script de demo** practicado al menos 2 veces
- [ ] **Laptop conectado a proyector** y testeado

### Verificación Final (Hora 34-36)

- [ ] **Demo completa ejecutada** sin errores 3 veces consecutivas
- [ ] **Todos los dispositivos cargados** al 100%
- [ ] **Backend desplegado** y accesible desde WiFi del evento
- [ ] **Dashboard accesible** desde URL pública o localhost
- [ ] **Presentador preparado** con timing de 2-3 minutos
- [ ] **Equipo listo** para preguntas de jueces
- [ ] **Repositorio GitHub** limpio y con README completo
- [ ] **Documentación publicada** y accesible

---

## Checklist de Emergencia (Última Hora)

Si algo falla críticamente en las últimas horas:

- [ ] ✅ **Video backup funciona** y se puede reproducir
- [ ] ✅ **Screenshots impresos** en papel (plan físico)
- [ ] ✅ **Presentador sabe** explicar sin demo en vivo
- [ ] ✅ **Slides de backup** con diagramas listos
- [ ] ✅ **Mock data** pre-cargado en DB para simular

---

## Verificación por Componente

### Mobile App ✅
- [ ] Captura automática cada 5s
- [ ] Compresión a JPEG 1280px funciona
- [ ] Upload a backend exitoso
- [ ] QR scanner funciona
- [ ] Kiosk mode habilitado
- [ ] Cola offline operativa
- [ ] Instalada en 3 teléfonos

### Backend API ✅
- [ ] Endpoint `/health` responde 200
- [ ] `POST /scan` procesa imágenes
- [ ] Vision LLM retorna detecciones
- [ ] Diffs calculados correctamente
- [ ] Alertas generadas automáticamente
- [ ] WebSocket emite eventos
- [ ] Todos los GET endpoints funcionan

### Dashboard Web ✅
- [ ] Login funciona con JWT
- [ ] Vista de trolley muestra shelves
- [ ] Semáforo (verde/amarillo/rojo) correcto
- [ ] Panel de alertas actualiza en vivo
- [ ] KPIs se calculan correctamente
- [ ] Gráficas renderizan
- [ ] WebSocket conectado

### Hardware ✅
- [ ] 3 teléfonos montados correctamente
- [ ] FOV cubre toda la repisa
- [ ] LEDs iluminan uniformemente
- [ ] Power banks conectados
- [ ] QR codes legibles
- [ ] Soportes estables (no vibran)

---

## Criterios de "Listo para Demo"

El sistema está listo cuando **TODOS** estos criterios se cumplen:

✅ **Trolley físico** preparado con productos  
✅ **Scan automático** funciona en los 3 teléfonos  
✅ **Vision LLM** detecta SKUs con accuracy ≥85%  
✅ **Alertas aparecen** en dashboard <10s  
✅ **KPIs visibles** en dashboard  
✅ **Demo ejecutada** exitosamente 3 veces sin errores  
✅ **Video backup** funcionando como plan B  
✅ **Equipo preparado** para preguntas

---

## Notas de Último Minuto

**Recordatorios importantes**:
- 🔋 Cargar power banks la noche anterior
- 📱 No actualizar apps/OS durante el hack
- 🌐 Verificar WiFi del evento funciona (tener 4G de backup)
- 💾 Hacer backup de DB antes de demo
- 📹 Tener celular extra grabando durante demo (por si ganan)

---

**¡Éxito en HackMTY! 🚀**

