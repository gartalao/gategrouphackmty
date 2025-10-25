# JSON Schema para Vision LLM

Este documento especifica el formato exacto de entrada (prompt) y salida (JSON) para la integración con modelos de Visión LLM.

## JSON Schema de Salida

El Vision LLM debe retornar un JSON que cumpla estrictamente con este schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["items"],
  "properties": {
    "items": {
      "type": "array",
      "description": "Lista de productos detectados en la imagen",
      "items": {
        "type": "object",
        "required": ["sku", "quantity", "confidence"],
        "properties": {
          "sku": {
            "type": "string",
            "description": "Código SKU del producto (debe existir en catálogo)",
            "pattern": "^[A-Z]{3}-[A-Z]{3}-[0-9]{2,4}$",
            "examples": ["COK-REG-330", "WTR-SPK-500", "SNK-PRT-50"]
          },
          "quantity": {
            "type": "integer",
            "description": "Cantidad de unidades detectadas de este SKU",
            "minimum": 1,
            "maximum": 200
          },
          "confidence": {
            "type": "number",
            "description": "Score de confianza entre 0.0 (nada seguro) y 1.0 (totalmente seguro)",
            "minimum": 0.0,
            "maximum": 1.0,
            "multipleOf": 0.0001
          },
          "notes": {
            "type": ["string", "null"],
            "description": "Notas opcionales sobre la detección (ej: 'parcialmente oculto', 'etiqueta borrosa')",
            "maxLength": 255
          }
        },
        "additionalProperties": false
      }
    },
    "metadata": {
      "type": "object",
      "description": "Metadata opcional del análisis",
      "properties": {
        "image_quality": {
          "type": "string",
          "enum": ["excellent", "good", "fair", "poor"],
          "description": "Evaluación de la calidad de la imagen"
        },
        "lighting_conditions": {
          "type": "string",
          "enum": ["good", "acceptable", "poor"],
          "description": "Evaluación de las condiciones de iluminación"
        },
        "total_items_visible": {
          "type": "integer",
          "description": "Número total de items visibles (incluyendo no identificados)"
        }
      }
    }
  },
  "additionalProperties": false
}
```

## Ejemplo de Respuesta Válida

```json
{
  "items": [
    {
      "sku": "COK-REG-330",
      "quantity": 24,
      "confidence": 0.9500,
      "notes": null
    },
    {
      "sku": "WTR-REG-500",
      "quantity": 30,
      "confidence": 0.9200,
      "notes": null
    },
    {
      "sku": "SNK-PRT-50",
      "quantity": 11,
      "confidence": 0.7500,
      "notes": "Una unidad parcialmente oculta detrás de las latas"
    },
    {
      "sku": "JUC-ORA-250",
      "quantity": 6,
      "confidence": 0.6200,
      "notes": "Etiqueta parcialmente visible, podría ser variante de manzana"
    }
  ],
  "metadata": {
    "image_quality": "good",
    "lighting_conditions": "good",
    "total_items_visible": 71
  }
}
```

## Ejemplo de Respuesta con Array Vacío

Si no se detecta ningún producto conocido:

```json
{
  "items": [],
  "metadata": {
    "image_quality": "fair",
    "lighting_conditions": "poor",
    "total_items_visible": 0
  }
}
```

## Prompt para el Backend

Este es el prompt exacto que el backend debe enviar al Vision LLM junto con la imagen:

```
Eres un sistema de detección de productos en trolleys de catering aéreo para GateGroup.

Tu tarea es analizar esta imagen de una repisa de trolley y detectar TODOS los productos visibles, identificándolos por su SKU del catálogo.

CATÁLOGO DE SKUs VÁLIDOS:
- COK-REG-330: Coca-Cola Regular 330ml (lata roja con logo blanco)
- COK-ZER-330: Coca-Cola Zero 330ml (lata negra con logo rojo)
- PEP-REG-330: Pepsi Regular 330ml (lata azul con logo blanco)
- WTR-REG-500: Agua Natural 500ml (botella transparente con tapa azul)
- WTR-SPK-500: Agua con Gas 500ml (botella transparente con tapa verde)
- JUC-ORA-250: Jugo de Naranja 250ml (caja tetrapack naranja)
- JUC-APP-250: Jugo de Manzana 250ml (caja tetrapack roja)
- SNK-PRT-50: Pretzels Salados 50g (bolsa amarilla con pretzel en foto)
- SNK-CHI-40: Chips Papas 40g (bolsa roja con papas en foto)
- SNK-NUT-35: Nueces Mixtas 35g (bolsa café con nueces)

INSTRUCCIONES CRÍTICAS:
1. Cuenta cuidadosamente cada unidad visible de cada SKU
2. SOLO reporta SKUs que existen en el catálogo de arriba
3. Si ves un producto pero NO estás seguro del SKU exacto, BAJA el confidence (<0.70)
4. NO inventes SKUs que no están en el catálogo
5. Si un producto está parcialmente oculto o borroso, añade una nota explicativa
6. El campo "confidence" debe reflejar qué tan seguro estás de la identificación:
   - 0.90-1.00: Totalmente seguro, producto claramente visible
   - 0.80-0.89: Muy seguro, algunos podrían estar parcialmente ocultos
   - 0.70-0.79: Razonablemente seguro, pero hay alguna ambigüedad
   - 0.60-0.69: Inseguro, producto borroso o parcialmente visible
   - <0.60: Muy inseguro, requiere validación manual
7. Evalúa la calidad de la imagen y condiciones de iluminación en el campo metadata

FORMATO DE RESPUESTA:
Retorna EXACTAMENTE este formato JSON (sin markdown, sin explicaciones adicionales):

{
  "items": [
    {
      "sku": "COK-REG-330",
      "quantity": 24,
      "confidence": 0.95,
      "notes": null
    }
  ],
  "metadata": {
    "image_quality": "good",
    "lighting_conditions": "good",
    "total_items_visible": 24
  }
}

CASOS ESPECIALES:
- Si la imagen está completamente borrosa o no se ven productos: retorna {"items": [], "metadata": {"image_quality": "poor", "lighting_conditions": "poor", "total_items_visible": 0}}
- Si ves productos pero ninguno coincide con el catálogo: retorna {"items": [], "metadata": {"image_quality": "good", "lighting_conditions": "good", "total_items_visible": X}} donde X es el número de items visibles

Analiza la imagen ahora y retorna el JSON.
```

## Implementación en el Backend

### Llamada a OpenAI API (GPT-4 Vision)

```javascript
async function analyzeImageWithVision(imagePath, catalogSKUs) {
  const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',  // Modelo más económico
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: VISION_PROMPT  // El prompt de arriba
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'  // 'low' para más rápido pero menos preciso
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },  // Fuerza respuesta JSON
      max_tokens: 1000,
      temperature: 0.1  // Baja temperatura para respuestas más deterministas
    })
  });
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from OpenAI API');
  }
  
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  
  // Validar contra JSON Schema
  validateSchema(parsed);
  
  return parsed;
}
```

### Validación del Schema

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

const schema = { /* JSON Schema de arriba */ };
const validate = ajv.compile(schema);

function validateSchema(data) {
  const valid = validate(data);
  
  if (!valid) {
    console.error('Schema validation errors:', validate.errors);
    throw new Error(`Invalid JSON from Vision LLM: ${JSON.stringify(validate.errors)}`);
  }
  
  return true;
}
```

## Manejo de Errores

### Error 1: SKU No Existe en Catálogo

Si el LLM retorna un SKU que no existe en la DB:

```javascript
for (const item of parsed.items) {
  const product = await db.query('SELECT id FROM products WHERE sku = $1', [item.sku]);
  
  if (!product.rows.length) {
    console.warn(`Unknown SKU detected by LLM: ${item.sku}. Skipping.`);
    continue;  // No insertar este item en scan_items
  }
  
  // Continuar con inserción normal
}
```

### Error 2: JSON Inválido

Si el LLM retorna texto que no es JSON válido:

```javascript
try {
  const parsed = JSON.parse(content);
  validateSchema(parsed);
} catch (error) {
  // Marcar scan como fallido
  await db.query(
    'UPDATE scans SET status = $1, metadata = $2 WHERE id = $3',
    ['failed', JSON.stringify({ error: 'Invalid JSON from LLM', raw_response: content }), scanId]
  );
  
  // Emitir evento de error al dashboard
  io.emit('scan_failed', {
    scan_id: scanId,
    reason: 'Vision LLM returned invalid JSON'
  });
  
  return;
}
```

### Error 3: Confidence Muy Baja en Todos los Items

Si todos los items tienen confidence < 0.50:

```javascript
const avgConfidence = parsed.items.reduce((sum, item) => sum + item.confidence, 0) / parsed.items.length;

if (avgConfidence < 0.50) {
  // Generar alerta crítica
  await db.query(
    'INSERT INTO alerts (scan_id, alert_type, severity, message, status) VALUES ($1, $2, $3, $4, $5)',
    [scanId, 'low_confidence', 'critical', 
     `Confianza promedio muy baja (${avgConfidence.toFixed(2)}). Revisar imagen o iluminación.`, 'active']
  );
}
```

## Optimizaciones de Costo

### Estrategia de Modelo

1. **Por defecto**: Usar `gpt-4o-mini` (más barato, ~$0.01-0.02 por imagen)
2. **Si confidence < 0.60**: Re-analizar con `gpt-4o` (más preciso pero ~$0.05-0.10 por imagen)
3. **Fallback**: Si OpenAI no disponible, usar Claude 3 Haiku

### Reducción de Resolución

```javascript
// Si la imagen es muy grande, redimensionar antes de enviar
if (imageWidth > 1280 || imageHeight > 1280) {
  imageResized = await sharp(imagePath)
    .resize(1280, 1280, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer();
  imageBase64 = imageResized.toString('base64');
}
```

### Caché de Resultados (Opcional)

Para imágenes casi idénticas (mismo shelf en corto tiempo):

```javascript
const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');

const cached = await redis.get(`vision_cache:${imageHash}`);
if (cached) {
  console.log('Using cached vision result');
  return JSON.parse(cached);
}

const result = await analyzeImageWithVision(imagePath);
await redis.setex(`vision_cache:${imageHash}`, 300, JSON.stringify(result));  // TTL 5 min
```

## Few-Shot Prompting (Avanzado)

Para mejorar accuracy, incluir ejemplos de imágenes de referencia en el prompt:

```
EJEMPLOS DE REFERENCIA:
[Imagen 1: COK-REG-330]
Esta es una lata de Coca-Cola Regular 330ml. Fíjate en el logo blanco sobre fondo rojo.

[Imagen 2: WTR-REG-500]
Esta es una botella de Agua Natural 500ml. Nota la transparencia y tapa azul.

Ahora analiza la imagen del trolley:
[Imagen del trolley]
```

**Implementación**:
```javascript
const messages = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'EJEMPLOS DE REFERENCIA:' },
      { type: 'image_url', image_url: { url: catalogImages['COK-REG-330'] } },
      { type: 'text', text: 'Esta es Coca-Cola Regular 330ml (SKU: COK-REG-330)' },
      { type: 'image_url', image_url: { url: catalogImages['WTR-REG-500'] } },
      { type: 'text', text: 'Esta es Agua Natural 500ml (SKU: WTR-REG-500)' },
      { type: 'text', text: 'Ahora analiza esta imagen de trolley:' },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
    ]
  }
];
```

---

## Costos Estimados

| Modelo | Costo por Imagen | Accuracy Estimado | Latencia |
|--------|------------------|-------------------|----------|
| **GPT-4o Mini** | $0.01 - 0.02 | ~85-90% | 2-3s |
| **GPT-4o** | $0.05 - 0.10 | ~90-95% | 3-5s |
| **Claude 3 Haiku** | $0.01 - 0.025 | ~85-88% | 2-4s |
| **Claude 3 Sonnet** | $0.05 - 0.15 | ~92-96% | 4-6s |

**Proyección para MVP** (36 horas, 3 shelves, foto cada 5s):
- Imágenes totales: ~7,776 (3 shelves × 12 fotos/min × 36 horas × 60 min)
- Costo con GPT-4o Mini: **~$78 - $155 USD**
- Costo con GPT-4o: **~$389 - $778 USD**

**Recomendación**: Usar GPT-4o Mini por defecto, escalar a GPT-4o solo si confidence < 0.60.

---

## Referencias

- [Contratos de API](contracts.md) — Endpoint POST /scan que usa este schema
- [Secuencia de Scan](../architecture/sequence-scan.md) — Flujo completo incluyendo llamada a LLM
- [Guía de Catálogo SKU](../references/sku-catalog-guidance.md) — Cómo construir el catálogo de referencia

