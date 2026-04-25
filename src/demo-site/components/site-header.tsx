'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, User, Heart, Menu, X, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/demo-site/components/ui/button'
import { useStore } from '@/demo-site/lib/store-context'
import { cn } from '@/demo-site/lib/utils'

const navLinks = [
  { href: '/demo-store/shop', label: 'Shop', testId: 'nav-shop' },
  { href: '/demo-store/support', label: 'Support', testId: 'nav-support' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { cartCount, wishlist } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link 
          href="/demo-store" 
          className="flex items-center gap-2 text-xl font-semibold"
          data-testid="nav-home"
        >
          <span className="text-primary">STORE</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              data-testid={link.testId}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex"
            data-testid="nav-search"
            asChild
          >
            <Link href="/demo-store/shop">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            data-testid="nav-wishlist"
            className="relative"
          >
            <Link href="/demo-store/wishlist">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            data-testid="nav-cart"
            className="relative"
          >
            <Link href="/demo-store/cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            data-testid="nav-account"
          >
            <Link href="/demo-store/account">
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>

          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`mobile-${link.testId}`}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary py-2",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
