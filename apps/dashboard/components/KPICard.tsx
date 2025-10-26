import type { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color: "blue" | "green" | "purple" | "orange"
}

const colorClasses = {
  blue: "bg-gray-100 text-gray-700",
  green: "bg-gray-100 text-gray-700",
  purple: "bg-gray-100 text-gray-700",
  orange: "bg-gray-100 text-gray-700",
}

export function KPICard({ title, value, subtitle, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-white rounded border border-gray-300 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-gray-900 text-2xl font-bold">{value}</p>
        <p className="text-gray-400 text-xs">{subtitle}</p>
      </div>
    </div>
  )
}
