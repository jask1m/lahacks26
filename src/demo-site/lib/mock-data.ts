// Deterministic mock data for QA testing

export interface Product {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number
  category: string
  description: string
  images: string[]
  colors: { name: string; value: string }[]
  sizes: string[]
  rating: number
  reviewCount: number
  inStock: boolean
  stockCount: number
  featured: boolean
  isNew: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  selectedColor: string
  selectedSize: string
}

export interface Order {
  id: string
  date: string
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: { name: string; quantity: number; price: number }[]
  trackingNumber?: string
}

export interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

export const categories = [
  { id: 'clothing', name: 'Clothing', count: 24 },
  { id: 'shoes', name: 'Shoes', count: 18 },
  { id: 'accessories', name: 'Accessories', count: 32 },
  { id: 'electronics', name: 'Electronics', count: 15 },
  { id: 'home', name: 'Home & Living', count: 21 },
]

export const products: Product[] = [
  {
    id: 'prod-001',
    slug: 'classic-cotton-tshirt',
    name: 'Classic Cotton T-Shirt',
    price: 29.99,
    originalPrice: 39.99,
    category: 'clothing',
    description: 'A timeless classic cotton t-shirt made from 100% organic cotton. Features a relaxed fit and reinforced stitching for durability. Perfect for everyday wear.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'White', value: '#FFFFFF' },
      { name: 'Black', value: '#000000' },
      { name: 'Navy', value: '#1E3A5F' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
    stockCount: 45,
    featured: true,
    isNew: false,
  },
  {
    id: 'prod-002',
    slug: 'premium-leather-sneakers',
    name: 'Premium Leather Sneakers',
    price: 149.99,
    category: 'shoes',
    description: 'Handcrafted premium leather sneakers with cushioned insoles and durable rubber outsoles. Designed for comfort and style.',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'White', value: '#FFFFFF' },
      { name: 'Black', value: '#000000' },
      { name: 'Brown', value: '#8B4513' },
    ],
    sizes: ['7', '8', '9', '10', '11', '12'],
    rating: 4.8,
    reviewCount: 89,
    inStock: true,
    stockCount: 23,
    featured: true,
    isNew: true,
  },
  {
    id: 'prod-003',
    slug: 'minimalist-watch',
    name: 'Minimalist Watch',
    price: 199.99,
    originalPrice: 249.99,
    category: 'accessories',
    description: 'A sleek minimalist watch featuring a Japanese quartz movement, sapphire crystal glass, and genuine leather strap.',
    images: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Silver', value: '#C0C0C0' },
      { name: 'Gold', value: '#FFD700' },
      { name: 'Rose Gold', value: '#B76E79' },
    ],
    sizes: ['One Size'],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    stockCount: 12,
    featured: true,
    isNew: false,
  },
  {
    id: 'prod-004',
    slug: 'wireless-noise-canceling-headphones',
    name: 'Wireless Noise-Canceling Headphones',
    price: 299.99,
    category: 'electronics',
    description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and studio-quality sound.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Black', value: '#000000' },
      { name: 'Silver', value: '#C0C0C0' },
      { name: 'Midnight Blue', value: '#191970' },
    ],
    sizes: ['One Size'],
    rating: 4.9,
    reviewCount: 312,
    inStock: true,
    stockCount: 67,
    featured: true,
    isNew: true,
  },
  {
    id: 'prod-005',
    slug: 'ceramic-vase-set',
    name: 'Ceramic Vase Set',
    price: 79.99,
    category: 'home',
    description: 'Elegant set of three ceramic vases in complementary sizes. Hand-finished with a matte glaze.',
    images: [
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'White', value: '#FFFFFF' },
      { name: 'Terracotta', value: '#E2725B' },
      { name: 'Sage', value: '#9DC183' },
    ],
    sizes: ['Set of 3'],
    rating: 4.6,
    reviewCount: 45,
    inStock: true,
    stockCount: 34,
    featured: false,
    isNew: false,
  },
  {
    id: 'prod-006',
    slug: 'slim-fit-chinos',
    name: 'Slim Fit Chinos',
    price: 69.99,
    category: 'clothing',
    description: 'Modern slim fit chinos crafted from stretch cotton twill. Features a tailored silhouette with comfortable movement.',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Khaki', value: '#C3B091' },
      { name: 'Navy', value: '#1E3A5F' },
      { name: 'Olive', value: '#556B2F' },
    ],
    sizes: ['28', '30', '32', '34', '36'],
    rating: 4.4,
    reviewCount: 78,
    inStock: true,
    stockCount: 56,
    featured: false,
    isNew: false,
  },
  {
    id: 'prod-007',
    slug: 'running-shoes-pro',
    name: 'Running Shoes Pro',
    price: 129.99,
    originalPrice: 159.99,
    category: 'shoes',
    description: 'High-performance running shoes with responsive cushioning and breathable mesh upper. Designed for daily training.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Red', value: '#FF0000' },
      { name: 'Blue', value: '#0000FF' },
      { name: 'Black', value: '#000000' },
    ],
    sizes: ['7', '8', '9', '10', '11', '12'],
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
    stockCount: 89,
    featured: false,
    isNew: true,
  },
  {
    id: 'prod-008',
    slug: 'leather-crossbody-bag',
    name: 'Leather Crossbody Bag',
    price: 159.99,
    category: 'accessories',
    description: 'Versatile crossbody bag in genuine pebbled leather with adjustable strap and multiple compartments.',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Black', value: '#000000' },
      { name: 'Tan', value: '#D2B48C' },
      { name: 'Burgundy', value: '#800020' },
    ],
    sizes: ['One Size'],
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
    stockCount: 28,
    featured: false,
    isNew: false,
  },
  {
    id: 'prod-009',
    slug: 'smart-speaker',
    name: 'Smart Speaker',
    price: 99.99,
    category: 'electronics',
    description: 'Voice-controlled smart speaker with premium audio quality and smart home integration.',
    images: [
      'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Charcoal', value: '#36454F' },
      { name: 'Sand', value: '#C2B280' },
    ],
    sizes: ['One Size'],
    rating: 4.3,
    reviewCount: 189,
    inStock: true,
    stockCount: 145,
    featured: false,
    isNew: false,
  },
  {
    id: 'prod-010',
    slug: 'linen-throw-blanket',
    name: 'Linen Throw Blanket',
    price: 89.99,
    category: 'home',
    description: 'Luxuriously soft linen throw blanket. Stonewashed for extra softness. Perfect for year-round comfort.',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Natural', value: '#FAF0E6' },
      { name: 'Charcoal', value: '#36454F' },
      { name: 'Dusty Rose', value: '#DCAE96' },
    ],
    sizes: ['50x60"', '60x80"'],
    rating: 4.8,
    reviewCount: 92,
    inStock: true,
    stockCount: 41,
    featured: false,
    isNew: true,
  },
  {
    id: 'prod-011',
    slug: 'denim-jacket-classic',
    name: 'Classic Denim Jacket',
    price: 89.99,
    category: 'clothing',
    description: 'Timeless denim jacket with a classic fit. Made from premium denim with brass hardware.',
    images: [
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Light Wash', value: '#6F8FAF' },
      { name: 'Dark Wash', value: '#1F3A52' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.6,
    reviewCount: 134,
    inStock: false,
    stockCount: 0,
    featured: false,
    isNew: false,
  },
  {
    id: 'prod-012',
    slug: 'canvas-tote-bag',
    name: 'Canvas Tote Bag',
    price: 39.99,
    category: 'accessories',
    description: 'Durable canvas tote bag with reinforced handles and interior pocket. Perfect for everyday use.',
    images: [
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop',
    ],
    colors: [
      { name: 'Natural', value: '#FAF0E6' },
      { name: 'Black', value: '#000000' },
      { name: 'Navy', value: '#1E3A5F' },
    ],
    sizes: ['One Size'],
    rating: 4.4,
    reviewCount: 56,
    inStock: true,
    stockCount: 78,
    featured: false,
    isNew: false,
  },
]

export const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 179.98,
    items: [
      { name: 'Classic Cotton T-Shirt', quantity: 2, price: 29.99 },
      { name: 'Running Shoes Pro', quantity: 1, price: 129.99 },
    ],
    trackingNumber: 'TRK-789456123',
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-28',
    status: 'shipped',
    total: 299.99,
    items: [
      { name: 'Wireless Noise-Canceling Headphones', quantity: 1, price: 299.99 },
    ],
    trackingNumber: 'TRK-456789012',
  },
  {
    id: 'ORD-2024-003',
    date: '2024-02-05',
    status: 'processing',
    total: 199.99,
    items: [
      { name: 'Minimalist Watch', quantity: 1, price: 199.99 },
    ],
  },
  {
    id: 'ORD-2024-004',
    date: '2024-02-10',
    status: 'cancelled',
    total: 89.99,
    items: [
      { name: 'Linen Throw Blanket', quantity: 1, price: 89.99 },
    ],
  },
]

export const mockAddresses: Address[] = [
  {
    id: 'addr-001',
    name: 'John Doe',
    street: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'United States',
    isDefault: true,
  },
  {
    id: 'addr-002',
    name: 'John Doe',
    street: '456 Oak Avenue',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    country: 'United States',
    isDefault: false,
  },
]

export const mockReviews = [
  {
    id: 'rev-001',
    author: 'Sarah M.',
    rating: 5,
    date: '2024-01-20',
    title: 'Excellent quality!',
    content: 'This product exceeded my expectations. The quality is outstanding and it fits perfectly. Highly recommend!',
    verified: true,
  },
  {
    id: 'rev-002',
    author: 'Mike T.',
    rating: 4,
    date: '2024-01-18',
    title: 'Great value for money',
    content: 'Good quality product at a reasonable price. Shipping was fast and packaging was excellent.',
    verified: true,
  },
  {
    id: 'rev-003',
    author: 'Emily R.',
    rating: 5,
    date: '2024-01-15',
    title: 'Love it!',
    content: 'Perfect addition to my collection. The color is exactly as shown in the pictures.',
    verified: false,
  },
  {
    id: 'rev-004',
    author: 'David L.',
    rating: 3,
    date: '2024-01-10',
    title: 'Decent but expected more',
    content: 'The product is okay but not as impressive as I hoped. Still usable though.',
    verified: true,
  },
]

export const faqs = [
  {
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for all unused items in their original packaging. Items must be returned with tags attached and in resalable condition.',
  },
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business day delivery. Free shipping on orders over $75.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to over 50 countries worldwide. International shipping times vary by destination, typically 7-14 business days.',
  },
  {
    question: 'How can I track my order?',
    answer: 'Once your order ships, you will receive an email with a tracking number. You can also track your order in the Account > Orders section.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.',
  },
  {
    question: 'Can I change or cancel my order?',
    answer: 'Orders can be modified or cancelled within 1 hour of placement. After that, please contact our support team for assistance.',
  },
]

export const promoBanners = [
  {
    id: 'promo-001',
    title: 'Spring Sale',
    subtitle: 'Up to 40% off select items',
    cta: 'Shop Now',
    href: '/demo-store/shop?sale=true',
  },
  {
    id: 'promo-002',
    title: 'Free Shipping',
    subtitle: 'On orders over $75',
    cta: 'Learn More',
    href: '/demo-store/support',
  },
]
