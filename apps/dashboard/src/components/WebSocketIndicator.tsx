import { Wifi, WifiOff } from "lucide-react"

interface WebSocketIndicatorProps {
  isConnected: boolean
}

export function WebSocketIndicator({ isConnected }: WebSocketIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isConnected ? "bg-green-600/20 text-green-500" : "bg-red-600/20 text-red-500"
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Conectado</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Desconectado</span>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </>
      )}
    </div>
  )
}
