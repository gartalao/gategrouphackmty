# Guía de Catálogo SKU

Recomendaciones para construir y mantener el catálogo de productos (SKUs) para maximizar la accuracy del Vision LLM.

## Estructura del Catálogo

### Campos Básicos

| Campo | Tipo | Requerido | Ejemplo |
|-------|------|-----------|---------|
| `sku` | STRING | ✅ | `COK-REG-330` |
| `name` | STRING | ✅ | `Coca-Cola Regular 330ml` |
| `category` | STRING | ✅ | `Bebidas` |
| `brand` | STRING | ✅ | `Coca-Cola` |
| `image_url` | STRING | ⚠️ Recomendado | URL de imagen de referencia |
| `description` | TEXT | ❌ Opcional | Descripción detallada |
| `visual_cues` | TEXT | ⚠️ Recomendado | "Lata roja con logo blanco" |

---

## Nomenclatura de SKUs

### Formato Recomendado

```
<CATEGORÍA>-<VARIANTE>-<TAMAÑO>
```

**Ejemplos**:
- `COK-REG-330` = Coca-Cola Regular 330ml
- `COK-ZER-330` = Coca-Cola Zero 330ml
- `WTR-SPK-500` = Agua con Gas 500ml
- `SNK-PRT-50` = Snacks Pretzels 50g

### Categorías Comunes

| Código | Categoría |
|--------|-----------|
| `COK` | Coca-Cola (marca específica) |
| `PEP` | Pepsi |
| `WTR` | Water (Agua) |
| `JUC` | Juice (Jugo) |
| `SNK` | Snacks |
| `MIL` | Milk (Leche) |
| `COF` | Coffee (Café) |

### Variantes

| Código | Variante |
|--------|----------|
| `REG` | Regular |
| `ZER` | Zero/Light |
| `SPK` | Sparkling (con gas) |
| `ORA` | Orange (naranja) |
| `APP` | Apple (manzana) |

---

## Imágenes de Referencia

### Propósito

Las imágenes de referencia sirven para **few-shot prompting** — mostrar al Vision LLM ejemplos visuales de cada SKU antes de analizar el trolley.

### Especificaciones de Imagen

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| **Formato** | JPEG o PNG | Compatibilidad |
| **Resolución** | 800×800 px mínimo | Suficiente para logos |
| **Fondo** | Blanco o transparente | Sin distractores |
| **Ángulo** | Frontal y lateral | Varias perspectivas |
| **Iluminación** | Difusa y uniforme | Similar a trolley |

### Ejemplo de Imagen Ideal

```
╔═══════════════════╗
║                   ║
║      [Logo]       ║
║    Coca-Cola      ║
║     Regular       ║
║                   ║
╚═══════════════════╝
Fondo blanco, producto centrado
```

---

## Visual Cues (Pistas Visuales)

### ¿Qué son?

Descripciones textuales de características visuales distintivas del producto que se incluyen en el prompt del Vision LLM.

### Ejemplos

**Coca-Cola Regular**:
```
"Lata de aluminio color ROJO brillante con logo blanco cursivo 'Coca-Cola'. 
Tamaño 330ml, aproximadamente 12cm de alto."
```

**Coca-Cola Zero**:
```
"Lata de aluminio color NEGRO con logo rojo 'Coca-Cola Zero'. 
Misma forma que Regular pero color completamente diferente."
```

**Agua Bonafont**:
```
"Botella plástica TRANSPARENTE con tapa azul. 
Etiqueta pequeña azul y blanca con logo 'Bonafont'. 500ml."
```

### Template de Visual Cues

```
"[Tipo de envase] de [material] color [COLOR PRINCIPAL en mayúsculas] con [características distintivas]. 
[Logos o texto visible]. Tamaño [XXml/g], aproximadamente [dimensiones]."
```

---

## Few-Shot Prompting

### Concepto

Incluir ejemplos visuales de 3-5 SKUs en el prompt junto con la imagen del trolley para "entrenar" al LLM en qué buscar.

### Implementación

**Prompt mejorado**:
```
Eres un sistema de detección de productos. A continuación te muestro imágenes de referencia:

[Imagen 1: COK-REG-330]
Este es Coca-Cola Regular 330ml (SKU: COK-REG-330)
Características: Lata roja con logo blanco

[Imagen 2: WTR-REG-500]
Este es Agua Natural 500ml (SKU: WTR-REG-500)
Características: Botella transparente con tapa azul

[Imagen 3: SNK-PRT-50]
Este es Pretzels 50g (SKU: SNK-PRT-50)
Características: Bolsa amarilla con pretzel en foto

Ahora analiza esta imagen de trolley y detecta cuántos de estos productos hay:
[Imagen del trolley]
```

### Costo

**Impacto en costo**:
- 3 imágenes de referencia × ~200 tokens/imagen = +600 tokens por request
- Costo adicional: ~$0.0001 por scan
- **Beneficio**: Accuracy puede subir de 85% a 92-95%

**Recomendación**: Usar few-shot solo para SKUs problemáticos (confusión frecuente)

---

## Manejo de SKUs Similares

### Problema

Productos de la misma marca con variantes sutiles:
- Coca-Cola Regular vs Zero
- Pepsi vs Pepsi Light
- Jugo Naranja vs Jugo Manzana (mismo empaque, distinto color)

### Estrategia 1: Visual Cues Específicos

**En lugar de**:
```
"Lata de Coca-Cola"
```

**Usar**:
```
"Coca-Cola Regular: Lata ROJA (no negra, no plateada) con logo blanco"
"Coca-Cola Zero: Lata NEGRA con logo rojo y texto 'Zero' visible"
```

### Estrategia 2: Prompt Explícito

```
IMPORTANTE: Coca-Cola Regular y Coca-Cola Zero son productos DIFERENTES.
- Regular = ROJO
- Zero = NEGRO
Si ves una lata roja, es COK-REG-330.
Si ves una lata negra, es COK-ZER-330.
NO confundas estos dos productos.
```

### Estrategia 3: Threshold de Confidence

Para SKUs similares, requerir confidence ≥0.85 (más alto que default 0.80)

```javascript
const isSimilarSKU = ['COK-REG-330', 'COK-ZER-330'].includes(sku);
const requiredConfidence = isSimilarSKU ? 0.85 : 0.80;

if (confidence < requiredConfidence) {
  generateAlert('low_confidence', `${sku} tiene confidence ${confidence}, revisar manualmente`);
}
```

---

## Control de Calidad del Catálogo

### Checklist de Nuevos SKUs

Antes de agregar un SKU al catálogo:

- [ ] SKU único y no duplicado
- [ ] Nombre descriptivo y sin ambigüedades
- [ ] Visual cues completados
- [ ] Imagen de referencia de alta calidad
- [ ] Probado con Vision LLM (accuracy ≥85%)
- [ ] No se confunde con SKUs existentes

### Proceso de Testing

1. **Agregar SKU** a tabla `products`
2. **Crear prompt** con visual cues
3. **Capturar 10 imágenes** del producto en diferentes ángulos
4. **Ejecutar detección** con Vision LLM
5. **Calcular accuracy**: Detecciones correctas / 10
6. **Si accuracy <85%**: Mejorar visual cues o imagen de referencia

---

## Catálogo de Ejemplo para Demo

```sql
INSERT INTO products (sku, name, category, brand, unit_price, visual_cues) VALUES
('COK-REG-330', 'Coca-Cola Regular 330ml', 'Bebidas', 'Coca-Cola', 1.50,
 'Lata de aluminio ROJA con logo blanco cursivo. 330ml, 12cm alto.'),
 
('COK-ZER-330', 'Coca-Cola Zero 330ml', 'Bebidas', 'Coca-Cola', 1.50,
 'Lata de aluminio NEGRA con logo rojo y texto "Zero". 330ml, 12cm alto.'),
 
('PEP-REG-330', 'Pepsi Regular 330ml', 'Bebidas', 'PepsiCo', 1.50,
 'Lata de aluminio AZUL con logo blanco y rojo. 330ml, 12cm alto.'),
 
('WTR-REG-500', 'Agua Natural 500ml', 'Bebidas', 'Bonafont', 0.80,
 'Botella plástica TRANSPARENTE con tapa azul. Etiqueta azul pequeña. 500ml.'),
 
('WTR-SPK-500', 'Agua con Gas 500ml', 'Bebidas', 'Topo Chico', 1.00,
 'Botella de vidrio TRANSPARENTE con etiqueta verde. Tapa de rosca. 500ml.'),
 
('JUC-ORA-250', 'Jugo de Naranja 250ml', 'Bebidas', 'Jumex', 1.20,
 'Caja tetrapack color NARANJA con ilustración de naranja. 250ml, rectangular.'),
 
('JUC-APP-250', 'Jugo de Manzana 250ml', 'Bebidas', 'Jumex', 1.20,
 'Caja tetrapack color ROJO con ilustración de manzana. 250ml, rectangular.'),
 
('SNK-PRT-50', 'Pretzels Salados 50g', 'Snacks', 'Snyder''s', 2.00,
 'Bolsa plástica AMARILLA con foto de pretzels. Logo "Snyder''s" en rojo. 50g.'),
 
('SNK-CHI-40', 'Chips Papas 40g', 'Snacks', 'Lays', 1.80,
 'Bolsa plástica ROJA con foto de papas fritas. Logo "Lay''s" amarillo. 40g.'),
 
('SNK-NUT-35', 'Nueces Mixtas 35g', 'Snacks', 'Planters', 2.50,
 'Bolsa plástica AZUL con foto de nueces. Logo "Planters" con mascota. 35g.');
```

---

## Actualización y Mantenimiento

### Frecuencia de Revisión

- **Semanal**: Revisar SKUs con accuracy <80%
- **Mensual**: Agregar nuevos productos de temporada
- **Trimestral**: Auditoría completa del catálogo

### Métricas de Salud del Catálogo

| Métrica | Objetivo | Acción si Falla |
|---------|----------|-----------------|
| Accuracy promedio | ≥90% | Mejorar visual cues |
| SKUs con accuracy <70% | 0% | Reentrenar o remover |
| SKUs sin imagen de referencia | <10% | Fotografiar productos |
| Confusión entre SKUs similares | <5% | Mejorar diferenciación |

---

## Referencias

- [JSON Schema para Visión](../api/vision-json-schema.md) — Cómo incluir catálogo en prompt
- [Modelo de Datos](../architecture/data-model.md) — Estructura de tabla `products`
- [Privacy and Costs](../security-privacy/privacy-costs.md) — Impacto de few-shot en costos

