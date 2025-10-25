# Smart Trolley Web Camera App

Aplicación web para captura de video en tiempo real con integración de Gemini Live API para detección de productos en trolleys de catering aéreo.

## 🚀 Características

- **Captura de Video en Tiempo Real**: Usa la cámara del dispositivo para streaming continuo
- **Integración con Gemini Live API**: Detección automática de productos usando IA
- **WebSocket en Tiempo Real**: Comunicación bidireccional con el backend
- **UI Moderna**: Interfaz responsive con Tailwind CSS
- **Detección de Productos**: Feed en tiempo real de productos detectados
- **Estado del Sistema**: Panel de control con estadísticas y controles

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **Tailwind CSS** para estilos
- **Socket.IO Client** para WebSocket
- **Google Generative AI** para Gemini API
- **Lucide React** para iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Configuración

### Variables de Entorno

```env
# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# WebSocket Configuration
VITE_WS_URL=ws://localhost:3001

# Development Configuration
VITE_DEV_MODE=true
```

### Configuración del Backend

Asegúrate de que el backend API esté ejecutándose en el puerto 3001 con WebSocket habilitado.

## 🎯 Uso

### 1. Configuración de Sesión
- Ingresa el ID del trolley
- Ingresa el ID del operador
- Ingresa el nombre del operador

### 2. Grabación en Vivo
- La cámara se inicializa automáticamente
- Haz clic en "Iniciar Captura" para comenzar el streaming
- Los productos se detectan automáticamente
- Usa "Pausar/Reanudar" para controlar la grabación
- Haz clic en "Detener" para finalizar la sesión

### 3. Monitoreo
- **Estado de Conexión**: WebSocket al servidor
- **Estado de Grabación**: Captura de video activa
- **Frames Enviados**: Contador de frames procesados
- **Cola Offline**: Frames pendientes de envío
- **Feed de Detecciones**: Lista de productos detectados

## 🏗️ Arquitectura

```
src/
├── components/          # Componentes reutilizables
│   ├── CameraView.tsx   # Componente de cámara
│   ├── DetectionFeed.tsx # Feed de detecciones
│   └── StatusPanel.tsx  # Panel de estado
├── pages/               # Páginas principales
│   ├── OperatorSetup.tsx # Configuración inicial
│   └── LiveRecording.tsx # Grabación en vivo
├── services/           # Servicios
│   ├── cameraService.ts # Servicio de cámara
│   ├── geminiLiveService.ts # Integración Gemini
│   └── websocketService.ts # Comunicación WebSocket
└── App.tsx             # Componente principal
```

## 🔌 Integración con Backend

La app se conecta al backend mediante WebSocket para:

- **Iniciar sesión**: `start_scan` con trolleyId y operatorId
- **Enviar frames**: `frame` con scanId, frameId y jpegBase64
- **Finalizar sesión**: `end_scan` con scanId
- **Recibir detecciones**: `product_detected` con información del producto

## 🚀 Desarrollo

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

## 📱 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (últimas versiones)
- **Dispositivos**: Desktop, tablet, móvil
- **Cámara**: Requiere permisos de cámara
- **HTTPS**: Recomendado para producción (permisos de cámara)

## 🔒 Seguridad

- **Permisos de Cámara**: Solo se accede con consentimiento del usuario
- **WebSocket**: Autenticación mediante token JWT
- **Variables de Entorno**: API keys no expuestas en el cliente
- **HTTPS**: Recomendado para producción

## 🐛 Troubleshooting

### Error de Cámara
- Verifica permisos de cámara en el navegador
- Asegúrate de usar HTTPS en producción
- Revisa que no haya otras apps usando la cámara

### Error de Conexión WebSocket
- Verifica que el backend esté ejecutándose
- Revisa la URL del WebSocket en las variables de entorno
- Comprueba la configuración de CORS

### Error de Gemini API
- Verifica que la API key sea válida
- Revisa los límites de la API
- Comprueba la conectividad a internet

## 📄 Licencia

MIT - GateGroup Smart Trolley Team
