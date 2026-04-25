'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, Settings, Heart, LogOut } from 'lucide-react'
import { cn } from '@/demo-site/lib/utils'

const accountNavItems = [
  { href: '/demo-store/account', label: 'Profile', icon: User, exact: true },
  { href: '/demo-store/account/orders', label: 'Orders', icon: Package },
  { href: '/demo-store/account/settings', label: 'Settings', icon: Settings },
  { href: '/demo-store/wishlist', label: 'Wishlist', icon: Heart },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" data-testid="account-title">My Account</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="space-y-1" data-testid="account-nav">
            {accountNavItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid={`account-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            
            <button
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full"
              data-testid="account-nav-logout"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
