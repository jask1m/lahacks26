'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Input } from '@/demo-site/components/ui/input'
import { Separator } from '@/demo-site/components/ui/separator'
import { useStore } from '@/demo-site/lib/store-context'
import { cn } from '@/demo-site/lib/utils'

export default function CartPage() {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    cartTotal,
    promoCode,
    promoDiscount,
    applyPromoCode,
    removePromoCode,
    addToWishlist 
  } = useStore()

  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState(false)

  const handleApplyPromo = () => {
    setPromoError(false)
    const success = applyPromoCode(promoInput)
    if (!success) {
      setPromoError(true)
    } else {
      setPromoInput('')
    }
  }

  const handleSaveForLater = (productId: string) => {
    const item = cart.find(i => i.product.id === productId)
    if (item) {
      addToWishlist(item.product)
      removeFromCart(productId)
    }
  }

  const subtotal = cartTotal
  const shipping = cartTotal >= 75 ? 0 : 9.99
  const discount = subtotal * promoDiscount
  const tax = (subtotal - discount) * 0.08
  const total = subtotal - discount + shipping + tax

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16" data-testid="empty-cart">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="empty-cart-title">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you have not added anything to your cart yet.
          </p>
          <Button asChild size="lg" data-testid="empty-cart-cta">
            <Link href="/demo-store/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" data-testid="cart-title">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <div 
              key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
              className="flex gap-4 p-4 border rounded-lg"
              data-testid="cart-line-item"
              data-product-id={item.product.id}
            >
              {/* Product Image */}
              <Link 
                href={`/product/${item.product.slug}`}
                className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </Link>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <div>
                    <Link 
                      href={`/product/${item.product.slug}`}
                      className="font-medium hover:underline line-clamp-1"
                      data-testid="cart-item-name"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.selectedColor && `Color: ${item.selectedColor}`}
                      {item.selectedColor && item.selectedSize && ' / '}
                      {item.selectedSize && `Size: ${item.selectedSize}`}
                    </p>
                  </div>
                  <p className="font-semibold" data-testid="cart-item-price">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      data-testid="cart-qty-decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-center"
                      data-testid="cart-qty-input"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stockCount}
                      data-testid="cart-qty-increase"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleSaveForLater(item.product.id)}
                      data-testid="cart-save-for-later"
                    >
                      Save for Later
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                      data-testid="cart-remove-btn"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-24" data-testid="order-summary">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {/* Promo Code */}
            <div className="mb-4">
              {promoCode ? (
                <div 
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  data-testid="promo-applied"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{promoCode}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={removePromoCode}
                    data-testid="promo-remove"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value)
                      setPromoError(false)
                    }}
                    className={cn(promoError && "border-destructive")}
                    data-testid="promo-input"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyPromo}
                    disabled={!promoInput}
                    data-testid="promo-apply"
                  >
                    Apply
                  </Button>
                </div>
              )}
              {promoError && (
                <p className="text-sm text-destructive mt-1" data-testid="promo-error">
                  Invalid promo code
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Try: SAVE10, SAVE20, or WELCOME
              </p>
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({Math.round(promoDiscount * 100)}%)</span>
                  <span data-testid="cart-discount">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span data-testid="cart-shipping">
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span data-testid="cart-tax">${tax.toFixed(2)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span data-testid="cart-total">${total.toFixed(2)}</span>
              </div>
            </div>

            {shipping > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                Add ${(75 - subtotal).toFixed(2)} more for free shipping!
              </p>
            )}

            <Button 
              className="w-full mt-6" 
              size="lg"
              asChild
              data-testid="cart-checkout-btn"
            >
              <Link href="/demo-store/checkout">
                Proceed to Checkout
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              className="w-full mt-2"
              asChild
            >
              <Link href="/demo-store/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
