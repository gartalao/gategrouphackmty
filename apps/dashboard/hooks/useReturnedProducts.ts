"use client"

import { useEffect, useState, useRef } from "react"
import { io, Socket } from 'socket.io-client'
import type { ProductDetectedEvent } from "@/types"

interface ReturnedProduct {
  product_id: number
  product_name: string
  category: string
  confidence: number
  detected_at: string
}

interface ReturnedProductsState {
  products: ReturnedProduct[]
  totalReturned: number
  isConnected: boolean
}

export function useReturnedProducts(trolleyId: number) {
  const [state, setState] = useState<ReturnedProductsState>({
    products: [],
    totalReturned: 0,
    isConnected: false
  })
  
  const [socket, setSocket] = useState<Socket | null>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    console.log('[Dashboard] Setting up returned products WebSocket for trolley:', trolleyId)
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    const newSocket = io(`${wsUrl}/ws`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 5000,
    })

    newSocket.on('connect', () => {
      console.log('[Dashboard] Returned products WebSocket connected')
      setState(prev => ({ ...prev, isConnected: true }))
    })

    newSocket.on('disconnect', (reason) => {
      console.log('[Dashboard] Returned products WebSocket disconnected:', reason)
      setState(prev => ({ ...prev, isConnected: false }))
    })

    newSocket.on('connect_error', (error) => {
      console.warn('[Dashboard] Returned products WebSocket error:', error.message)
      setState(prev => ({ ...prev, isConnected: false }))
    })

    // Escuchar eventos de productos detectados
    newSocket.on('product_detected', (event: ProductDetectedEvent) => {
      console.log('[Dashboard] Product detected event:', event)
      
      // Solo procesar si es un return scan y pertenece a nuestro trolley
      if (event.scan_type === 'return' && event.trolley_id === trolleyId) {
        console.log('[Dashboard] Processing returned product:', event.product_name)
        
        const returnedProduct: ReturnedProduct = {
          product_id: event.product_id,
          product_name: event.product_name,
          category: event.category,
          confidence: event.confidence,
          detected_at: event.detected_at
        }

        setState(prev => {
          // Evitar duplicados
          const exists = prev.products.some(p => p.product_id === returnedProduct.product_id)
          if (exists) {
            console.log('[Dashboard] Product already in returned list:', returnedProduct.product_name)
            return prev
          }

          const newProducts = [...prev.products, returnedProduct]
          console.log('[Dashboard] Added returned product:', returnedProduct.product_name)
          console.log('[Dashboard] Total returned products:', newProducts.length)
          
          return {
            ...prev,
            products: newProducts,
            totalReturned: newProducts.length
          }
        })
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      hasInitialized.current = false
    }
  }, [trolleyId])

  // Función para limpiar productos retornados (útil para resetear)
  const clearReturnedProducts = () => {
    setState(prev => ({
      ...prev,
      products: [],
      totalReturned: 0
    }))
  }

  return {
    ...state,
    clearReturnedProducts,
    socket
  }
}
