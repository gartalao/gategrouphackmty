import type { Product } from "../types"
import { getCategoryEmoji } from "../utils/formatters"

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
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">📊 Distribución por Categoría</h2>
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Sin datos</p>
          </div>
        ) : (
          categories.map(({ category, count, percentage }) => (
            <div
              key={category}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCategoryEmoji(category)}</span>
                <h3 className="text-white font-semibold">{category}</h3>
              </div>
              <p className="text-gray-400 text-sm">{count} productos</p>
              <p className="text-gray-500 text-xs">{percentage}% del total</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
