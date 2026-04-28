'use client'

import { useState } from 'react'
import { Mail, Phone, MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Input } from '@/demo-site/components/ui/input'
import { Textarea } from '@/demo-site/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/demo-site/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/demo-site/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/demo-site/components/ui/card'
import { Alert, AlertDescription } from '@/demo-site/components/ui/alert'
import { Field, FieldGroup, FieldLabel, FieldMessage } from '@/demo-site/components/ui/field'
import { faqs } from '@/demo-site/lib/mock-data'
import { cn } from '@/demo-site/lib/utils'

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!contactForm.name.trim()) errors.name = 'Name is required'
    if (!contactForm.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(contactForm.email)) errors.email = 'Invalid email format'
    if (!contactForm.subject) errors.subject = 'Please select a subject'
    if (!contactForm.message.trim()) errors.message = 'Message is required'
    else if (contactForm.message.trim().length < 10) errors.message = 'Message must be at least 10 characters'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // Simulate form submission
    setTimeout(() => {
      // Success 80% of the time for QA testing
      if (Math.random() > 0.2) {
        setFormStatus('success')
        setContactForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setFormStatus('error')
      }
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2" data-testid="support-title">
          Help & Support
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have a question or need assistance? We are here to help. Browse our FAQ or contact us directly.
        </p>
      </div>

      {/* Quick Contact Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card data-testid="contact-email">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Email Us</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get a response within 24 hours
            </p>
            <a 
              href="mailto:support@store.com" 
              className="text-primary hover:underline"
              data-testid="email-link"
            >
              support@store.com
            </a>
          </CardContent>
        </Card>

        <Card data-testid="contact-phone">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Call Us</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mon-Fri 9am-6pm EST
            </p>
            <a 
              href="tel:+15551234567" 
              className="text-primary hover:underline"
              data-testid="phone-link"
            >
              +1 (555) 123-4567
            </a>
          </CardContent>
        </Card>

        <Card data-testid="contact-chat">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with our support team
            </p>
            <Button variant="outline" size="sm" data-testid="chat-btn">
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* FAQ Section */}
        <section id="faq" data-testid="faq-section">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                data-testid={`faq-item-${index}`}
              >
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Form */}
        <section id="contact" data-testid="contact-section">
          <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
          
          {formStatus === 'success' && (
            <Alert className="mb-6 border-green-200 bg-green-50" data-testid="contact-success">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Message sent successfully! We will get back to you soon.
              </AlertDescription>
            </Alert>
          )}

          {formStatus === 'error' && (
            <Alert variant="destructive" className="mb-6" data-testid="contact-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to send message. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                  className={cn(formErrors.name && "border-destructive")}
                  data-testid="contact-name"
                />
                {formErrors.name && (
                  <FieldMessage className="text-destructive">{formErrors.name}</FieldMessage>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                  className={cn(formErrors.email && "border-destructive")}
                  data-testid="contact-email-input"
                />
                {formErrors.email && (
                  <FieldMessage className="text-destructive">{formErrors.email}</FieldMessage>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <Select
                  value={contactForm.subject}
                  onValueChange={(value) => setContactForm(f => ({ ...f, subject: value }))}
                >
                  <SelectTrigger 
                    className={cn(formErrors.subject && "border-destructive")}
                    data-testid="contact-subject"
                  >
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order Issue</SelectItem>
                    <SelectItem value="shipping">Shipping Question</SelectItem>
                    <SelectItem value="returns">Returns & Refunds</SelectItem>
                    <SelectItem value="product">Product Inquiry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.subject && (
                  <FieldMessage className="text-destructive">{formErrors.subject}</FieldMessage>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="message">Message</FieldLabel>
                <Textarea
                  id="message"
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                  className={cn(formErrors.message && "border-destructive")}
                  placeholder="Describe your issue or question..."
                  data-testid="contact-message"
                />
                {formErrors.message && (
                  <FieldMessage className="text-destructive">{formErrors.message}</FieldMessage>
                )}
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full" data-testid="support-contact-submit">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </form>
        </section>
      </div>

      {/* Policies Section */}
      <section className="mt-16" id="returns" data-testid="policies-section">
        <h2 className="text-2xl font-bold mb-6">Policies</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card data-testid="shipping-policy">
            <CardHeader>
              <CardTitle id="shipping">Shipping Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2">
              <p>We offer several shipping options to meet your needs:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Standard Shipping (5-7 business days): $9.99</li>
                <li>Express Shipping (2-3 business days): $19.99</li>
                <li>Free Standard Shipping on orders over $75</li>
                <li>International shipping available to 50+ countries</li>
              </ul>
              <p className="pt-2">
                Orders are processed within 1-2 business days. You will receive tracking 
                information once your order ships.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="returns-policy">
            <CardHeader>
              <CardTitle>Returns & Exchanges</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2">
              <p>We want you to be completely satisfied with your purchase:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>30-day return policy for unused items</li>
                <li>Items must be in original packaging with tags</li>
                <li>Free returns on all domestic orders</li>
                <li>Exchanges available for different sizes/colors</li>
              </ul>
              <p className="pt-2">
                To initiate a return, visit your order history or contact our support team.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Links */}
      <section className="mt-16 text-center" data-testid="social-section">
        <h2 className="text-xl font-semibold mb-4">Connect With Us</h2>
        <div className="flex justify-center gap-4">
          <a 
            href="https://twitter.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="social-twitter-link"
          >
            Twitter
          </a>
          <a 
            href="https://instagram.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="social-instagram-link"
          >
            Instagram
          </a>
          <a 
            href="https://facebook.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="social-facebook-link"
          >
            Facebook
          </a>
          <a 
            href="mailto:support@store.com"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="mailto-link"
          >
            Email
          </a>
        </div>
      </section>
    </div>
  )
}
