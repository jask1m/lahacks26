'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, Wallet, Building2, Check, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Input } from '@/demo-site/components/ui/input'
import { Label } from '@/demo-site/components/ui/label'
import { Separator } from '@/demo-site/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/demo-site/components/ui/tabs'
import { Checkbox } from '@/demo-site/components/ui/checkbox'
import { Alert, AlertDescription } from '@/demo-site/components/ui/alert'
import { Field, FieldGroup, FieldLabel, FieldMessage } from '@/demo-site/components/ui/field'
import { useStore } from '@/demo-site/lib/store-context'
import { cn } from '@/demo-site/lib/utils'

type CheckoutStep = 'shipping' | 'payment' | 'review'

interface FormErrors {
  [key: string]: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, promoDiscount, clearCart } = useStore()
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping')
  const [isLoading, setIsLoading] = useState(false)
  const [orderError, setOrderError] = useState(false)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Form state
  const [shippingForm, setShippingForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  })

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardName: '',
  })

  const subtotal = cartTotal
  const shipping = cartTotal >= 75 ? 0 : 9.99
  const discount = subtotal * promoDiscount
  const tax = (subtotal - discount) * 0.08
  const total = subtotal - discount + shipping + tax

  const steps = [
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
  ]

  const validateShipping = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!shippingForm.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(shippingForm.email)) newErrors.email = 'Invalid email format'
    
    if (!shippingForm.firstName) newErrors.firstName = 'First name is required'
    if (!shippingForm.lastName) newErrors.lastName = 'Last name is required'
    if (!shippingForm.address) newErrors.address = 'Address is required'
    if (!shippingForm.city) newErrors.city = 'City is required'
    if (!shippingForm.state) newErrors.state = 'State is required'
    if (!shippingForm.zip) newErrors.zip = 'ZIP code is required'
    else if (!/^\d{5}(-\d{4})?$/.test(shippingForm.zip)) newErrors.zip = 'Invalid ZIP code'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePayment = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (paymentMethod === 'card') {
      if (!paymentForm.cardNumber) newErrors.cardNumber = 'Card number is required'
      else if (!/^\d{16}$/.test(paymentForm.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Invalid card number'
      }
      
      if (!paymentForm.expiry) newErrors.expiry = 'Expiry date is required'
      else if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiry)) {
        newErrors.expiry = 'Use MM/YY format'
      }
      
      if (!paymentForm.cvc) newErrors.cvc = 'CVC is required'
      else if (!/^\d{3,4}$/.test(paymentForm.cvc)) newErrors.cvc = 'Invalid CVC'
      
      if (!paymentForm.cardName) newErrors.cardName = 'Name on card is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    setOrderError(false)
    
    if (currentStep === 'shipping') {
      if (validateShipping()) {
        setCurrentStep('payment')
      }
    } else if (currentStep === 'payment') {
      if (validatePayment()) {
        setCurrentStep('review')
      }
    }
  }

  const handlePlaceOrder = async () => {
    setIsLoading(true)
    setOrderError(false)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (simulateFailure) {
      setIsLoading(false)
      setOrderError(true)
      return
    }
    
    clearCart()
    router.push('/demo-store/order-confirmation')
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center" data-testid="checkout-empty">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add items to your cart before checkout.</p>
        <Button asChild>
          <Link href="/demo-store/shop">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/demo-store/cart" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          data-testid="back-to-cart"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-2xl font-bold" data-testid="checkout-title">Checkout</h1>
        <div className="w-24" /> {/* Spacer */}
      </div>

      {/* Progress Steps */}
      <div className="mb-8" data-testid="checkout-steps">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  currentStep === step.id 
                    ? "bg-primary text-primary-foreground"
                    : steps.findIndex(s => s.id === currentStep) > index
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                )}
                data-testid={`step-${step.id}`}
              >
                {steps.findIndex(s => s.id === currentStep) > index ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium hidden sm:inline",
                currentStep === step.id ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-16 sm:w-24 h-0.5 mx-4",
                  steps.findIndex(s => s.id === currentStep) > index
                    ? "bg-green-600"
                    : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {/* Shipping Form */}
          {currentStep === 'shipping' && (
            <div className="border rounded-lg p-6" data-testid="checkout-shipping-form">
              <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
              
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm(f => ({ ...f, email: e.target.value }))}
                    className={cn(errors.email && "border-destructive")}
                    data-testid="shipping-email"
                  />
                  {errors.email && <FieldMessage className="text-destructive">{errors.email}</FieldMessage>}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                    <Input
                      id="firstName"
                      value={shippingForm.firstName}
                      onChange={(e) => setShippingForm(f => ({ ...f, firstName: e.target.value }))}
                      className={cn(errors.firstName && "border-destructive")}
                      data-testid="shipping-first-name"
                    />
                    {errors.firstName && <FieldMessage className="text-destructive">{errors.firstName}</FieldMessage>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                    <Input
                      id="lastName"
                      value={shippingForm.lastName}
                      onChange={(e) => setShippingForm(f => ({ ...f, lastName: e.target.value }))}
                      className={cn(errors.lastName && "border-destructive")}
                      data-testid="shipping-last-name"
                    />
                    {errors.lastName && <FieldMessage className="text-destructive">{errors.lastName}</FieldMessage>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Input
                    id="address"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm(f => ({ ...f, address: e.target.value }))}
                    className={cn(errors.address && "border-destructive")}
                    data-testid="shipping-address"
                  />
                  {errors.address && <FieldMessage className="text-destructive">{errors.address}</FieldMessage>}
                </Field>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field className="col-span-2">
                    <FieldLabel htmlFor="city">City</FieldLabel>
                    <Input
                      id="city"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm(f => ({ ...f, city: e.target.value }))}
                      className={cn(errors.city && "border-destructive")}
                      data-testid="shipping-city"
                    />
                    {errors.city && <FieldMessage className="text-destructive">{errors.city}</FieldMessage>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="state">State</FieldLabel>
                    <Input
                      id="state"
                      value={shippingForm.state}
                      onChange={(e) => setShippingForm(f => ({ ...f, state: e.target.value }))}
                      className={cn(errors.state && "border-destructive")}
                      data-testid="shipping-state"
                    />
                    {errors.state && <FieldMessage className="text-destructive">{errors.state}</FieldMessage>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="zip">ZIP Code</FieldLabel>
                    <Input
                      id="zip"
                      value={shippingForm.zip}
                      onChange={(e) => setShippingForm(f => ({ ...f, zip: e.target.value }))}
                      className={cn(errors.zip && "border-destructive")}
                      data-testid="shipping-zip"
                    />
                    {errors.zip && <FieldMessage className="text-destructive">{errors.zip}</FieldMessage>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm(f => ({ ...f, phone: e.target.value }))}
                    data-testid="shipping-phone"
                  />
                </Field>
              </FieldGroup>

              <Button 
                className="w-full mt-6" 
                onClick={handleNextStep}
                data-testid="continue-to-payment"
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* Payment Form */}
          {currentStep === 'payment' && (
            <div className="border rounded-lg p-6" data-testid="checkout-payment-form">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                <TabsList className="grid w-full grid-cols-3 mb-6" data-testid="payment-tabs">
                  <TabsTrigger value="card" data-testid="checkout-payment-tab-card">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="paypal" data-testid="checkout-payment-tab-paypal">
                    <Wallet className="h-4 w-4 mr-2" />
                    PayPal
                  </TabsTrigger>
                  <TabsTrigger value="bank" data-testid="checkout-payment-tab-bank">
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="card">
                  <FieldGroup className="space-y-4">
                    <Field>
                      <FieldLabel htmlFor="cardNumber">Card Number</FieldLabel>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm(f => ({ ...f, cardNumber: e.target.value }))}
                        className={cn(errors.cardNumber && "border-destructive")}
                        data-testid="payment-card-number"
                      />
                      {errors.cardNumber && <FieldMessage className="text-destructive">{errors.cardNumber}</FieldMessage>}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="expiry">Expiry Date</FieldLabel>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={paymentForm.expiry}
                          onChange={(e) => setPaymentForm(f => ({ ...f, expiry: e.target.value }))}
                          className={cn(errors.expiry && "border-destructive")}
                          data-testid="payment-expiry"
                        />
                        {errors.expiry && <FieldMessage className="text-destructive">{errors.expiry}</FieldMessage>}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="cvc">CVC</FieldLabel>
                        <Input
                          id="cvc"
                          placeholder="123"
                          value={paymentForm.cvc}
                          onChange={(e) => setPaymentForm(f => ({ ...f, cvc: e.target.value }))}
                          className={cn(errors.cvc && "border-destructive")}
                          data-testid="payment-cvc"
                        />
                        {errors.cvc && <FieldMessage className="text-destructive">{errors.cvc}</FieldMessage>}
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="cardName">Name on Card</FieldLabel>
                      <Input
                        id="cardName"
                        value={paymentForm.cardName}
                        onChange={(e) => setPaymentForm(f => ({ ...f, cardName: e.target.value }))}
                        className={cn(errors.cardName && "border-destructive")}
                        data-testid="payment-card-name"
                      />
                      {errors.cardName && <FieldMessage className="text-destructive">{errors.cardName}</FieldMessage>}
                    </Field>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="paypal">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You will be redirected to PayPal to complete your purchase.
                    </p>
                    <div className="flex justify-center">
                      <div className="bg-blue-600 text-white px-6 py-2 rounded font-bold">
                        PayPal
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bank">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Bank transfer instructions will be provided after order placement.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('shipping')}
                  data-testid="back-to-shipping"
                >
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleNextStep}
                  data-testid="continue-to-review"
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          )}

          {/* Review */}
          {currentStep === 'review' && (
            <div className="space-y-6" data-testid="checkout-review">
              {/* Order Error */}
              {orderError && (
                <Alert variant="destructive" data-testid="order-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Payment failed. Please try again or use a different payment method.
                  </AlertDescription>
                </Alert>
              )}

              {/* Shipping Summary */}
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">Shipping Address</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentStep('shipping')}
                    data-testid="edit-shipping"
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {shippingForm.firstName} {shippingForm.lastName}<br />
                  {shippingForm.address}<br />
                  {shippingForm.city}, {shippingForm.state} {shippingForm.zip}<br />
                  {shippingForm.email}
                </p>
              </div>

              {/* Payment Summary */}
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">Payment Method</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentStep('payment')}
                    data-testid="edit-payment"
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {paymentMethod === 'card' && `Card ending in ${paymentForm.cardNumber.slice(-4)}`}
                  {paymentMethod === 'paypal' && 'PayPal'}
                  {paymentMethod === 'bank' && 'Bank Transfer'}
                </p>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Order Items ({cart.length})</h3>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} {item.selectedColor && `• ${item.selectedColor}`} {item.selectedSize && `• ${item.selectedSize}`}
                        </p>
                      </div>
                      <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Failure Simulation Toggle (for QA testing) */}
              <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <label className="flex items-center gap-2 cursor-pointer" data-testid="simulate-failure-toggle">
                  <Checkbox
                    checked={simulateFailure}
                    onCheckedChange={(checked) => setSimulateFailure(!!checked)}
                  />
                  <span className="text-sm">Simulate payment failure (for QA testing)</span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('payment')}
                  data-testid="back-to-payment"
                >
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  data-testid="place-order-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order • $${total.toFixed(2)}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              {cart.slice(0, 3).map((item) => (
                <div 
                  key={`${item.product.id}-summary`} 
                  className="flex gap-3"
                >
                  <div className="relative w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {cart.length > 3 && (
                <p className="text-sm text-muted-foreground">+ {cart.length - 3} more items</p>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
