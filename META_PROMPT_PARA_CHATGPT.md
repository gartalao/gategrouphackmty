# META-PROMPT PARA CHATGPT: Generador de Prompts de Transformación

## INSTRUCCIONES PARA USAR ESTE PROMPT EN CHATGPT

Copia el texto de la sección "PROMPT PARA CHATGPT" y pégalo en ChatGPT cuando necesites generar un prompt de transformación de proyecto similar.

---

## PROMPT PARA CHATGPT

```
Necesito que analices un proyecto de software completo y generes un prompt comprehensivo para Cursor AI que transforme el proyecto según nuevos requerimientos.

PROYECTO ACTUAL:
[Pega aquí el README.md principal del proyecto]

DOCUMENTACIÓN EXISTENTE:
[Lista de archivos de documentación clave:
- /docs/overview.md
- /docs/architecture/...
- /prisma/schema.prisma
- etc.]

CÓDIGO EXISTENTE:
[Estructura de directorios principales:
- /apps/mobile-shelf/
- /apps/api/
- /apps/dashboard/
- etc.]

TRANSFORMACIÓN REQUERIDA:
[Describe aquí los cambios principales que necesitas, por ejemplo:]

1. CAMBIO DE TECNOLOGÍA:
   - De: [tecnología actual, ej: OpenAI GPT-4 Vision]
   - A: [nueva tecnología, ej: Google Gemini Robotics-ER 1.5]

2. CAMBIO DE ENFOQUE:
   - De: [enfoque actual, ej: análisis de fotos estáticas]
   - A: [nuevo enfoque, ej: análisis de video en tiempo real]

3. CAMBIO DE FUNCIONALIDAD:
   - De: [funcionalidad actual, ej: detectar SKUs mediante códigos QR]
   - A: [nueva funcionalidad, ej: detectar productos visualmente]

4. CAMBIO DE ARQUITECTURA:
   - De: [arquitectura actual, ej: 3 dispositivos fijos por trolley]
   - A: [nueva arquitectura, ej: 1 dispositivo móvil por operador]

TAREAS REQUERIDAS:
Por favor genera un prompt para Cursor AI que incluya:

1. ANÁLISIS COMPLETO:
   - Resumen ejecutivo de los cambios
   - Comparación detallada antes/después
   - Impacto en cada componente del sistema

2. DOCUMENTACIÓN:
   - Lista de archivos de documentación a ELIMINAR
   - Lista de archivos a REESCRIBIR COMPLETAMENTE (con guía de contenido)
   - Lista de archivos a ACTUALIZAR PARCIALMENTE
   - Lista de archivos NUEVOS a crear

3. CÓDIGO - MOBILE APP:
   - Archivos a eliminar
   - Archivos a crear (con estructura sugerida)
   - Archivos a actualizar
   - Nuevas dependencias necesarias
   - Cambios en navegación/estructura

4. CÓDIGO - BACKEND API:
   - Archivos a eliminar
   - Archivos nuevos (con estructura sugerida)
   - Servicios a crear
   - Endpoints a cambiar
   - Nuevas dependencias
   - Variables de entorno

5. CÓDIGO - FRONTEND/DASHBOARD:
   - Componentes a crear/actualizar
   - Cambios en WebSocket/comunicación
   - Nuevas páginas/vistas

6. BASE DE DATOS:
   - Tablas a eliminar
   - Tablas a crear
   - Campos a agregar/eliminar
   - Script de migración SQL
   - Cambios en Prisma schema

7. TESTING:
   - Casos de prueba críticos
   - Scripts de testing nuevos
   - Criterios de éxito

8. DEPLOYMENT:
   - Nuevas configuraciones
   - Variables de entorno
   - Cambios en infraestructura

9. TIMELINE:
   - Fases de implementación
   - Estimación de horas por fase
   - Orden recomendado

10. CHECKLIST FINAL:
    - Items verificables para confirmar completitud

FORMATO DEL PROMPT:
- Debe ser un archivo Markdown completo
- Secciones claramente definidas
- Ejemplos de código donde sea relevante
- Instrucciones específicas y accionables
- No debe asumir conocimiento previo del desarrollador

TONO:
- Técnico pero accesible
- Instrucciones imperativas claras
- Ejemplos concretos
- Warnings sobre puntos críticos

Por favor genera el prompt completo siguiendo esta estructura.
```

---

## EJEMPLO DE USO

### Paso 1: Prepara tu información

Reúne los siguientes archivos de tu proyecto:
- README.md principal
- Documentos de arquitectura
- Schema de base de datos (Prisma, SQL, etc.)
- Estructura de directorios
- Package.json de cada app

### Paso 2: Define tus cambios

Escribe claramente:
- ¿Qué tecnología estás cambiando?
- ¿Qué funcionalidad nueva necesitas?
- ¿Qué se elimina?
- ¿Qué se agrega?

### Paso 3: Usa el prompt

1. Abre ChatGPT (preferiblemente GPT-4)
2. Pega el PROMPT PARA CHATGPT de arriba
3. Llena los campos con tu información
4. Envía

### Paso 4: Recibe el prompt generado

ChatGPT te dará un prompt comprehensivo que puedes:
1. Guardar como `TRANSFORMATION_PROMPT.md`
2. Usar directamente en Cursor AI
3. Compartir con tu equipo

---

## VARIACIONES DEL PROMPT

### Para cambios más simples:
Si solo necesitas cambiar una parte del proyecto, modifica el prompt para enfocarse solo en esas secciones.

Ejemplo:
```
Solo genera las secciones:
- CÓDIGO - BACKEND API
- BASE DE DATOS
- TESTING
```

### Para proyectos diferentes:
Adapta las secciones según el tipo de proyecto:

**Para proyectos de machine learning:**
- Agregar sección "MODELO Y ENTRENAMIENTO"
- Agregar "DATASETS Y PREPROCESAMIENTO"

**Para proyectos de infraestructura:**
- Agregar "TERRAFORM/IaC"
- Agregar "CI/CD PIPELINES"

**Para proyectos móviles nativos:**
- Separar iOS y Android
- Agregar sección de "PERMISOS Y CONFIGURACIONES NATIVAS"

---

## TIPS PARA MEJORES RESULTADOS

1. **Sé específico en los cambios**
   - No: "Cambiar la API"
   - Sí: "Cambiar de OpenAI GPT-4 Vision a Google Gemini Robotics-ER 1.5"

2. **Incluye contexto de negocio**
   - ¿Por qué se hace el cambio?
   - ¿Qué problema resuelve?
   - ¿Qué beneficios trae?

3. **Provee ejemplos**
   - Snippet de código actual
   - Snippet de cómo debería ser
   - Ejemplos de datos antes/después

4. **Define prioridades**
   - ¿Qué es crítico?
   - ¿Qué es nice-to-have?
   - ¿Qué puede esperar para v2?

5. **Incluye restricciones**
   - Budget
   - Tiempo disponible
   - Habilidades del equipo
   - Limitaciones técnicas

---

## PERSONALIZACIÓN PARA TU CASO

Para este proyecto específico (GateGroup Smart Trolley), el prompt ya está generado en:
- `TRANSFORMATION_PROMPT.md` - Prompt completo para Cursor
- `RESUMEN_EJECUTIVO_CAMBIOS.md` - Resumen de alto nivel

Usa estos como referencia o ejemplos cuando necesites generar prompts similares para otros proyectos.

---

## PREGUNTAS FRECUENTES

**P: ¿Puedo usar este prompt con otros AI assistants además de ChatGPT?**
R: Sí, funciona con Claude, Gemini, etc. Puede que necesites ajustar ligeramente el formato.

**P: ¿Qué tan largo debe ser el prompt resultante?**
R: Para transformaciones grandes: 3,000-5,000 líneas. Para cambios simples: 500-1,000 líneas.

**P: ¿Debo incluir todo el código existente?**
R: No, solo estructura y ejemplos representativos. ChatGPT tiene límite de contexto.

**P: ¿El prompt generado reemplaza la documentación?**
R: No, es una GUÍA de transformación. La documentación se debe actualizar después.

**P: ¿Puedo iterar sobre el prompt generado?**
R: Sí, puedes pedirle a ChatGPT que:
- Agregue más detalles a una sección
- Agregue ejemplos de código
- Expanda un tema específico
- Simplifique algo muy complejo

---

## EJEMPLO DE ITERACIÓN

```
Usuario:
"El prompt está muy bien, pero necesito más detalles sobre la integración con Gemini API. 
¿Puedes expandir esa sección con:
- Ejemplo completo de llamada a la API
- Manejo de errores
- Rate limiting
- Optimización de costos"

ChatGPT:
[Genera versión expandida con esos detalles]
```

---

## MANTENIMIENTO

Cuando el proyecto evolucione, puedes:

1. Crear NUEVO prompt de transformación usando este meta-prompt
2. Mantener historial de transformaciones en `/docs/transformations/`
3. Documentar lecciones aprendidas
4. Actualizar este meta-prompt con mejoras

Ejemplo de estructura:
```
/docs/transformations/
  - 2025-10-25-openai-to-gemini.md
  - 2025-11-15-add-mobile-ios.md
  - 2025-12-01-scale-to-multitenancy.md
```

---

## CONTRIBUCIONES

Si mejoras este meta-prompt, considera:
- Agregar ejemplos adicionales
- Documentar casos de uso nuevos
- Compartir con el equipo
- Crear templates específicos por tipo de cambio

---

**Versión**: 1.0  
**Última actualización**: 2025-10-25  
**Autor**: Generado para proyecto GateGroup Smart Trolley  
**Licencia**: Uso interno

