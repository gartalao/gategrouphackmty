import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from './logger';
import { env } from '../config/env';

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/ws/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Client connected to WebSocket');

    socket.on('subscribe_trolley', (data: { trolley_id: number }) => {
      const room = `trolley:${data.trolley_id}`;
      socket.join(room);
      logger.info({ socketId: socket.id, room }, 'Client subscribed to trolley');
      socket.emit('subscribed', { trolley_id: data.trolley_id, message: 'Subscription successful' });
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return io;
}

