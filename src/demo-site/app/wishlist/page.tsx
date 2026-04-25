'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/demo-site/components/ui/select'
import { useStore } from '@/demo-site/lib/store-context'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, moveToCart } = useStore()
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { color: string; size: string }>>({})

  const handleMoveToCart = (productId: string) => {
    const product = wishlist.find(item => item.product.id === productId)?.product
    if (!product) return

    const options = selectedOptions[productId] || {
      color: product.colors[0]?.name || '',
      size: product.sizes[0] || '',
    }
    
    moveToCart(productId, options.color, options.size)
  }

  const handleOptionChange = (productId: string, type: 'color' | 'size', value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type]: value,
      },
    }))
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16" data-testid="empty-wishlist">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="empty-wishlist-title">
            Your wishlist is empty
          </h1>
          <p className="text-muted-foreground mb-6">
            Save items you love by clicking the heart icon on any product.
          </p>
          <Button asChild size="lg" data-testid="empty-wishlist-cta">
            <Link href="/demo-store/shop">Discover Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="wishlist-title">My Wishlist</h1>
          <p className="text-muted-foreground">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <Button variant="outline" data-testid="share-wishlist">
          <Share2 className="h-4 w-4 mr-2" />
          Share Wishlist
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="wishlist-grid">
        {wishlist.map((item) => {
          const { product } = item
          const options = selectedOptions[product.id] || {
            color: product.colors[0]?.name || '',
            size: product.sizes[0] || '',
          }

          return (
            <div 
              key={product.id}
              className="group border rounded-lg overflow-hidden"
              data-testid="wishlist-item"
              data-product-id={product.id}
            >
              {/* Product Image */}
              <Link 
                href={`/product/${product.slug}`}
                className="block relative aspect-square bg-muted"
              >
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-medium">Out of Stock</span>
                  </div>
                )}
              </Link>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <Link 
                  href={`/product/${product.slug}`}
                  className="font-medium hover:underline line-clamp-1"
                  data-testid="wishlist-item-name"
                >
                  {product.name}
                </Link>
                
                <div className="flex items-center gap-2">
                  <span className="font-semibold" data-testid="wishlist-item-price">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Options */}
                {product.inStock && (
                  <div className="space-y-2">
                    {product.colors.length > 0 && (
                      <Select
                        value={options.color}
                        onValueChange={(value) => handleOptionChange(product.id, 'color', value)}
                      >
                        <SelectTrigger className="h-9" data-testid="wishlist-color-select">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.colors.map(color => (
                            <SelectItem key={color.name} value={color.name}>
                              {color.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {product.sizes.length > 0 && product.sizes[0] !== 'One Size' && (
                      <Select
                        value={options.size}
                        onValueChange={(value) => handleOptionChange(product.id, 'size', value)}
                      >
                        <SelectTrigger className="h-9" data-testid="wishlist-size-select">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.sizes.map(size => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {product.inStock ? (
                    <Button 
                      className="flex-1"
                      onClick={() => handleMoveToCart(product.id)}
                      data-testid="wishlist-move-to-cart"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  ) : (
                    <Button className="flex-1" disabled>
                      Out of Stock
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromWishlist(product.id)}
                    data-testid="wishlist-remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
