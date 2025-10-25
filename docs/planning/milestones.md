# Milestones del Proyecto

Hitos clave por hora para las 36 horas de HackMTY, con criterios de aceptación y señales de alerta.

## Hora 0: Kickoff

**Objetivo**: Equipo alineado y setup inicial

**Entregables**:
- Repositorio Git creado
- Roles asignados
- Neon DB configurado

**Criterio de Aceptación**: Todos pueden hacer `git pull` y tienen acceso a DATABASE_URL

---

## Hora 3: Primera Prueba de Concepto

**Objetivo**: Validar que cada componente puede inicializarse

**Entregables**:
- Mobile app captura foto manualmente
- Backend responde `GET /health`
- Dashboard muestra "Hello World"

**Criterio de Aceptación**: `curl http://localhost:3001/health` → 200 OK

---

## Hora 6: Captura Automática

**Objetivo**: Mobile app funcionando end-to-end

**Entregables**:
- App captura cada 5s automáticamente
- Imágenes se comprimen a 200-400 KB
- Backend guarda imágenes en filesystem

**Criterio de Aceptación**: Ver 12 imágenes nuevas en `/storage/scans` después de 1 minuto

⚠️ **Señal de Alerta**: Si no hay captura automática a Hora 7, replannear

---

## Hora 12: Detección con Vision LLM

**Objetivo**: Vision LLM retorna detecciones

**Entregables**:
- OpenAI API integrada
- JSON válido parseado
- scan_items insertados en DB

**Criterio de Aceptación**: Query `SELECT * FROM scan_items` retorna >0 rows

⚠️ **Señal de Alerta**: Si LLM no funciona a Hora 14, considerar mock data

---

## Hora 18: Alertas en Tiempo Real

**Objetivo**: Sistema completo de detección y notificación

**Entregables**:
- Diffs calculados correctamente
- Alertas generadas automáticamente
- WebSocket emitiendo eventos

**Criterio de Aceptación**: Agregar producto incorrecto → Alerta aparece en <10s

⚠️ **Señal de Alerta**: Si WebSocket no funciona a Hora 20, usar polling

---

## Hora 24: Dashboard Completo

**Objetivo**: UI funcional con todas las vistas

**Entregables**:
- Vista de trolley con semáforos
- Panel de alertas
- KPIs básicos

**Criterio de Aceptación**: Dashboard muestra datos en vivo sin refresh manual

⚠️ **Señal de Alerta**: Si dashboard no actualiza a Hora 26, priorizar fix sobre features

---

## Hora 30: Hardware Integrado

**Objetivo**: Sistema funcionando con trolley físico

**Entregables**:
- 3 teléfonos montados y funcionando
- LEDs instalados
- Accuracy ≥85% verificado

**Criterio de Aceptación**: Demo end-to-end con productos reales funciona

⚠️ **Señal de Alerta**: Si accuracy <70% a Hora 32, mejorar iluminación urgentemente

---

## Hora 34: Demo Ensayada

**Objetivo**: Presentación pulida y backup listo

**Entregables**:
- Video backup grabado
- Demo ejecutada 3 veces sin errores
- Script memorizado

**Criterio de Aceptación**: Timer de 2:30 min cumplido en ensayo

⚠️ **Señal de Alerta**: Si demo falla 2 veces consecutivas, activar Plan B (video)

---

## Hora 36: Presentación Final

**Objetivo**: Ganar HackMTY 🏆

**Entregables**:
- Demo en vivo exitosa
- Preguntas de jueces respondidas
- Repositorio público con README completo

**Criterio de Aceptación**: Jueces impresionados ✅

---

## Resumen de Hitos Críticos

| Hora | Hito | Must-Have | Señal de Peligro |
|------|------|-----------|------------------|
| 6 | Captura automática | ✅ | No hay fotos guardadas |
| 12 | Vision LLM | ✅ | JSON inválido o vacío |
| 18 | Alertas en vivo | ✅ | WebSocket no conecta |
| 24 | Dashboard completo | ✅ | UI no actualiza |
| 30 | Hardware integrado | ✅ | Accuracy <70% |
| 34 | Demo ensayada | ✅ | Falla 2 veces |

**Si fallamos un hito Must-Have**: Reunión de emergencia del equipo completo

