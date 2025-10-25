# Política de Retención de Datos

Este documento define cuánto tiempo se almacenan los diferentes tipos de datos en el sistema Smart Trolley y los procedimientos para su eliminación.

## Principios de Retención

1. **Minimización de Almacenamiento**: Retener solo lo necesario para el propósito operativo
2. **Eliminación Automática**: Procesos automatizados para borrado después del período de retención
3. **Auditoría Selectiva**: Posibilidad de extender retención para casos específicos
4. **Cumplimiento Normativo**: Alineado con GDPR/CCPA cuando aplique

---

## Períodos de Retención por Tipo de Dato

### 1. Imágenes de Scans

**Almacenamiento**: Filesystem local o S3

**Período de retención**:
- **0-7 días**: Almacenamiento activo (hot storage)
- **7-30 días**: Archivo (cold storage, solo para auditorías)
- **>30 días**: Eliminación automática

**Excepciones**:
- Si hay alerta crítica sin resolver: Retener hasta resolución + 7 días
- Si se marca para auditoría: Retener hasta 90 días

**Justificación**: Las imágenes son útiles para validación inmediata de errores, pero pierden valor después de una semana. Prolongar retención aumenta costos sin beneficio operativo.

---

### 2. Registros de Scans (Tabla `scans`)

**Almacenamiento**: Base de datos PostgreSQL

**Período de retención**:
- **Indefinido** (o hasta 1 año para MVP)

**Datos almacenados**:
- `scan_id`
- `trolley_id`
- `shelf_id`
- `image_path` (puede ser NULL si imagen fue eliminada)
- `scanned_at`
- `scanned_by`
- `status`
- `metadata`

**Justificación**: Metadata de scans es útil para análisis histórico de KPIs, pero no contiene datos sensibles. El `image_path` puede quedar como registro histórico aunque la imagen física se elimine.

---

### 3. Items Detectados (Tabla `scan_items`)

**Período de retención**: **Indefinido**

**Datos almacenados**:
- SKU detectado
- Cantidad
- Confidence
- Notas

**Justificación**: Datos agregados valiosos para mejorar el modelo y analizar tendencias de accuracy. No contienen información personal.

---

### 4. Alertas (Tabla `alerts`)

**Período de retención**:
- **Alertas resueltas**: 90 días
- **Alertas activas/pendientes**: Indefinido hasta resolución

**Eliminación**:
```sql
DELETE FROM alerts
WHERE status = 'resolved'
  AND resolved_at < NOW() - INTERVAL '90 days';
```

**Justificación**: Alertas resueltas pueden archivarse para análisis de causas raíz, pero no necesitan retención perpetua.

---

### 5. Datos de Usuarios (Tabla `users`)

**Período de retención**: **Mientras el usuario esté activo**

**Eliminación**: Al darse de baja el operador:
```sql
-- Anonimizar en lugar de eliminar (preservar integridad de auditoría)
UPDATE users
SET username = 'deleted_user_' || id,
    password_hash = '',
    full_name = '[Usuario Eliminado]'
WHERE id = $1;
```

**Alternativa**: Soft delete con campo `deleted_at`

**Justificación**: Mantener registros de auditoría (`scanned_by`) requiere preservar el ID del usuario, pero se puede anonimizar la información personal.

---

### 6. Datos de Trolleys y Vuelos (Tablas `trolleys`, `flights`)

**Período de retención**: **Indefinido** (información operativa core)

**Justificación**: Histórico de vuelos y trolleys es información de negocio sin datos personales.

---

## Proceso de Eliminación Automática

### Cron Job Diario para Limpiar Imágenes

**Hora de ejecución**: 2:00 AM (baja actividad)

**Script conceptual**:

```bash
#!/bin/bash
# cleanup-images.sh

STORAGE_DIR="/path/to/storage/scans"
RETENTION_DAYS=30

echo "Iniciando limpieza de imágenes más antiguas que $RETENTION_DAYS días..."

# Encontrar y eliminar archivos .jpg más antiguos que 30 días
find $STORAGE_DIR -name "*.jpg" -type f -mtime +$RETENTION_DAYS -delete

echo "Limpieza completada. Imágenes eliminadas."

# Opcional: Log de cuántas imágenes se eliminaron
COUNT=$(find $STORAGE_DIR -name "*.jpg" -type f -mtime +$RETENTION_DAYS | wc -l)
echo "Total eliminado: $COUNT archivos"
```

**Configuración en crontab**:
```cron
0 2 * * * /path/to/cleanup-images.sh >> /var/log/cleanup-images.log 2>&1
```

---

### Limpieza de Alertas Resueltas (Query SQL)

**Ejecutar semanalmente**:

```sql
-- Eliminar alertas resueltas hace más de 90 días
DELETE FROM alerts
WHERE status = 'resolved'
  AND resolved_at < NOW() - INTERVAL '90 days';
```

**Programación** (con pg_cron si está disponible):
```sql
SELECT cron.schedule('cleanup-resolved-alerts', '0 3 * * 0', $$
  DELETE FROM alerts WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '90 days'
$$);
```

---

### Archivado de Datos Históricos (Opcional)

Para mantener auditoría a largo plazo sin impactar performance:

**Estrategia**:
1. Crear tabla de archivo `scans_archive`
2. Mover scans >90 días a la tabla archivo
3. Tabla archivo tiene índices mínimos (solo para queries de reporte)

```sql
-- Mover scans antiguos a archivo
INSERT INTO scans_archive
SELECT * FROM scans WHERE scanned_at < NOW() - INTERVAL '90 days';

-- Eliminar de tabla activa
DELETE FROM scans WHERE scanned_at < NOW() - INTERVAL '90 days';
```

---

## Excepciones: Retención Extendida

### Casos de Auditoría

Si se detecta un incidente (ej: faltante de producto de alto valor), supervisor puede marcar scan para retención extendida:

```sql
UPDATE scans
SET metadata = metadata || '{"retention_extended": true, "reason": "Audit - missing high-value item"}'
WHERE id = $1;
```

**Proceso de limpieza modificado**:
```bash
# No eliminar imágenes marcadas para auditoría
find $STORAGE_DIR -name "*.jpg" -type f -mtime +$RETENTION_DAYS \
  ! -path "*/audit/*" -delete
```

---

### Retención para Mejora de Modelo

Subset de imágenes (ej: 1% aleatorio) puede marcarse para entrenamiento futuro:

```sql
-- Marcar 1% de scans aleatorios para dataset de entrenamiento
UPDATE scans
SET metadata = metadata || '{"training_dataset": true}'
WHERE random() < 0.01;
```

**Almacenamiento**: Mover a bucket S3 separado para ML training

---

## Derechos de Acceso y Eliminación

### Derecho de Acceso (GDPR Article 15)

**Proceso**: Operador puede solicitar ver todos sus datos almacenados.

**Query de exportación**:
```sql
SELECT 
  s.scanned_at,
  s.image_path,
  t.trolley_code,
  f.flight_number
FROM scans s
JOIN trolleys t ON t.id = s.trolley_id
JOIN flights f ON f.id = t.flight_id
JOIN users u ON u.id = s.scanned_by
WHERE u.username = 'operator01'
ORDER BY s.scanned_at DESC;
```

**Formato de entrega**: CSV o PDF report

---

### Derecho al Olvido (GDPR Article 17)

**Proceso**: Operador puede solicitar eliminación de sus datos.

**Acciones**:
1. **Anonimizar usuario**:
   ```sql
   UPDATE users SET full_name = '[Anonimizado]', username = 'deleted_' || id WHERE id = $1;
   ```

2. **Eliminar imágenes asociadas**:
   ```bash
   # Buscar todas las imágenes de scans de este usuario
   SELECT image_path FROM scans WHERE scanned_by = $1;
   
   # Eliminar físicamente
   rm /path/to/image1.jpg
   rm /path/to/image2.jpg
   ```

3. **Actualizar registros de scans**:
   ```sql
   UPDATE scans SET scanned_by = NULL, image_path = NULL WHERE scanned_by = $1;
   ```

**Limitaciones**: Si los datos son necesarios para cumplir obligaciones legales (ej: auditoría fiscal), se puede denegar la solicitud hasta que expire el período legal.

---

## Backup y Disaster Recovery

### Backups de Base de Datos

**Frecuencia**: Diario (automático con Neon Postgres)

**Retención de backups**:
- Diarios: 7 días
- Semanales: 4 semanas
- Mensuales: 3 meses

**Nota**: Los backups también están sujetos a políticas de retención. Backups >3 meses se eliminan automáticamente.

---

### Backups de Imágenes (Opcional)

**Para piloto crítico**: Hacer backup semanal a S3 Glacier

**Costo**: $0.004 / GB / mes (muy económico)

**Retrieval**: 12 horas (aceptable para auditorías)

---

## Notificaciones de Eliminación

### Alertas al Equipo de Operaciones

**Antes de eliminar datos masivos**:
```javascript
// Enviar email a ops@ antes de limpieza programada
if (imagesToDelete.length > 10000) {
  await sendEmail({
    to: 'ops@gategroup.com',
    subject: 'Limpieza programada de imágenes',
    body: `Se eliminarán ${imagesToDelete.length} imágenes del ${startDate} al ${endDate}.`
  });
}
```

---

## Logs de Eliminación (Auditoría)

**Registrar todas las eliminaciones**:

```sql
CREATE TABLE deletion_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50),
  record_id INTEGER,
  deleted_by VARCHAR(50),
  deleted_at TIMESTAMP DEFAULT NOW(),
  reason TEXT
);

-- Trigger para registrar eliminaciones de alerts
CREATE OR REPLACE FUNCTION log_alert_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deletion_log (table_name, record_id, deleted_by, reason)
  VALUES ('alerts', OLD.id, current_user, 'Automatic cleanup - resolved >90 days');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_deletion_log
BEFORE DELETE ON alerts
FOR EACH ROW EXECUTE FUNCTION log_alert_deletion();
```

**Retención de logs**: 2 años (más largo que los datos eliminados)

---

## Resumen de Políodos de Retención

| Tipo de Dato | Retención | Eliminación | Excepciones |
|--------------|-----------|-------------|-------------|
| **Imágenes** | 30 días | Automática (cron) | Auditoría: +60 días |
| **Scans (metadata)** | 1 año | Manual/automática | Indefinido si valiosos |
| **Scan Items** | Indefinido | No se elimina | - |
| **Alertas resueltas** | 90 días | Automática (SQL) | - |
| **Alertas activas** | Hasta resolución | Manual | - |
| **Usuarios** | Mientras activo | Soft delete/anonimizar | - |
| **Trolleys/Flights** | Indefinido | No se elimina | - |

---

## Checklist de Implementación

### Fase 1: MVP (Hackathon)
- [ ] Implementar eliminación manual de imágenes antiguas
- [ ] Documentar política de retención en README
- [ ] No implementar eliminación automática (solo 36h de operación)

### Fase 2: Piloto (1-3 meses)
- [ ] Configurar cron job para limpieza de imágenes
- [ ] Implementar soft delete de usuarios
- [ ] Crear proceso de solicitud de acceso a datos (GDPR)

### Fase 3: Producción
- [ ] Automatizar limpieza de alertas resueltas
- [ ] Implementar archivado a cold storage
- [ ] Crear dashboard de retención y costos
- [ ] Documentar procedimiento completo de "derecho al olvido"

---

## Referencias

- [Privacidad y Costos](privacy-costs.md) — Consideraciones de privacidad
- [Modelo de Datos](../architecture/data-model.md) — Tablas afectadas
- [GDPR Compliance Guide](https://gdpr.eu) — Regulaciones europeas
- [CCPA Overview](https://oag.ca.gov/privacy/ccpa) — Regulaciones de California

