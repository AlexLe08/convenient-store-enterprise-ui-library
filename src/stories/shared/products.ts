import type { SearchSuggestion } from '@/types/search'

export interface Product {
  id: string
  label: string
  price: number
  category: string
  imageUrl: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    label: 'iPhone 15 Pro',
    price: 999,
    category: 'Phones',
    imageUrl: 'https://placehold.co/400x400/e0e7ff/3730a3?text=iPhone+15+Pro',
  },
  {
    id: 'p2',
    label: 'iPhone 15',
    price: 799,
    category: 'Phones',
    imageUrl: 'https://placehold.co/400x400/e0e7ff/3730a3?text=iPhone+15',
  },
  {
    id: 'p3',
    label: 'Samsung Galaxy S24',
    price: 899,
    category: 'Phones',
    imageUrl: 'https://placehold.co/400x400/dbeafe/1e40af?text=Galaxy+S24',
  },
  {
    id: 'p4',
    label: 'Google Pixel 8',
    price: 699,
    category: 'Phones',
    imageUrl: 'https://placehold.co/400x400/dbeafe/1e40af?text=Pixel+8',
  },
  {
    id: 'p5',
    label: 'iPad Air',
    price: 599,
    category: 'Tablets',
    imageUrl: 'https://placehold.co/400x400/d1fae5/065f46?text=iPad+Air',
  },
  {
    id: 'p6',
    label: 'MacBook Pro 14"',
    price: 1999,
    category: 'Laptops',
    imageUrl: 'https://placehold.co/400x400/fef3c7/92400e?text=MacBook+Pro',
  },
  {
    id: 'p7',
    label: 'Sony WH-1000XM5',
    price: 399,
    category: 'Audio',
    imageUrl: 'https://placehold.co/400x400/fce7f3/9d174d?text=WH-1000XM5',
  },
  {
    id: 'p8',
    label: 'AirPods Pro',
    price: 249,
    category: 'Audio',
    imageUrl: 'https://placehold.co/400x400/fce7f3/9d174d?text=AirPods+Pro',
  },
  {
    id: 'p9',
    label: 'Samsung Galaxy Buds',
    price: 149,
    category: 'Audio',
    imageUrl: 'https://placehold.co/400x400/fce7f3/9d174d?text=Galaxy+Buds',
  },
]

export const SUGGESTIONS: SearchSuggestion[] = PRODUCTS.map((p) => ({
  id: p.id,
  label: p.label,
  category: p.category,
  keywords: [p.category.toLowerCase()],
  imageUrl: p.imageUrl.replace('400x400', '80x80'),
}))

export const CATEGORIES = ['Phones', 'Tablets', 'Laptops', 'Audio']
