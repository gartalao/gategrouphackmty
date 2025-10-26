import type { Product } from "@/types"
import { getCategoryEmoji } from "@/utils/formatters"

interface CategoryStatsProps {
  products: Product[]
}

export function CategoryStats({ products }: CategoryStatsProps) {
  const categoryMap = new Map<string, number>()

  products.forEach((product) => {
    const current = categoryMap.get(product.category) || 0
    categoryMap.set(product.category, current + product.count)
  })

  const total = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0)

  const categories = Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))

  return (
    <div className="bg-white rounded border border-gray-300 flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Categorías</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-xs">Sin datos</p>
            </div>
          ) : (
            categories.map(({ category, count, percentage }) => (
              <div
                key={category}
                className="bg-gray-50 rounded border border-gray-200 p-3 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getCategoryEmoji(category)}</span>
                  <h3 className="text-gray-900 font-medium text-sm">{category}</h3>
                </div>
                <p className="text-gray-600 text-xs font-mono">
                  {count} items • {percentage}%
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
