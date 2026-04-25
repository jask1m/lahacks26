'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Minus, Plus, Star, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Badge } from '@/demo-site/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/demo-site/components/ui/accordion'
import { ProductCard } from '@/demo-site/components/product-card'
import { useStore } from '@/demo-site/lib/store-context'
import { products, mockReviews } from '@/demo-site/lib/mock-data'
import { cn } from '@/demo-site/lib/utils'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore()
  
  const product = products.find(p => p.slug === slug)
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name || '')
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] || '')
  const [quantity, setQuantity] = useState(1)
  const [showAllReviews, setShowAllReviews] = useState(false)

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center" data-testid="product-not-found">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/demo-store/shop">Back to Shop</Link>
        </Button>
      </div>
    )
  }

  const inWishlist = isInWishlist(product.id)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor, selectedSize)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor, selectedSize)
    router.push('/demo-store/checkout')
  }

  const handleToggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const displayedReviews = showAllReviews ? mockReviews : mockReviews.slice(0, 2)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm" data-testid="breadcrumb">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/demo-store" className="hover:text-foreground">Home</Link></li>
          <li>/</li>
          <li><Link href="/demo-store/shop" className="hover:text-foreground">Shop</Link></li>
          <li>/</li>
          <li><Link href={`/shop?category=${product.category}`} className="hover:text-foreground capitalize">{product.category}</Link></li>
          <li>/</li>
          <li className="text-foreground truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4" data-testid="product-gallery">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
              data-testid="product-main-image"
            />
            
            {/* Image Navigation */}
            {product.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSelectedImage(i => i === 0 ? product.images.length - 1 : i - 1)}
                  data-testid="gallery-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSelectedImage(i => i === product.images.length - 1 ? 0 : i + 1)}
                  data-testid="gallery-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && <Badge className="bg-blue-600">New</Badge>}
              {product.originalPrice && <Badge variant="destructive">Sale</Badge>}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2" data-testid="thumbnail-list">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                    selectedImage === index ? "border-primary" : "border-transparent hover:border-muted-foreground"
                  )}
                  data-testid={`thumbnail-${index}`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title & Price */}
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="product-title">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.floor(product.rating) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground" data-testid="product-review-count">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold" data-testid="product-price">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through" data-testid="product-original-price">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <Badge variant="destructive">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground" data-testid="product-description">
            {product.description}
          </p>

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div>
              <label className="font-medium mb-2 block">
                Color: <span className="text-muted-foreground">{selectedColor}</span>
              </label>
              <div className="flex gap-2" data-testid="color-selector">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all",
                      selectedColor === color.name 
                        ? "border-primary ring-2 ring-primary ring-offset-2" 
                        : "border-muted hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    data-testid={`product-color-option-${color.name.toLowerCase()}`}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes.length > 0 && product.sizes[0] !== 'One Size' && (
            <div>
              <label className="font-medium mb-2 block">
                Size: <span className="text-muted-foreground">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2" data-testid="size-selector">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-colors",
                      selectedSize === size 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-input hover:border-primary"
                    )}
                    data-testid={`product-size-option-${size.toLowerCase()}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="font-medium mb-2 block">Quantity</label>
            <div className="flex items-center gap-3" data-testid="quantity-selector">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                data-testid="quantity-decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium" data-testid="quantity-value">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.min(product.stockCount, q + 1))}
                disabled={quantity >= product.stockCount}
                data-testid="quantity-increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {product.inStock && (
                <span className="text-sm text-muted-foreground" data-testid="stock-count">
                  {product.stockCount} in stock
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {product.inStock ? (
              <>
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleAddToCart}
                  data-testid="product-add-cart"
                >
                  Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="flex-1"
                  onClick={handleBuyNow}
                  data-testid="product-buy-now"
                >
                  Buy Now
                </Button>
              </>
            ) : (
              <Button size="lg" disabled className="flex-1" data-testid="product-out-of-stock">
                Out of Stock
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={handleToggleWishlist}
              data-testid="product-wishlist-btn"
            >
              <Heart className={cn("h-5 w-5", inWishlist && "fill-red-500 text-red-500")} />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span>2-Year Warranty</span>
            </div>
          </div>

          {/* Shipping & Returns Accordion */}
          <Accordion type="single" collapsible className="w-full" data-testid="product-accordion">
            <AccordionItem value="shipping">
              <AccordionTrigger data-testid="accordion-shipping">Shipping Information</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Standard shipping: 5-7 business days</li>
                  <li>Express shipping: 2-3 business days</li>
                  <li>Free shipping on orders over $75</li>
                  <li>International shipping available to 50+ countries</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionTrigger data-testid="accordion-returns">Returns & Exchanges</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>30-day return policy for unused items</li>
                  <li>Items must be in original packaging</li>
                  <li>Free returns on all domestic orders</li>
                  <li>Exchange for different size/color available</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger data-testid="accordion-care">Care Instructions</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Machine wash cold with like colors</li>
                  <li>Do not bleach</li>
                  <li>Tumble dry low</li>
                  <li>Warm iron if needed</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16" data-testid="reviews-section">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        
        <div className="space-y-6">
          {displayedReviews.map(review => (
            <div 
              key={review.id} 
              className="border-b pb-6"
              data-testid={`review-${review.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < review.rating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                {review.verified && (
                  <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                )}
              </div>
              <h4 className="font-semibold">{review.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {review.author} - {review.date}
              </p>
            </div>
          ))}
        </div>

        {mockReviews.length > 2 && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowAllReviews(!showAllReviews)}
            data-testid="toggle-reviews"
          >
            {showAllReviews ? 'Show Less' : `Show All ${mockReviews.length} Reviews`}
          </Button>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16" data-testid="related-products">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
