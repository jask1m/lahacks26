'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Badge } from '@/demo-site/components/ui/badge'
import { useStore } from '@/demo-site/lib/store-context'
import { type Product } from '@/demo-site/lib/mock-data'
import { cn } from '@/demo-site/lib/utils'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore()
  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product, 1, product.colors[0]?.name || '', product.sizes[0] || '')
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (inWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  return (
    <div 
      className="group relative"
      data-testid="product-card"
      data-product-id={product.id}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={index < 4}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className="bg-blue-600 hover:bg-blue-600" data-testid="badge-new">
                New
              </Badge>
            )}
            {product.originalPrice && (
              <Badge variant="destructive" data-testid="badge-sale">
                Sale
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="secondary" data-testid="badge-out-of-stock">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleToggleWishlist}
            data-testid="product-wishlist-btn"
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500 text-red-500")} />
            <span className="sr-only">{inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</span>
          </Button>

          {/* Quick Add Button */}
          {product.inStock && (
            <Button
              className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddToCart}
              data-testid="product-add-cart"
            >
              Add to Cart
            </Button>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.floor(product.rating) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground" data-testid="product-rating">
              ({product.reviewCount})
            </span>
          </div>
          
          <h3 className="font-medium text-sm line-clamp-1" data-testid="product-name">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold" data-testid="product-price">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through" data-testid="product-original-price">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
