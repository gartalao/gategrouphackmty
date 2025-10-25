import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initializeSocket } from './lib/socket';
import { errorHandler } from './middleware/error';

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import flightRoutes from './routes/flights';
import scanRoutes from './routes/scans';
import trolleyRoutes from './routes/trolleys';
import kpisRoutes from './routes/kpis';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    }, 'HTTP request');
  });
  next();
});

// Static files (storage)
app.use('/storage', express.static(env.STORAGE_DIR));

// Routes
app.use('/', healthRoutes);
app.use('/', authRoutes);
app.use('/', flightRoutes);
app.use('/', scanRoutes);
app.use('/', trolleyRoutes);
app.use('/', kpisRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 API server started');
  logger.info(`📡 WebSocket endpoint: ws://localhost:${env.PORT}/ws/socket.io`);
  logger.info(`💾 Storage directory: ${env.STORAGE_DIR}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

