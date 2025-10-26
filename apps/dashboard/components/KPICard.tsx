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
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-center mb-3">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-gray-900 text-3xl font-bold tabular-nums">{value}</p>
        <p className="text-gray-400 text-xs font-medium">{subtitle}</p>
      </div>
    </div>
  )
}
