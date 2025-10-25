import { ShelfStatus } from '@/lib/api'
import { StatusPill } from './StatusPill'
import { DiffTable } from './DiffTable'
import { formatDistanceToNow } from 'date-fns'

interface ShelfCardProps {
  shelf: ShelfStatus
}

export function ShelfCard({ shelf }: ShelfCardProps) {
  const positionLabel = shelf.position
    ? shelf.position.charAt(0).toUpperCase() + shelf.position.slice(1)
    : `Shelf ${shelf.shelf_number}`

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">{positionLabel}</h3>
          <p className="text-xs text-gray-500">Shelf {shelf.shelf_number}</p>
        </div>
        <StatusPill color={shelf.color} />
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Last scan:</span>
          <span className="font-medium">
            {shelf.last_scan_at
              ? formatDistanceToNow(new Date(shelf.last_scan_at), { addSuffix: true })
              : 'Never'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Confidence:</span>
          <span
            className={`font-medium ${
              shelf.avg_confidence >= 0.8
                ? 'text-trolley-green'
                : shelf.avg_confidence >= 0.6
                ? 'text-trolley-yellow'
                : 'text-trolley-red'
            }`}
          >
            {(shelf.avg_confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Active alerts:</span>
          <span
            className={`font-medium ${
              shelf.active_alerts === 0 ? 'text-trolley-green' : 'text-trolley-red'
            }`}
          >
            {shelf.active_alerts}
          </span>
        </div>
      </div>

      <div className="border-t pt-3">
        <h4 className="text-sm font-medium mb-2">Items:</h4>
        <DiffTable diffs={shelf.diffs} />
      </div>

      {shelf.image_url && (
        <div className="mt-3 border-t pt-3">
          <img
            src={`http://localhost:4000${shelf.image_url}`}
            alt={`Shelf ${shelf.shelf_number}`}
            className="w-full h-32 object-cover rounded"
          />
        </div>
      )}
    </div>
  )
}

