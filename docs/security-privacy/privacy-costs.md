# Privacidad y Costos

Este documento aborda las consideraciones de privacidad de datos y optimización de costos para el MVP Smart Trolley.

## Principios de Privacidad

### Privacy by Design

El sistema está diseñado desde el inicio para minimizar la recopilación y retención de datos personales:

1. **Solo Productos, No Personas**
   - Las cámaras apuntan exclusivamente a las repisas
   - Ángulo descendente evita capturar rostros de operadores
   - Instrucciones a operadores: esperar a que manos salgan del frame

2. **Minimización de Datos**
   - No se almacenan datos personales innecesarios
   - Username de operador solo para trazabilidad (auditoría interna)
   - No se capturan metadatos de ubicación GPS

3. **Datos Anonimizados en Análisis**
   - Reportes de KPIs no incluyen nombres de operadores
   - Métricas agregadas por turno, no por individuo
   - Focus en métricas del sistema, no evaluación de desempeño personal

---

## Datos Recopilados

### Imágenes de Repisas

**Qué se captura**:
- Fotos JPEG de productos en repisas
- Resolución: 1280px (reducida desde original)
- Timestamp de captura

**Qué NO se captura**:
- Rostros de personas
- Datos de geolocalización
- Audio
- Video continuo

**Propósito**: Análisis automatizado de inventario

**Acceso**: Solo personal autorizado de GateGroup para auditorías

---

### Metadata de Scans

| Campo | Tipo | Sensibilidad | Propósito |
|-------|------|--------------|-----------|
| `scan_id` | Integer | Bajo | Identificación única |
| `trolley_id` | Integer | Bajo | Vincular scan a trolley |
| `shelf_id` | Integer | Bajo | Identificar repisa |
| `scanned_at` | Timestamp | Bajo | Trazabilidad temporal |
| `scanned_by` | User ID | Medio | Auditoría (quién inició el proceso) |
| `image_path` | String | Medio | Localizar imagen para revisión |

**Sensibilidad Media**: `scanned_by` vincula acción a usuario, pero es necesario para auditoría operativa (no para evaluación de desempeño).

---

### Datos de Usuarios

| Campo | Tipo | Sensibilidad | Almacenamiento |
|-------|------|--------------|----------------|
| `username` | String | Bajo | DB, texto plano |
| `password` | String | Alto | DB, **hash bcrypt** (nunca texto plano) |
| `full_name` | String | Medio | DB, texto plano |
| `role` | String | Bajo | DB, texto plano |

**Protección de Passwords**:
- Bcrypt con salt rounds = 10
- Nunca se transmiten en logs o responses
- No se almacenan en localStorage del dashboard (solo JWT)

---

## Compresión de Imágenes

### Objetivo: Reducir Costos sin Sacrificar Calidad

**Configuración**:
- **Formato**: JPEG (vs PNG sin compresión)
- **Quality**: 80% (vs 100%)
- **Resolución**: Max 1280px (vs 3000+px original)

**Resultados**:

| Métrica | Original | Comprimido | Ahorro |
|---------|----------|------------|--------|
| Resolución | 3024 × 4032 px | 1280 × 1707 px | -73% píxeles |
| Tamaño de archivo | 2-4 MB | 200-400 KB | -85-90% |
| Costo de Vision LLM | $0.05-0.10 / imagen | $0.01-0.02 / imagen | -80% |
| Storage por día | 50-100 GB | 5-10 GB | -90% |

**Calidad Visual**: Suficiente para identificar logos de productos a 30-40cm de distancia.

---

## Costos del Vision LLM

### Modelos y Pricing

#### GPT-4o Mini (Recomendado para MVP)

**Pricing** (aproximado a Oct 2025):
- Input: $0.15 por 1M tokens
- Output: $0.60 por 1M tokens
- Imagen 1280px: ~1,200 tokens input

**Costo por imagen**:
```
Input:  1,200 tokens × $0.15 / 1M = $0.00018
Output: ~85 tokens × $0.60 / 1M  = $0.00005
Total: ~$0.00023 por imagen
```

**Con safety margin (latencia, reintentos)**: **$0.0003 - $0.0005 / imagen**

---

#### GPT-4o (Fallback para Baja Confianza)

**Pricing**:
- Input: $2.50 por 1M tokens
- Output: $10.00 por 1M tokens

**Costo por imagen**: **~$0.004 - $0.006**

**Estrategia**: Usar solo si GPT-4o Mini retorna confidence < 0.60

---

### Proyecciones de Costo para el Hackathon (36h)

**Asumiendo**:
- 3 trolleys × 3 shelves = 9 cámaras activas
- 12 fotos/min por cámara
- 36 horas de operación continua

**Cálculo**:
```
Fotos totales = 9 × 12 × 60 × 36 = 233,280 imágenes
```

**Con GPT-4o Mini (100% de uso)**:
```
Costo = 233,280 × $0.0004 = $93.31 USD
```

**Con estrategia híbrida** (90% Mini, 10% GPT-4o):
```
Mini:  209,952 × $0.0004 = $83.98
GPT-4o: 23,328 × $0.005  = $116.64
Total: $200.62 USD
```

**Para demo/prueba (6 horas)**:
```
Fotos = 9 × 12 × 60 × 6 = 38,880
Costo ≈ $15-35 USD
```

---

## Estrategias de Reducción de Costos

### 1. Ajuste Dinámico de Modelo

```javascript
async function analyzeWithAdaptiveModel(imagePath, lastConfidence) {
  let model = 'gpt-4o-mini';  // Default
  
  // Si el scan anterior fue de baja confianza, usar modelo premium
  if (lastConfidence !== null && lastConfidence < 0.70) {
    model = 'gpt-4o';
    console.log('Usando GPT-4o por baja confianza anterior');
  }
  
  return await callVisionAPI(imagePath, model);
}
```

**Ahorro esperado**: 20-30% del costo total

---

### 2. Throttling Inteligente

Si el contenido de la repisa no cambia, no enviar scan:

```javascript
async function shouldSkipScan(currentImageHash, lastImageHash) {
  // Si hash de imagen es idéntico al anterior, skip
  if (currentImageHash === lastImageHash) {
    console.log('Imagen idéntica, skipping LLM call');
    return true;
  }
  
  return false;
}
```

**Implementación**: Calcular MD5 hash de imagen comprimida

**Ahorro esperado**: 10-20% (cuando repisa está completa y operador no agrega más productos)

---

### 3. Caché de Resultados

Para imágenes casi idénticas en ventana de tiempo corta:

```javascript
const redis = require('redis');
const crypto = require('crypto');

async function analyzeWithCache(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
  
  // Verificar caché
  const cached = await redis.get(`vision:${hash}`);
  if (cached) {
    console.log('Usando resultado cacheado');
    return JSON.parse(cached);
  }
  
  // Llamar a Vision LLM
  const result = await analyzeImageWithVision(imagePath);
  
  // Guardar en caché por 5 minutos
  await redis.setex(`vision:${hash}`, 300, JSON.stringify(result));
  
  return result;
}
```

**Ahorro esperado**: 5-15%

---

## Costos de Storage

### Almacenamiento Local (Durante Hack)

**Gratis** si se usa el filesystem del servidor.

**Capacidad requerida**:
```
36h × 9 cámaras × 12 fotos/min × 350 KB/foto = ~81 GB
```

**Servidor típico**: 100+ GB disponibles → Suficiente

---

### S3-Compatible (Producción Futura)

**Opciones**:
- AWS S3
- Backblaze B2 (más económico)
- Cloudflare R2 (sin egress fees)

**Pricing de Backblaze B2** (ejemplo):
- Storage: $0.005 / GB / mes
- Download: $0.01 / GB

**Costo mensual para 500 GB**:
```
Storage: 500 GB × $0.005 = $2.50 / mes
```

**Recomendación**: Usar local durante hack, migrar a B2/R2 si el piloto escala.

---

## Retención de Imágenes

Ver [Política de Retención de Datos](data-retention.md) para detalles completos.

**Resumen**:
- **Activas (0-7 días)**: Hot storage, acceso inmediato
- **Archivo (7-30 días)**: Cold storage (S3 Glacier o similar)
- **>30 días**: Eliminar automáticamente (salvo auditorías pendientes)

**Justificación**:
- Reducir costos de storage
- Cumplir con minimización de datos
- Mantener solo lo necesario para auditoría

---

## Transferencia de Datos (Bandwidth)

### Upload desde Mobile Apps

**Por scan**:
- Imagen: 350 KB
- Metadata: 1 KB
- Total: ~351 KB

**Por día** (9 cámaras × 12 fotos/min × 480 min × 351 KB):
```
≈ 18 GB upload
```

**WiFi industrial**: Suficiente sin costo adicional

**4G (si es necesario)**:
- Plan de datos: 20-50 GB/mes
- Costo: $30-60 USD/mes

---

### Download desde Dashboard

**Minimal**: Dashboard solo recibe eventos WebSocket pequeños (<1 KB cada uno)

**Excepto**: Si supervisor descarga imágenes completas para revisión manual

**Estimado**: <1 GB/día desde dashboard

---

## Transparencia con Operadores

### Notificación de Captura

**Requerimiento**: Informar a operadores que están siendo capturadas imágenes de su trabajo.

**Implementación**:
1. **Señalización visual**: Sticker en trolley: "Cámara activa - Solo productos"
2. **Capacitación inicial**: Explicar propósito del sistema (ayuda, no vigilancia)
3. **Opt-out manual**: Operador puede apagar teléfonos si siente incomodidad (discutir con supervisor)

**Mensaje clave**:
> "Este sistema captura imágenes de productos en el trolley para ayudarte a evitar errores. No graba personas ni se usa para evaluación de desempeño. Solo para asegurar exactitud de inventario."

---

## Compliance y Regulaciones

### GDPR (si aplica en Europa)

**Principios aplicables**:
1. **Lawful Basis**: Interés legítimo (optimización operativa)
2. **Data Minimization**: Solo datos necesarios
3. **Storage Limitation**: Retención máxima 30 días
4. **Right to Access**: Operador puede solicitar sus datos
5. **Right to Erasure**: Posibilidad de eliminar datos a solicitud

**Acciones**:
- Documentar política de privacidad interna
- Obtener consentimiento explícito si se usa en EU
- Designar DPO (Data Protection Officer) si escala

---

### CCPA (California, si aplica)

**Similar a GDPR**: Derecho a saber qué datos se recopilan, derecho a eliminación.

**Cumplimiento**: Documentar inventario de datos y procedimientos de eliminación.

---

## Auditoría de Costos en Tiempo Real

### Dashboard de Costos (Opcional)

**Métricas a trackear**:
- Total de llamadas a Vision LLM (hoy / mes)
- Costo estimado por modelo (Mini vs GPT-4o)
- Storage usado (GB)
- Bandwidth usado (GB)

**Implementación**:
```javascript
// Después de cada llamada a Vision LLM
await pool.query(
  'INSERT INTO cost_tracking (model, tokens_used, estimated_cost) VALUES ($1, $2, $3)',
  [model, tokensUsed, estimatedCost]
);
```

**Query de resumen**:
```sql
SELECT 
  DATE(created_at) as date,
  model,
  SUM(estimated_cost) as total_cost
FROM cost_tracking
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), model
ORDER BY date DESC;
```

---

## Recomendaciones para Producción

Si el MVP tiene éxito y se escala a producción:

1. **Negociar pricing empresarial** con OpenAI (descuentos por volumen)
2. **Evaluar modelos open-source** (LLaVA, CogVLM) para reducir costos
3. **Edge processing** con TensorFlow Lite (detección local, enviar solo anomalías)
4. **Batch processing** nocturno para trolleys no urgentes
5. **Auditoría mensual** de costos con alertas si excede presupuesto

---

## Resumen de Costos Estimados (36h Hack)

| Concepto | Costo |
|----------|-------|
| Vision LLM (GPT-4o Mini) | $90-140 USD |
| Storage local | $0 (incluido en servidor) |
| Bandwidth (WiFi) | $0 (incluido) |
| Neon Postgres | $0 (free tier) |
| Vercel Dashboard | $0 (free tier) |
| **TOTAL** | **$90-140 USD** |

**Para demo de 6 horas**: **$15-35 USD**

---

## Referencias

- [Retención de Datos](data-retention.md) — Política de eliminación
- [JSON Schema para Visión](../api/vision-json-schema.md) — Optimización de prompts
- [Arquitectura de Contexto](../architecture/context-architecture.md) — Flujo de datos

