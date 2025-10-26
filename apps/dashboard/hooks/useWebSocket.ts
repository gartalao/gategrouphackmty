"use client"

import { useEffect, useState, useRef } from "react"
import { io, Socket } from 'socket.io-client'
import type { ProductDetectedEvent } from "@/types"

export function useWebSocket(onProductDetected: (event: ProductDetectedEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const callbackRef = useRef(onProductDetected)
  const hasInitialized = useRef(false)

  useEffect(() => {
    callbackRef.current = onProductDetected
  })

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Try to connect to real WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    console.log('[Dashboard] Attempting WebSocket connection to:', `${wsUrl}/ws`)
    
    const newSocket = io(`${wsUrl}/ws`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 5000,
    })

    newSocket.on('connect', () => {
      console.log('[Dashboard] WebSocket connected successfully')
      setIsConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('[Dashboard] WebSocket disconnected:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.warn('[Dashboard] WebSocket connection error:', error.message)
      setIsConnected(false)
    })

    newSocket.on('product_detected', (event: ProductDetectedEvent) => {
      console.log('[Dashboard] Product detected event:', event)
      callbackRef.current(event)
    })

    setSocket(newSocket)

    // Fallback: If WebSocket fails to connect after 3 seconds, simulate mock data
    const fallbackTimer = setTimeout(() => {
      if (!isConnected) {
        console.log('[Dashboard] WebSocket fallback: Using mock data')
        simulateMockDetections()
      }
    }, 3000)

    return () => {
      clearTimeout(fallbackTimer)
      newSocket.disconnect()
      hasInitialized.current = false
    }
  }, [])

  // Mock data simulation for fallback
  const simulateMockDetections = () => {
    const mockInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const mockProducts = [
          { id: 1, name: "Coca-Cola Regular Lata", category: "Bebidas" },
          { id: 2, name: "Sprite Lata", category: "Bebidas" },
          { id: 3, name: "Doritos Nacho", category: "Snacks" },
          { id: 4, name: "Lays Original", category: "Snacks" },
          { id: 5, name: "Agua Natural", category: "Bebidas" },
        ]

        const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)]
        const mockEvent: ProductDetectedEvent = {
          event: 'product_detected',
          trolley_id: 1,
          product_id: randomProduct.id,
          product_name: randomProduct.name,
          category: randomProduct.category,
          confidence: 0.85 + Math.random() * 0.14,
          detected_at: new Date().toISOString(),
          operator_id: 1,
        }

        console.log("[Dashboard] Mock product detected:", mockEvent)
        callbackRef.current(mockEvent)
      }
    }, 5000)

    return () => clearInterval(mockInterval)
  }

  return { socket, isConnected }
}
