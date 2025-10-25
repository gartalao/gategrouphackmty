interface AlertBadgeProps {
  count: number
  severity?: 'critical' | 'warning'
}

export function AlertBadge({ count, severity = 'warning' }: AlertBadgeProps) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        No alerts
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        severity === 'critical'
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {count} {count === 1 ? 'alert' : 'alerts'}
    </span>
  )
}

