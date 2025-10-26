require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initializeVideoStream } = require('../routes/videoStream');
const detectionsRouter = require('../routes/detections');
const salesTrackingRouter = require('../routes/salesTracking');

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 10e6, // 10 MB for video frames
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Smart Trolley API - Gemini Real-time Detection',
    version: '2.0.0',
    gemini_mode: process.env.GEMINI_FAKE === '1' ? 'FAKE' : 'REAL',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', detectionsRouter);
app.use('/api', salesTrackingRouter);

// Initialize WebSocket for video streaming
initializeVideoStream(io);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Smart Trolley API Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`✅ Gemini Mode: ${process.env.GEMINI_FAKE === '1' ? '🎭 FAKE (Testing)' : '🤖 REAL (Production)'}`);
  console.log(`✅ Database: ${process.env.DATABASE_URL ? '🟢 Connected' : '🔴 Not configured'}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📡 Endpoints:');
  console.log(`   GET  /                          - API info`);
  console.log(`   GET  /health                    - Health check`);
  console.log(`   GET  /api/trolleys/:id/realtime-status`);
  console.log(`   GET  /api/trolleys/:id/detections`);
  console.log(`   GET  /api/scans/:id/summary`);
  console.log('');
  console.log('🎥 WebSocket Events:');
  console.log(`   start_scan  - Iniciar grabación`);
  console.log(`   frame       - Enviar frame de video`);
  console.log(`   end_scan    - Finalizar grabación`);
  console.log('');
  console.log('👀 Listening for connections...');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

