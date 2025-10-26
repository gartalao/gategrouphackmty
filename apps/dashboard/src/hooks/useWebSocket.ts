"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import type { ProductDetectedEvent } from "../types"

const WS_URL = "http://localhost:3001"

export function useWebSocket(onProductDetected: (event: ProductDetectedEvent) => void) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(WS_URL)

    newSocket.on("connect", () => {
      console.log("[v0] WebSocket connected")
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      console.log("[v0] WebSocket disconnected")
      setIsConnected(false)
    })

    newSocket.on("product_detected", (event: ProductDetectedEvent) => {
      console.log("[v0] Product detected event:", event)
      onProductDetected(event)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [onProductDetected])

  return { socket, isConnected }
}
