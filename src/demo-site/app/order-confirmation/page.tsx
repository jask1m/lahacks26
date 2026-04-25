import Link from 'next/link'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'

export default function OrderConfirmationPage() {
  // Generate a deterministic order number for QA testing
  const orderNumber = 'ORD-2024-005'
  const estimatedDelivery = 'January 25 - January 30, 2024'

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
          data-testid="order-success-icon"
        >
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        {/* Success Message */}
        <div data-testid="order-success-banner">
          <h1 className="text-3xl font-bold mb-2" data-testid="order-success-title">
            Order placed successfully
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase! Your order has been confirmed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="border rounded-lg p-6 mb-8 text-left" data-testid="order-details">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Number</h3>
              <p className="font-semibold" data-testid="order-number">{orderNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Estimated Delivery</h3>
              <p className="font-semibold" data-testid="estimated-delivery">{estimatedDelivery}</p>
            </div>
          </div>

          <hr className="my-6" />

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">Confirmation Email Sent</h4>
                <p className="text-sm text-muted-foreground">
                  We have sent a confirmation email with your order details and tracking information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">Order Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Your order is being prepared for shipment. You will receive tracking information once it ships.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="border rounded-lg p-6 mb-8 text-left bg-muted/30" data-testid="whats-next">
          <h3 className="font-semibold mb-4">What happens next?</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                1
              </span>
              <span>Your order will be processed within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                2
              </span>
              <span>You will receive shipping confirmation with tracking number</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                3
              </span>
              <span>Track your package and get delivery updates</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" data-testid="view-order-btn">
            <Link href="/demo-store/account/orders">
              View Order Status
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild data-testid="continue-shopping-btn">
            <Link href="/demo-store/shop">Continue Shopping</Link>
          </Button>
        </div>

        {/* Support Link */}
        <p className="mt-8 text-sm text-muted-foreground">
          Have questions about your order?{' '}
          <Link href="/demo-store/support" className="text-primary hover:underline" data-testid="contact-support-link">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  )
}
