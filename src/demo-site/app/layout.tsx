import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { StoreProvider } from '@/demo-site/lib/store-context'
import { SiteHeader } from '@/demo-site/components/site-header'
import { SiteFooter } from '@/demo-site/components/site-footer'
import { StoreToast } from '@/demo-site/components/store-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'STORE - Premium Ecommerce Demo',
  description: 'A modern ecommerce demo website optimized for QA testing with deterministic UI states and stable selectors.',
  keywords: ['ecommerce', 'demo', 'QA testing', 'Playwright'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <StoreProvider>
          <SiteHeader />
          <main className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <StoreToast />
        </StoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
