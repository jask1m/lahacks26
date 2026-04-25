'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Input } from '@/demo-site/components/ui/input'
import { Checkbox } from '@/demo-site/components/ui/checkbox'
import { Slider } from '@/demo-site/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/demo-site/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/demo-site/components/ui/sheet'
import { Skeleton } from '@/demo-site/components/ui/skeleton'
import { ProductCard } from '@/demo-site/components/product-card'
import { products, categories } from '@/demo-site/lib/mock-data'
import { cn } from '@/demo-site/lib/utils'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

const ITEMS_PER_PAGE = 8

interface FilterSidebarProps {
  selectedCategories: string[]
  onToggleCategory: (categoryId: string) => void
  priceRange: number[]
  onPriceRangeChange: (value: number[]) => void
  minRating: number
  onMinRatingChange: (rating: number) => void
  inStockOnly: boolean
  onInStockOnlyChange: (value: boolean) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

function FilterSidebar({
  selectedCategories,
  onToggleCategory,
  priceRange,
  onPriceRangeChange,
  minRating,
  onMinRatingChange,
  inStockOnly,
  onInStockOnlyChange,
  hasActiveFilters,
  onClearFilters,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <label
              key={category.id}
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`filter-category-${category.id}`}
            >
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => onToggleCategory(category.id)}
              />
              <span className="text-sm">{category.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">({category.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2" data-testid="filter-price">
          <Slider
            value={priceRange}
            onValueChange={onPriceRangeChange}
            max={500}
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-3">Minimum Rating</h3>
        <div className="space-y-2" data-testid="filter-rating">
          {[4, 3, 2, 1].map(rating => (
            <label
              key={rating}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={minRating === rating}
                onCheckedChange={(checked) => {
                  onMinRatingChange(checked ? rating : 0)
                }}
              />
              <span className="text-sm">{rating}+ stars</span>
            </label>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label 
          className="flex items-center gap-2 cursor-pointer"
          data-testid="filter-in-stock"
        >
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(checked) => {
              onInStockOnlyChange(!!checked)
            }}
          />
          <span className="text-sm font-medium">In Stock Only</span>
        </label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onClearFilters}
          data-testid="clear-filters"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  )
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  )
  const [priceRange, setPriceRange] = useState([0, 500])
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category))
    }

    // Price filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Rating filter
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating)
    }

    // Stock filter
    if (inStockOnly) {
      result = result.filter(p => p.inStock)
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return result
  }, [searchQuery, selectedCategories, priceRange, minRating, inStockOnly, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setPriceRange([0, 500])
    setMinRating(0)
    setInStockOnly(false)
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || 
    priceRange[0] > 0 || priceRange[1] < 500 || minRating > 0 || inStockOnly

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="shop-title">Shop All Products</h1>
        <p className="text-muted-foreground">
          Discover our collection of premium products
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
            data-testid="search-input"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
              data-testid="search-clear"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden" data-testid="mobile-filters-toggle">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar
                  selectedCategories={selectedCategories}
                  onToggleCategory={handleCategoryToggle}
                  priceRange={priceRange}
                  onPriceRangeChange={(value) => {
                    setPriceRange(value)
                    setCurrentPage(1)
                  }}
                  minRating={minRating}
                  onMinRatingChange={(rating) => {
                    setMinRating(rating)
                    setCurrentPage(1)
                  }}
                  inStockOnly={inStockOnly}
                  onInStockOnlyChange={(value) => {
                    setInStockOnly(value)
                    setCurrentPage(1)
                  }}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort Select */}
          <Select 
            value={sortBy} 
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]" data-testid="sort-select">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured" data-testid="sort-featured">Featured</SelectItem>
              <SelectItem value="price-asc" data-testid="sort-price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc" data-testid="sort-price-desc">Price: High to Low</SelectItem>
              <SelectItem value="newest" data-testid="sort-newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar
            selectedCategories={selectedCategories}
            onToggleCategory={handleCategoryToggle}
            priceRange={priceRange}
            onPriceRangeChange={(value) => {
              setPriceRange(value)
              setCurrentPage(1)
            }}
            minRating={minRating}
            onMinRatingChange={(rating) => {
              setMinRating(rating)
              setCurrentPage(1)
            }}
            inStockOnly={inStockOnly}
            onInStockOnlyChange={(value) => {
              setInStockOnly(value)
              setCurrentPage(1)
            }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground" data-testid="results-count">
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              `Showing ${paginatedProducts.length} of ${filteredProducts.length} products`
            )}
          </div>

          {isLoading ? (
            // Loading Skeleton
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="loading-skeleton">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            // Empty State
            <div 
              className="text-center py-16"
              data-testid="empty-state"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2" data-testid="no-results-title">
                No products match your filters
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={clearFilters} data-testid="empty-clear-filters">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div 
                className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                data-testid="products-grid"
              >
                {paginatedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2" data-testid="pagination">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    data-testid="pagination-prev"
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                      data-testid={`pagination-page-${i + 1}`}
                      className={cn(
                        "w-10",
                        totalPages > 5 && i > 0 && i < totalPages - 1 && 
                        Math.abs(currentPage - (i + 1)) > 1 && "hidden sm:flex"
                      )}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    data-testid="pagination-next"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
