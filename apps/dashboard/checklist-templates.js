// Checklist Templates
export const CHECKLIST_TEMPLATES = {
  bebidas: {
    id: 'bebidas',
    name: '🥤 Checklist Bebidas',
    description: 'Bebidas refrescantes y agua',
    products: [
      { id: 1, name: 'Coca-Cola Regular Lata', category: 'Bebidas' },
      { id: 2, name: 'Sprite Lata', category: 'Bebidas' },
      { id: 3, name: 'Pepsi Lata', category: 'Bebidas' },
      { id: 4, name: 'Agua Natural 500ml', category: 'Bebidas' },
      { id: 5, name: 'Electrolit Botella 355ml', category: 'Bebidas' }
    ]
  },
  snacks: {
    id: 'snacks',
    name: '🍿 Checklist Snacks',
    description: 'Papas y snacks salados',
    products: [
      { id: 6, name: 'Doritos Nacho', category: 'Snacks' },
      { id: 7, name: 'Lays Original', category: 'Snacks' },
      { id: 8, name: 'Lays Queso', category: 'Snacks' },
      { id: 9, name: 'Sabritas Original', category: 'Snacks' },
      { id: 10, name: 'Takis', category: 'Snacks' }
    ]
  },
  cervezas: {
    id: 'cervezas',
    name: '🍺 Checklist Cervezas',
    description: 'Cervezas nacionales e importadas',
    products: [
      { id: 11, name: 'Amstel Ultra Lata', category: 'Bebidas' },
      { id: 12, name: 'Modelo Especial Lata', category: 'Bebidas' },
      { id: 13, name: 'Corona Extra Lata', category: 'Bebidas' },
      { id: 14, name: 'Heineken Botella', category: 'Bebidas' }
    ]
  },
  jugos: {
    id: 'jugos',
    name: '🥤 Checklist Jugos',
    description: 'Jugos y bebidas de fruta',
    products: [
      { id: 15, name: 'Del Valle Naranja', category: 'Bebidas' },
      { id: 16, name: 'Del Valle Durazno', category: 'Bebidas' },
      { id: 17, name: 'Del Valle Uva', category: 'Bebidas' },
      { id: 18, name: 'Santa Clara Chocolate', category: 'Bebidas' }
    ]
  },
  galletas: {
    id: 'galletas',
    name: '🍪 Checklist Galletas',
    description: 'Galletas dulces',
    products: [
      { id: 19, name: 'Galletas Príncipe', category: 'Snacks' },
      { id: 20, name: 'Galletas Canelitas', category: 'Snacks' }
    ]
  }
}

export interface ChecklistTemplate {
  id: string
  name: string
  description: string
  products: Array<{
    id: number
    name: string
    category: string
  }>
}

export interface ChecklistItem {
  productId: number
  productName: string
  category: string
  status: 'pending' | 'detected' | 'completed'
  detectedAt?: string
  confidence?: number
  count?: number
}

export interface ActiveChecklist {
  template: ChecklistTemplate
  items: ChecklistItem[]
  progress: number // 0-100
  completedItems: number
  totalItems: number
}
