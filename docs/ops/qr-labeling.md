# Etiquetado QR

Guía para generar, imprimir e instalar códigos QR de identificación en las repisas de los trolleys.

## Propósito de los QR Codes

1. **Configuración automática** de la app móvil (shelf_id, trolley_id, flight_id)
2. **Ancla visual** para calibración de cámara (detección de posición)
3. **Referencia de escala** para el Vision LLM (tamaño conocido 5×5 cm)
4. **Trazabilidad** física (vincular hardware con datos digitales)

---

## Contenido del QR Code

### Formato JSON

Cada QR code contiene un objeto JSON con los siguientes campos:

```json
{
  "shelf_id": 1,
  "trolley_id": 456,
  "position": "top"
}
```

**Campos**:
- `shelf_id` (integer): ID único de la repisa en la base de datos
- `trolley_id` (integer): ID del trolley al que pertenece
- `position` (string): Posición física ("top", "middle", "bottom")

### Ejemplo Completo

**Shelf 1 (Top) del Trolley TRLLY-001**:
```json
{"shelf_id":1,"trolley_id":456,"position":"top"}
```

**Shelf 2 (Middle) del Trolley TRLLY-001**:
```json
{"shelf_id":2,"trolley_id":456,"position":"middle"}
```

**Shelf 3 (Bottom) del Trolley TRLLY-001**:
```json
{"shelf_id":3,"trolley_id":456,"position":"bottom"}
```

---

## Generación de QR Codes

### Opción 1: Generador Online (Rápido)

**Herramientas recomendadas**:
- [QR Code Generator](https://www.qr-code-generator.com)
- [QRCode Monkey](https://www.qrcode-monkey.com)
- [QR Tiger](https://www.qrtiger.com)

**Pasos**:
1. Ir a la herramienta
2. Seleccionar tipo: **"Text"** o **"Plain Text"**
3. Pegar el JSON (ej: `{"shelf_id":1,"trolley_id":456,"position":"top"}`)
4. Configurar tamaño: **5×5 cm** (o 200×200 px si imprime en alta resolución)
5. Descargar como **PNG** o **PDF**
6. Repetir para cada shelf

---

### Opción 2: Script Automatizado (Para Múltiples Trolleys)

**Node.js Script**:

```javascript
const QRCode = require('qrcode');
const fs = require('fs');

const trolleys = [
  { trolley_id: 456, trolley_code: 'TRLLY-001', shelf_ids: [1, 2, 3] },
  { trolley_id: 457, trolley_code: 'TRLLY-002', shelf_ids: [4, 5, 6] },
  { trolley_id: 458, trolley_code: 'TRLLY-003', shelf_ids: [7, 8, 9] }
];

const positions = ['top', 'middle', 'bottom'];

async function generateQRCodes() {
  for (const trolley of trolleys) {
    for (let i = 0; i < trolley.shelf_ids.length; i++) {
      const data = {
        shelf_id: trolley.shelf_ids[i],
        trolley_id: trolley.trolley_id,
        position: positions[i]
      };
      
      const filename = `qr_${trolley.trolley_code}_shelf${i + 1}.png`;
      
      await QRCode.toFile(filename, JSON.stringify(data), {
        width: 200,  // 200px = ~5cm a 100 DPI
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log(`✅ Generated: ${filename}`);
    }
  }
}

generateQRCodes();
```

**Ejecutar**:
```bash
npm install qrcode
node generate-qr-codes.js
```

**Resultado**: 9 archivos PNG (3 trolleys × 3 shelves)

---

## Impresión de QR Codes

### Especificaciones de Impresión

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| **Tamaño** | 5×5 cm | Balance entre legibilidad y espacio |
| **Resolución** | 300 DPI mínimo | Escaneado confiable |
| **Material** | Papel adhesivo o cartulina | Fácil de pegar |
| **Color** | Negro sobre blanco | Máximo contraste |
| **Borde (margin)** | 5mm alrededor | Evita recortes |

---

### Proceso de Impresión

#### Opción A: Impresora de Oficina (Papel Adhesivo)

**Materiales**:
- Hojas A4 de papel adhesivo (etiquetas)
- Impresora láser o inkjet

**Pasos**:
1. Colocar los 9 QR codes en un documento (ej: Word, PowerPoint)
2. Ajustar tamaño de cada QR a **5×5 cm**
3. Imprimir en papel adhesivo
4. Cortar con tijeras (dejar margen de 5mm)

---

#### Opción B: Imprenta Profesional

**Para mayor durabilidad**:
- Material: PVC adhesivo o vinil
- Laminado: Protección contra agua y grasa
- Costo: ~$2-5 USD por etiqueta

**Ventaja**: Resistencia a condiciones industriales

---

## Laminado (Protección)

### ¿Por Qué Laminar?

- ✅ Resistencia al agua (salpicaduras en almacén)
- ✅ Resistencia a grasa (manejo de alimentos)
- ✅ Mayor durabilidad (no se despegan con facilidad)
- ✅ Fácil de limpiar

### Métodos de Laminado

**Opción 1**: Laminadora térmica de oficina
- Fundas de laminado A4
- Costo: ~$0.20 por etiqueta

**Opción 2**: Film adhesivo transparente
- Pegar sobre el QR impreso
- Costo: ~$0.10 por etiqueta

**Opción 3**: Tape transparente ancho (3M)
- Cubrir QR con cinta
- Costo: ~$0.05 por etiqueta

---

## Instalación en Trolleys

### Ubicación de la Etiqueta

**Posición recomendada**: **Esquina superior derecha** de cada repisa

```
┌─────────────────────────────────┐
│                           [QR]  │ ← Aquí
│  ╔═══════════════════════════╗  │
│  ║                           ║  │
│  ║  Productos en la shelf    ║  │
│  ║                           ║  │
│  ╚═══════════════════════════╝  │
└─────────────────────────────────┘
```

**Razones**:
- No interfiere con productos
- Visible desde ángulo de cámara
- Fácil de escanear manualmente con teléfono

---

### Proceso de Pegado

1. **Limpiar superficie** con alcohol isopropílico
2. **Esperar a que seque** (30 segundos)
3. **Pegar etiqueta** presionando firmemente por 10 segundos
4. **Verificar adherencia** (intentar despegar ligeramente una esquina)

**Superficie ideal**: Metal o plástico liso (no superficies rugosas o porosas)

---

## Escaneo del QR con la App

### Flujo de Configuración

1. **Primera apertura** de la app Smart Trolley
2. Pantalla muestra: **"Escanear QR de esta Shelf"**
3. Operador **apunta cámara** al QR de la repisa
4. App **detecta y parsea** el JSON
5. App **guarda configuración** en AsyncStorage:
   ```json
   {
     "shelf_id": 1,
     "trolley_id": 456,
     "position": "top"
   }
   ```
6. Pantalla confirma: **"✅ Configuración exitosa - Shelf Top"**

---

### Implementación en la App (Conceptual)

**Librería**: `expo-barcode-scanner`

```javascript
import { BarCodeScanner } from 'expo-barcode-scanner';

function QRScannerScreen() {
  const handleBarCodeScanned = ({ data }) => {
    try {
      const config = JSON.parse(data);
      
      // Validar estructura
      if (!config.shelf_id || !config.trolley_id) {
        alert('QR inválido');
        return;
      }
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('shelf_config', JSON.stringify(config));
      
      // Navegar a pantalla principal
      navigation.navigate('Main');
      
    } catch (error) {
      alert('Error al escanear QR');
    }
  };
  
  return (
    <BarCodeScanner
      onBarCodeScanned={handleBarCodeScanned}
      style={{ flex: 1 }}
    />
  );
}
```

---

## Uso como Ancla Visual (Avanzado)

### Detección de Posición de Cámara

**Concepto**: El QR de tamaño conocido (5×5 cm) permite calcular:
- Distancia de la cámara a la repisa
- Ángulo de la cámara
- Escala de la imagen

**Implementación** (post-MVP):
- Detectar QR en imagen con OpenCV o similar
- Calcular distancia basada en tamaño aparente del QR
- Ajustar procesamiento de Vision LLM según escala

**Beneficio**: Mejora accuracy si la cámara se mueve accidentalmente

---

## Reemplazo de Etiquetas

### Cuándo Reemplazar

- ❌ QR dañado (no escanea correctamente)
- ❌ Etiqueta despegada o parcialmente desprendida
- ❌ Laminado roto (entrada de humedad)
- ❌ Descoloración (difícil de leer)

**Frecuencia esperada**: Cada 3-6 meses en uso intensivo

---

### Proceso de Reemplazo

1. Despegar etiqueta vieja con cuidado
2. Limpiar residuo de adhesivo con alcohol
3. Pegar nueva etiqueta
4. **Reconfigurar app**: Volver a escanear nuevo QR (mismo contenido, pero por si acaso)

---

## QR Codes de Respaldo

### Generar QRs de Backup

**Imprimir extras** (2-3 por shelf) y guardar en sobre etiquetado:

```
╔═══════════════════════════════╗
║  QR Backups - TRLLY-001       ║
║                               ║
║  Shelf 1 (Top):    [QR] [QR]  ║
║  Shelf 2 (Middle): [QR] [QR]  ║
║  Shelf 3 (Bottom): [QR] [QR]  ║
╚═══════════════════════════════╝
```

**Ubicación**: Caja de herramientas del equipo de operaciones

---

## Troubleshooting

### Problema: App no reconoce el QR

**Causas posibles**:
- QR dañado o sucio
- Iluminación pobre
- Cámara desenfocada

**Solución**:
1. Limpiar QR con paño
2. Acercar/alejar cámara para enfocar
3. Mejorar iluminación
4. Si persiste, reemplazar etiqueta

---

### Problema: QR se escanea pero da error

**Causa**: JSON malformado o campos faltantes

**Solución**:
1. Verificar que el JSON tenga `shelf_id`, `trolley_id`, `position`
2. Regenerar QR con formato correcto
3. Validar JSON con [jsonlint.com](https://jsonlint.com)

---

## Checklist de QR Labeling

### Preparación
- [ ] Generar 9 QR codes (3 trolleys × 3 shelves)
- [ ] Imprimir en papel adhesivo
- [ ] Laminar todas las etiquetas
- [ ] Cortar con margen de 5mm

### Instalación
- [ ] Limpiar superficies de las 9 repisas
- [ ] Pegar QR en esquina superior derecha
- [ ] Verificar adherencia

### Pruebas
- [ ] Escanear cada QR con la app
- [ ] Verificar que configuración se guarda correctamente
- [ ] Confirmar que cada teléfono tiene su shelf_id correcto

### Backups
- [ ] Imprimir 2 QR extras por shelf
- [ ] Guardar en sobre etiquetado
- [ ] Documentar ubicación de backups

---

## Referencias

- [Montaje de Hardware](hardware-mounting.md) — Instalación completa del sistema
- [Mobile Expo Setup](../setup/mobile-expo-setup.md) — Implementación de escaneo de QR en la app
- [Modelo de Datos](../architecture/data-model.md) — Estructura de tabla `shelves`

