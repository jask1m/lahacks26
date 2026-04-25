'use client'

import { useStore } from '@/demo-site/lib/store-context'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/demo-site/lib/utils'

export function StoreToast() {
  const { toast } = useStore()

  if (!toast) return null

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all",
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'
      )}
      data-testid="toast-notification"
      role="alert"
    >
      {toast.type === 'success' ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  )
}
