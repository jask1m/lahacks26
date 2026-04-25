'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Product, type CartItem, products } from './mock-data'

interface WishlistItem {
  product: Product
  addedAt: Date
}

interface StoreContextType {
  // Cart
  cart: CartItem[]
  addToCart: (product: Product, quantity: number, color: string, size: string) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  
  // Wishlist
  wishlist: WishlistItem[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  moveToCart: (productId: string, color: string, size: string) => void
  
  // Toast notifications
  toast: { message: string; type: 'success' | 'error' } | null
  showToast: (message: string, type: 'success' | 'error') => void
  
  // Promo code
  promoCode: string | null
  promoDiscount: number
  applyPromoCode: (code: string) => boolean
  removePromoCode: () => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const VALID_PROMO_CODES: Record<string, number> = {
  'SAVE10': 0.10,
  'SAVE20': 0.20,
  'WELCOME': 0.15,
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const addToCart = useCallback((product: Product, quantity: number, color: string, size: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && 
                item.selectedColor === color && 
                item.selectedSize === size
      )
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        }
        return updated
      }
      
      return [...prev, { product, quantity, selectedColor: color, selectedSize: size }]
    })
    showToast('Added to cart', 'success')
  }, [showToast])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
    showToast('Cart updated', 'success')
  }, [showToast])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ))
    showToast('Cart updated', 'success')
  }, [removeFromCart, showToast])

  const clearCart = useCallback(() => {
    setCart([])
    setPromoCode(null)
    setPromoDiscount(0)
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prev => {
      if (prev.some(item => item.product.id === product.id)) {
        return prev
      }
      return [...prev, { product, addedAt: new Date() }]
    })
    showToast('Added to wishlist', 'success')
  }, [showToast])

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(item => item.product.id !== productId))
    showToast('Removed from wishlist', 'success')
  }, [showToast])

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(item => item.product.id === productId)
  }, [wishlist])

  const moveToCart = useCallback((productId: string, color: string, size: string) => {
    const wishlistItem = wishlist.find(item => item.product.id === productId)
    if (wishlistItem) {
      addToCart(wishlistItem.product, 1, color, size)
      removeFromWishlist(productId)
    }
  }, [wishlist, addToCart, removeFromWishlist])

  const applyPromoCode = useCallback((code: string): boolean => {
    const upperCode = code.toUpperCase()
    if (VALID_PROMO_CODES[upperCode]) {
      setPromoCode(upperCode)
      setPromoDiscount(VALID_PROMO_CODES[upperCode])
      showToast('Promo code applied', 'success')
      return true
    }
    showToast('Invalid promo code', 'error')
    return false
  }, [showToast])

  const removePromoCode = useCallback(() => {
    setPromoCode(null)
    setPromoDiscount(0)
    showToast('Promo code removed', 'success')
  }, [showToast])

  return (
    <StoreContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      moveToCart,
      toast,
      showToast,
      promoCode,
      promoDiscount,
      applyPromoCode,
      removePromoCode,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
