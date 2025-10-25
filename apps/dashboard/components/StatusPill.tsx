import clsx from 'clsx'

interface StatusPillProps {
  color: 'green' | 'yellow' | 'red'
  label?: string
}

export function StatusPill({ color, label }: StatusPillProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx('w-3 h-3 rounded-full', {
          'bg-trolley-green': color === 'green',
          'bg-trolley-yellow': color === 'yellow',
          'bg-trolley-red': color === 'red',
        })}
      />
      {label && (
        <span
          className={clsx('text-sm font-medium', {
            'text-trolley-green': color === 'green',
            'text-trolley-yellow': color === 'yellow',
            'text-trolley-red': color === 'red',
          })}
        >
          {label}
        </span>
      )}
    </div>
  )
}

