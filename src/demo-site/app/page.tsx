import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { ProductCard } from '@/demo-site/components/product-card'
import { products, categories, promoBanners } from '@/demo-site/lib/mock-data'

const featuredProducts = products.filter(p => p.featured).slice(0, 4)

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $75',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure checkout',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-muted" data-testid="hero-section">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 
                className="text-4xl lg:text-6xl font-bold tracking-tight text-balance"
                data-testid="hero-title"
              >
                Discover Premium Quality Products
              </h1>
              <p 
                className="text-lg text-muted-foreground max-w-md"
                data-testid="hero-subtitle"
              >
                Explore our curated collection of premium products designed for modern living.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild data-testid="hero-cta-primary">
                  <Link href="/demo-store/shop">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="hero-cta-secondary">
                  <Link href="/demo-store/shop?featured=true">
                    View Featured
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-[4/3]">
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
                alt="Hero image showing premium products"
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4"
                data-testid={`feature-${index}`}
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16" data-testid="categories-section">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" data-testid="categories-title">
              Shop by Category
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/demo-store/shop" data-testid="categories-view-all">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.id}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                data-testid={`category-${category.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <Image
                  src={`https://images.unsplash.com/photo-${
                    category.id === 'clothing' ? '1489987707025-afc232f7ea0f' :
                    category.id === 'shoes' ? '1542291026-7eec264c27ff' :
                    category.id === 'accessories' ? '1523170335258-f5ed11844a49' :
                    category.id === 'electronics' ? '1468495244123-6c6c332eeece' :
                    '1616486338812-3dadae4b4ace'
                  }?w=400&h=400&fit=crop`}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <p className="text-sm text-white/80">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30" data-testid="featured-products-section">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" data-testid="featured-title">
              Featured Products
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/demo-store/shop?featured=true" data-testid="featured-view-all">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="py-16" data-testid="promo-section">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {promoBanners.map((banner) => (
              <div 
                key={banner.id}
                className="relative overflow-hidden rounded-lg bg-primary p-8 text-primary-foreground"
                data-testid={`promo-banner-${banner.id}`}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                  <p className="text-primary-foreground/80 mb-4">{banner.subtitle}</p>
                  <Button variant="secondary" asChild>
                    <Link href={banner.href} data-testid={`promo-cta-${banner.id}`}>
                      {banner.cta}
                    </Link>
                  </Button>
                </div>
                <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-muted" data-testid="newsletter-section">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribe to our newsletter for exclusive offers and updates.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" data-testid="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border bg-background"
              data-testid="newsletter-input"
            />
            <Button type="submit" data-testid="newsletter-submit">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
