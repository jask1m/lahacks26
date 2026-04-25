'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Truck, CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Badge } from '@/demo-site/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/demo-site/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/demo-site/components/ui/collapsible'
import { useStore } from '@/demo-site/lib/store-context'
import { mockOrders } from '@/demo-site/lib/mock-data'
import { cn } from '@/demo-site/lib/utils'

const statusConfig = {
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'bg-yellow-100 text-yellow-800',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-blue-100 text-blue-800',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
  },
}

export default function OrdersPage() {
  const { showToast } = useStore()
  const [expandedOrders, setExpandedOrders] = useState<string[]>([])

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleReorder = () => {
    showToast('Items added to cart', 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="orders-title">Order History</h2>
        <p className="text-muted-foreground">View and manage your past orders</p>
      </div>

      {mockOrders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg" data-testid="no-orders">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-4">
            When you place an order, it will appear here.
          </p>
          <Button asChild>
            <Link href="/demo-store/shop">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden" data-testid="account-orders-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => {
                const status = statusConfig[order.status]
                const isExpanded = expandedOrders.includes(order.id)
                const StatusIcon = status.icon

                return (
                  <Collapsible
                    key={order.id}
                    open={isExpanded}
                    onOpenChange={() => toggleOrder(order.id)}
                    asChild
                  >
                    <>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        data-testid={`order-row-${order.id}`}
                      >
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-2 font-medium hover:underline">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              {order.id}
                            </button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn("gap-1", status.color)}
                            data-testid={`order-status-${order.id}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReorder(order.id)
                              }}
                              data-testid="reorder-btn"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reorder
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow data-testid={`order-details-${order.id}`}>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="py-4 space-y-4">
                              <h4 className="font-medium">Order Items</h4>
                              <div className="space-y-2">
                                {order.items.map((item, index) => (
                                  <div 
                                    key={index}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>
                                      {item.name} x {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              {order.trackingNumber && (
                                <div className="pt-4 border-t">
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Tracking Number: </span>
                                    <span className="font-mono" data-testid={`tracking-${order.id}`}>
                                      {order.trackingNumber}
                                    </span>
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/support?order=${order.id}`}>
                                    Get Help
                                  </Link>
                                </Button>
                                {order.status === 'delivered' && (
                                  <Button variant="outline" size="sm">
                                    Write Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
