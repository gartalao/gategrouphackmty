# Glosario de Términos

Este glosario define los términos clave utilizados en la documentación del proyecto Smart Trolley.

## Términos de Negocio

### Flight (Vuelo)
Un vuelo comercial específico que requiere preparación de trolleys con productos. Identificado por `flight_number`, `departure_time`, y `destination`.

**Ejemplo**: `AA2345` con salida `2025-10-26 14:30:00` hacia `MEX-JFK`.

### Trolley (Carrito)
Estructura con ruedas y múltiples repisas (shelves) que se carga con productos y se envía al avión. Cada trolley contiene típicamente 3 repisas.

**Tipos comunes**:
- Standard (3 shelves)
- Half-size (2 shelves)
- Drawer (cajones especiales)

### Shelf (Repisa)
Nivel horizontal dentro de un trolley donde se colocan productos. En este MVP cada shelf tiene un teléfono Android dedicado.

**Nomenclatura**:
- **Top**: Repisa superior (Shelf 1)
- **Mid**: Repisa media (Shelf 2)
- **Bot**: Repisa inferior (Shelf 3)

### SKU (Stock Keeping Unit)
Código único que identifica un producto específico en el catálogo. Incluye marca, sabor, tamaño, variante.

**Ejemplos**:
- `COK-REG-330` = Coca-Cola Regular 330ml
- `SNK-PRT-50` = Pretzels 50g
- `WTR-SPK-500` = Agua con gas 500ml

### Flight Requirements (Requisitos de Vuelo)
Lista de SKUs con cantidades esperadas (`expected_quantity`) que deben incluirse en un trolley específico para un vuelo. Almacenado en la tabla `flight_requirements`.

**Ejemplo**:
```
flight_id: 123
trolley_id: 456
sku: COK-REG-330
expected_quantity: 24
```

### Pick & Pack
Proceso operativo de seleccionar productos del almacén (pick) y organizarlos en trolleys (pack) según los requisitos de cada vuelo.

## Términos Técnicos

### Scan (Escaneo)
Acción de capturar una imagen de una repisa y procesarla para detectar SKUs. Cada scan genera un registro en la tabla `scans` con timestamp, usuario, y shelf.

### Scan Item
Resultado individual de detección dentro de un scan. Representa un SKU específico identificado en la imagen con su cantidad y score de confianza. Almacenado en `scan_items`.

### Confidence (Confianza)
Valor decimal entre 0.0 y 1.0 que indica qué tan seguro está el modelo de Visión LLM sobre la identificación de un SKU.

**Interpretación**:
- `>= 0.80`: Alta confianza (verde) ✅
- `0.60 - 0.79`: Confianza media (amarillo) ⚠️
- `< 0.60`: Baja confianza (rojo) ❌ — requiere revisión manual

### Diff (Diferencia)
Cálculo de discrepancia entre cantidad esperada y cantidad detectada para un SKU.

**Fórmula**: `diff = actual_quantity - expected_quantity`

**Interpretación**:
- `diff > 0`: **Excedente** (hay más de lo esperado)
- `diff < 0`: **Faltante** (hay menos de lo esperado)
- `diff = 0`: **Exacto** (coincide perfectamente)

### Alert (Alerta)
Notificación generada cuando se detecta una discrepancia (diff ≠ 0) o cuando la confianza es baja. Almacenada en la tabla `alerts` con severidad y estado.

**Tipos de alerta**:
- `missing_item`: Producto esperado no detectado
- `excess_item`: Producto detectado que no se esperaba
- `quantity_mismatch`: Producto detectado con cantidad incorrecta
- `low_confidence`: Detección con confidence < 0.60

### Semáforo (Indicador de Estado)
Sistema visual de tres colores para indicar el estado de una repisa o trolley en el dashboard.

| Color | Estado | Criterio |
|-------|--------|----------|
| 🟢 Verde | Completo y correcto | Todos los items con diff=0 y confidence≥0.80 |
| 🟡 Amarillo | Advertencia | Algunos items con confidence 0.60-0.79 o diffs menores |
| 🔴 Rojo | Crítico | Items faltantes, excedentes mayores, o confidence<0.60 |

### Vision LLM (Large Language Model con Visión)
Modelo de inteligencia artificial multimodal capaz de analizar imágenes y generar respuestas estructuradas en formato JSON. Utilizado para detectar SKUs en las fotos de repisas.

**Ejemplos de modelos**:
- GPT-4 Vision (OpenAI)
- Claude 3 Opus/Sonnet (Anthropic)
- Gemini Pro Vision (Google)

### JSON Schema
Especificación que define la estructura exacta del JSON que debe retornar el Vision LLM. Garantiza respuestas consistentes y parseables.

**Campos clave**: `items[]`, `sku`, `quantity`, `confidence`, `notes`.

### Kiosk Mode (Modo Quiosco)
Configuración de Android que bloquea el dispositivo a una sola aplicación, evita que el usuario salga, y desactiva botones del sistema. Ideal para teléfonos fijos en el trolley.

### Offline Queue (Cola Offline)
Mecanismo de almacenamiento local en el teléfono que guarda scans cuando no hay conectividad de red. Al recuperar conexión, se envían automáticamente al backend.

### WebSocket
Protocolo de comunicación bidireccional en tiempo real entre el backend y el dashboard. Permite enviar eventos de scans y alertas sin polling.

**Eventos típicos**:
- `scan_processed`: Nuevo scan completado
- `alert_created`: Nueva alerta generada
- `trolley_status_updated`: Cambio en el estado del trolley

### SSE (Server-Sent Events)
Alternativa a WebSocket para comunicación unidireccional del servidor al cliente. Más simple de implementar pero menos flexible.

## Términos de Arquitectura

### MVP (Minimum Viable Product)
Versión mínima funcional del producto que resuelve el problema core con las funcionalidades esenciales. Optimizado para desarrollo rápido en 36 horas.

### ADR (Architecture Decision Record)
Documento que registra una decisión arquitectónica importante, su contexto, alternativas consideradas, y consecuencias. Ver [decisions-adr-index.md](architecture/decisions-adr-index.md).

### REST API
Interfaz de programación basada en HTTP que sigue principios RESTful. El backend expone endpoints como `POST /scan`, `GET /flights/:id`, etc.

### Multipart/Form-Data
Formato de envío HTTP utilizado para subir archivos (imágenes) junto con datos JSON en una sola petición.

### JWT (JSON Web Token)
Estándar de token de autenticación que contiene claims del usuario codificados. Utilizado para autorizar peticiones al API.

### Neon Postgres
Servicio de base de datos PostgreSQL serverless con auto-scaling. Ideal para prototipado rápido en hackathons.

**Ventajas**:
- Setup en minutos
- Conexión vía `DATABASE_URL`
- Sin infraestructura que administrar

## Términos de Métricas

### Accuracy (Exactitud)
Porcentaje de scans donde el sistema detectó correctamente todos los SKUs y cantidades comparado con la realidad.

**Fórmula**: `(scans_correctos / scans_totales) × 100`

**Objetivo MVP**: ≥90%

### TTR (Time to Resolution)
Tiempo promedio desde que se crea una alerta hasta que se marca como resuelta.

**Objetivo MVP**: <2 minutos

### False Positive (Falso Positivo)
El sistema detecta un SKU que en realidad no está presente en la repisa.

### False Negative (Falso Negativo)
El sistema NO detecta un SKU que sí está presente en la repisa.

### Average Confidence (Confianza Media)
Promedio de los scores de `confidence` de todos los `scan_items` en un período.

**Objetivo MVP**: ≥0.85

### Scan Frequency (Frecuencia de Escaneo)
Intervalo de tiempo entre capturas automáticas de imágenes.

**Configuración MVP**: 5 segundos

## Términos Operativos

### FOV (Field of View / Campo de Visión)
Área capturada por la cámara del teléfono. Debe cubrir toda la repisa sin recortes.

**Recomendación**: Gran angular (≥90°) con el teléfono a 30-40cm de la repisa.

### QR Code (Código QR)
Etiqueta visual impresa que contiene `shelf_id` codificado. Colocada en cada repisa para identificación automática y como referencia de escala.

### Power Bank
Batería externa que alimenta el teléfono durante operación continua. Necesario porque el teléfono opera 8+ horas sin recarga.

**Capacidad recomendada**: 10,000+ mAh

### LED Diffuser (Difusor LED)
Tira de luces LED con difusor de silicona que proporciona iluminación uniforme sin reflejos. Esencial para calidad de imagen consistente.

**Especificaciones**: 5V USB, luz blanca 5000K-6000K, difusor opaco.

### Image Compression (Compresión de Imagen)
Reducción del tamaño del archivo de imagen manteniendo calidad visual aceptable. En este MVP: JPEG quality 80%, resolución máxima 1280px en el lado largo.

**Objetivo**: 200-400 KB por imagen.

## Términos de Desarrollo

### Expo
Framework de React Native que simplifica el desarrollo de aplicaciones móviles con acceso nativo a cámara, almacenamiento, etc.

**Ventaja**: Build para Android sin necesidad de Android Studio completo.

### Next.js
Framework de React para aplicaciones web con renderizado del lado del servidor y rutas basadas en archivos.

**Uso en MVP**: Dashboard con páginas `/flights/[id]`, `/kpis`, `/alerts`.

### Express
Framework minimalista de Node.js para crear servidores HTTP y APIs REST.

**Uso en MVP**: Backend que maneja `/scan`, `/flights`, `/kpis`, WebSocket.

### Tailwind CSS
Framework de CSS utility-first para diseño rápido de interfaces sin escribir CSS custom.

**Ventaja**: Diseño responsive y moderno en minutos.

## Abreviaciones Comunes

| Abreviación | Significado |
|-------------|-------------|
| **API** | Application Programming Interface |
| **DB** | Database (Base de Datos) |
| **MVP** | Minimum Viable Product |
| **SKU** | Stock Keeping Unit |
| **LLM** | Large Language Model |
| **JWT** | JSON Web Token |
| **QR** | Quick Response (código) |
| **FOV** | Field of View |
| **TTR** | Time to Resolution |
| **SSE** | Server-Sent Events |
| **ADR** | Architecture Decision Record |
| **KPI** | Key Performance Indicator |

---

## Referencias

- [Arquitectura de Contexto](architecture/context-architecture.md) — Uso de estos términos en el sistema
- [Modelo de Datos](architecture/data-model.md) — Cómo se modelan en base de datos
- [Contratos de API](api/contracts.md) — Uso en endpoints

