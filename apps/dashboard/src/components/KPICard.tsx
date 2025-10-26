import type { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color: "blue" | "green" | "purple" | "orange"
}

const colorClasses = {
  blue: "bg-blue-600/20 text-blue-500",
  green: "bg-green-600/20 text-green-500",
  purple: "bg-purple-600/20 text-purple-500",
  orange: "bg-orange-600/20 text-orange-500",
}

export function KPICard({ title, value, subtitle, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-white text-4xl font-bold">{value}</p>
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
    </div>
  )
}
