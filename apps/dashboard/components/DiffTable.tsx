import { Diff } from '@/lib/api'

interface DiffTableProps {
  diffs: Diff[]
}

export function DiffTable({ diffs }: DiffTableProps) {
  if (diffs.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No items detected yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-gray-700">SKU</th>
            <th className="text-right py-2 px-2 font-medium text-gray-700">Required</th>
            <th className="text-right py-2 px-2 font-medium text-gray-700">Detected</th>
            <th className="text-right py-2 px-2 font-medium text-gray-700">Diff</th>
            <th className="text-left py-2 px-2 font-medium text-gray-700">Type</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map((diff, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="py-2 px-2 font-mono text-xs">{diff.sku}</td>
              <td className="py-2 px-2 text-right">{diff.required}</td>
              <td className="py-2 px-2 text-right">{diff.detected}</td>
              <td
                className={`py-2 px-2 text-right font-medium ${
                  diff.diff < 0
                    ? 'text-trolley-red'
                    : diff.diff > 0
                    ? 'text-trolley-yellow'
                    : 'text-trolley-green'
                }`}
              >
                {diff.diff > 0 ? '+' : ''}
                {diff.diff}
              </td>
              <td className="py-2 px-2">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    diff.type === 'missing'
                      ? 'bg-red-100 text-red-800'
                      : diff.type === 'extra'
                      ? 'bg-yellow-100 text-yellow-800'
                      : diff.type === 'mismatch'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {diff.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

