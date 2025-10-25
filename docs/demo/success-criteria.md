# Criterios de Éxito

Este documento define los criterios específicos que determinan el éxito del MVP Smart Trolley para HackMTY.

## Criterios Técnicos del MVP

### 1. Captura Automática Funcional ✅

**Requisito**: El sistema debe capturar imágenes de las tres repisas automáticamente cada 5 segundos sin intervención manual.

**Validación**:
- [ ] Teléfonos Android capturan fotos cada 5 segundos
- [ ] Imágenes tienen calidad suficiente (no borrosas, bien iluminadas)
- [ ] Tamaño de archivo: 200-400 KB por imagen
- [ ] Compresión a JPEG 1280px funciona correctamente

**Métrica de Éxito**: ≥95% de capturas exitosas durante 10 minutos de operación continua

**Demostración**: Mostrar logs o contador de scans en dashboard incrementándose automáticamente cada 5 segundos.

---

### 2. Detección de Productos con ≥85% de Accuracy ✅

**Requisito**: El Vision LLM debe identificar correctamente SKUs y cantidades con al menos 85% de exactitud.

**Validación**:
- [ ] Modelo detecta SKUs correctos (ej: COK-REG-330, no inventar SKUs falsos)
- [ ] Cantidades detectadas ±1 unidad de la realidad
- [ ] Confidence promedio ≥0.80
- [ ] JSON retornado cumple con el schema definido

**Métrica de Éxito**: 
```
Accuracy = (Detecciones Correctas / Total Detecciones) × 100 ≥ 85%
```

**Demostración**: 
- Preparar trolley con productos conocidos (ej: 12 Coca-Colas, 6 Aguas, 3 Pretzels)
- Realizar scan
- Comparar detecciones vs realidad física
- Mostrar tabla en dashboard con resultados

**Ejemplo de Validación**:
| SKU | Esperado | Detectado | Correcto |
|-----|----------|-----------|----------|
| COK-REG-330 | 12 | 12 | ✅ |
| WTR-REG-500 | 6 | 6 | ✅ |
| SNK-PRT-50 | 3 | 3 | ✅ |
| **Accuracy** | | | **100%** |

---

### 3. Alertas en Tiempo Real (<10 Segundos) ✅

**Requisito**: Cuando se detecta una discrepancia (diff ≠ 0), el sistema debe generar una alerta y mostrarla en el dashboard en menos de 10 segundos desde la captura.

**Validación**:
- [ ] Alerta aparece en dashboard después de scan
- [ ] Tiempo desde captura hasta alerta visible: <10 segundos
- [ ] Alerta contiene información correcta (SKU, diff, severity)
- [ ] WebSocket funciona correctamente (sin polling)

**Métrica de Éxito**: Latencia promedio <10 segundos

**Demostración**:
1. Colocar solo 4 aguas en lugar de 6
2. Cronometrar desde colocación hasta que aparezca alerta
3. Mostrar timestamp de captura y timestamp de alerta en dashboard

**Timing Esperado**:
```
Captura:          0s
Upload:           +1-2s
Vision LLM:       +3-5s
Calc diffs:       +0.5s
Emit WebSocket:   +0.1s
Render dashboard: +0.2s
─────────────────────
Total:            ~5-8s ✅
```

---

### 4. Dashboard Funcional con KPIs en Vivo ✅

**Requisito**: Dashboard web debe mostrar estado de trolleys, KPIs y alertas, actualizándose en tiempo real vía WebSocket.

**Validación**:
- [ ] Dashboard muestra estado de cada shelf (verde/amarillo/rojo)
- [ ] KPIs se calculan correctamente:
  - Accuracy (%)
  - Tiempo promedio por trolley
  - Confidence promedio
  - Alertas activas
- [ ] Actualización automática sin refresh manual
- [ ] UI responsive (funciona en desktop y tablet)

**Métrica de Éxito**: 
- Todas las métricas se actualizan <5 segundos después de cambios
- UI funciona en al menos 2 browsers (Chrome, Safari)

**Demostración**:
- Abrir dashboard en proyector
- Realizar cambios en trolley físico
- Mostrar actualizaciones en vivo sin reload

**Elementos Visuales Requeridos**:
```
✅ Trolley Cards con semáforo (verde/amarillo/rojo)
✅ Panel de alertas con lista ordenada por severidad
✅ KPI Cards con valores numéricos y tendencias
✅ Timestamp de "última actualización"
```

---

## Criterios de Usabilidad

### 5. Operación Hands-Free

**Requisito**: El operador no debe interactuar con los teléfonos durante el picking —el sistema debe funcionar de forma pasiva.

**Validación**:
- [ ] Operador solo agrega productos, no toca teléfonos
- [ ] Captura automática sin botones
- [ ] Kiosk mode previene cierre accidental de app
- [ ] No se requiere escaneo manual de códigos de barras

**Demostración**: Realizar demo completa sin tocar los teléfonos después de configuración inicial.

---

### 6. Setup Rápido (<5 Minutos)

**Requisito**: Configurar un nuevo trolley debe tomar menos de 5 minutos.

**Validación**:
- [ ] Escanear QR code para configurar shelf_id
- [ ] Apps se conectan automáticamente al backend
- [ ] Verificación visual de FOV en preview de cámara
- [ ] Primer scan exitoso en <5 min desde inicio

**Demostración**: Cronometrar setup de un trolley desde cero.

---

## Criterios de Robustez

### 7. Tolerancia a Conectividad Intermitente

**Requisito**: El sistema debe seguir funcionando si se pierde WiFi temporalmente.

**Validación**:
- [ ] Cola offline guarda scans cuando no hay red
- [ ] Reintentos automáticos al recuperar conectividad
- [ ] No se pierden datos durante desconexiones <2 minutos
- [ ] Indicador visual en app cuando está offline

**Demostración**:
1. Desconectar WiFi del router
2. Realizar 2-3 scans (guardados en cola local)
3. Reconectar WiFi
4. Verificar que scans se envían automáticamente
5. Mostrar en dashboard que todos los scans llegaron

---

### 8. Manejo de Errores del Vision LLM

**Requisito**: Si el Vision LLM falla, el sistema debe registrar el error y continuar operando.

**Validación**:
- [ ] Si LLM retorna error 500: Marcar scan como `failed`
- [ ] Si LLM retorna JSON inválido: Log error, no crashear
- [ ] Reintento automático después de 30s
- [ ] Dashboard muestra estado "processing failed"

**Demostración**: Simular error apagando backend o usando API key inválido, mostrar que app móvil no se crashea.

---

## Criterios de Presentación (HackMTY)

### 9. Demo en Vivo Funcional (2-3 Minutos)

**Requisito**: Presentar una demo en vivo que muestre el flujo completo sin errores.

**Elementos Requeridos**:
- [ ] Trolley físico con 3 teléfonos montados
- [ ] Dashboard proyectado en pantalla
- [ ] Flujo: Agregar productos → Alerta generada → Alerta resuelta
- [ ] Tiempo total de demo: 2-3 minutos
- [ ] Sin crashes ni errores visibles

**Guión**: Ver [Demo Script](demo-script.md)

---

### 10. Documentación Completa

**Requisito**: Repositorio debe incluir documentación técnica completa y legible.

**Elementos Requeridos**:
- [ ] README con descripción del proyecto
- [ ] Diagramas de arquitectura (mermaid o similar)
- [ ] Instrucciones de setup para cada componente
- [ ] Decisiones de diseño (ADRs)
- [ ] KPIs y métricas definidas

**Validación**: Jueces pueden entender el proyecto leyendo el README sin código.

---

## Matriz de Evaluación (Para Jueces)

| Criterio | Peso | Puntos Max | Validación |
|----------|------|------------|------------|
| **Captura automática** | 10% | 10 | Funciona cada 5s |
| **Accuracy ≥85%** | 25% | 25 | Test con productos reales |
| **Alertas <10s** | 20% | 20 | Cronometrar latencia |
| **Dashboard funcional** | 15% | 15 | UI actualiza en vivo |
| **Usabilidad** | 10% | 10 | Operador no toca teléfonos |
| **Robustez** | 10% | 10 | Tolera desconexión WiFi |
| **Demo en vivo** | 5% | 5 | Presentación sin errores |
| **Documentación** | 5% | 5 | README completo |
| **TOTAL** | **100%** | **100** | |

**Puntaje Mínimo para Aprobar**: 70/100

---

## Definición de "Done" para el MVP

El proyecto se considera **completado exitosamente** cuando:

✅ **Todos los criterios técnicos (1-4)** funcionan en la demo  
✅ **Al menos 1 criterio de usabilidad (5-6)** está implementado  
✅ **Al menos 1 criterio de robustez (7-8)** está implementado  
✅ **Demo en vivo (9)** se ejecuta sin errores críticos  
✅ **Documentación (10)** está completa y publicada en GitHub

---

## Medición de Éxito Post-HackMTY

Si el MVP gana el hackathon o es seleccionado para piloto:

### Fase Piloto (1-3 Meses)

**KPIs de negocio**:
- Reducción de errores: >40%
- Reducción de tiempo por trolley: >20%
- ROI positivo en <6 meses

### Fase Producción (6-12 Meses)

**Escalabilidad**:
- Soportar 50+ trolleys simultáneos
- Accuracy sostenida >90%
- Uptime >99%

---

## Checklist de Validación Final (Antes de Demo)

### 30 Minutos Antes
- [ ] Ejecutar test de accuracy con 10 scans
- [ ] Verificar que todos los endpoints responden
- [ ] Probar WebSocket conectándose desde dashboard
- [ ] Verificar que alertas se generan correctamente

### 10 Minutos Antes
- [ ] Cargar productos de demo en posiciones iniciales
- [ ] Abrir dashboard en proyector
- [ ] Verificar que LEDs están encendidos
- [ ] Hacer 1 scan de prueba completo

### 2 Minutos Antes
- [ ] Resetear trolley a estado inicial (para demo limpia)
- [ ] Limpiar panel de alertas en dashboard
- [ ] Verificar que presentador tiene guión a mano
- [ ] Cronómetro listo para timing de demo

---

## Referencias

- [Demo Script](demo-script.md) — Guión completo de presentación
- [KPIs y Métricas](../kpis/kpis-metrics.md) — Definición de métricas de éxito
- [Flujo Operativo](../flows/operational.md) — Proceso completo del sistema

