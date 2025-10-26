import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es,
    })
  } catch {
    return "Desconocido"
  }
}

export function calculateDuration(startedAt: string): string {
  try {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)

    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`
    }
    return `${diffSecs}s`
  } catch {
    return "Inactivo"
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "bg-green-600"
  if (confidence >= 0.7) return "bg-yellow-600"
  return "bg-red-600"
}

export function getConfidenceTextColor(confidence: number): string {
  if (confidence >= 0.9) return "text-green-500"
  if (confidence >= 0.7) return "text-yellow-500"
  return "text-red-500"
}

export function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    Bebidas: "🥤",
    Snacks: "🍪",
    Comida: "🍽️",
    Postres: "🍰",
    Frutas: "🍎",
    Lácteos: "🥛",
  }
  return emojiMap[category] || "📦"
}
