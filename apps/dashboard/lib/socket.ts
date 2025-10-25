'use client'

import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      path: '/ws/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket')
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket')
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })
  }

  return socket
}

export function subscribeTrolley(trolleyId: number): void {
  const socket = getSocket()
  socket.emit('subscribe_trolley', { trolley_id: trolleyId })
  console.log(`📡 Subscribed to trolley ${trolleyId}`)
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

