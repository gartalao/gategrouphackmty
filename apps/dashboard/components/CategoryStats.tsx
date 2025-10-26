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
    <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">CATEGORÍAS</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-base text-gray-400 font-medium">Sin datos</p>
            </div>
          ) : (
            categories.map(({ category, count, percentage }) => (
              <div
                key={category}
                className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryEmoji(category)}</span>
                    <h3 className="text-gray-900 font-semibold text-sm">{category}</h3>
                  </div>
                  <span className="text-gray-600 text-sm font-bold tabular-nums">
                    {count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
