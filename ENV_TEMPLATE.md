# Environment Variables Template

Copy this to `.env` in your project root and fill in the values.

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smart_trolley?schema=public"

# Gemini API (reemplaza OpenAI)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-robotics-er-1.5

# Video Streaming Configuration
VIDEO_FRAME_SEND_FPS=2
VIDEO_FRAME_RES_W=640
VIDEO_FRAME_RES_H=360
DETECTION_CONFIDENCE_THRESHOLD=0.70
PRODUCT_COOLDOWN_MS=1200

# Development Mode (set to 1 for fake Gemini responses)
GEMINI_FAKE=1

# WebSocket
WS_URL=ws://localhost:3001/ws

# JWT Authentication
JWT_SECRET=change_this_to_a_secure_random_string_in_production

# API Server
PORT=3001
NODE_ENV=development

# Frontend/Dashboard
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

