import { Wifi, WifiOff } from "lucide-react"

interface WebSocketIndicatorProps {
  isConnected: boolean
}

export function WebSocketIndicator({ isConnected }: WebSocketIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium ${
        isConnected ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>CONECTADO</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>DESCONECTADO</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
        </>
      )}
    </div>
  )
}
