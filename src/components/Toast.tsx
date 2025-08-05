'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'success' | 'error' | 'default'
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100'
      default:
        return 'border bg-background text-foreground'
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300',
        getVariantStyles(),
        isVisible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {description && (
              <>
                <span className="text-sm opacity-60">•</span>
                <span className="text-sm opacity-90">{description}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Toast 容器组件
interface ToastContainerProps {
  toasts: Array<{
    id: string
    title: string
    description?: string
    variant?: 'success' | 'error' | 'default'
    duration?: number
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              zIndex: 50 - index
            }}
          >
            <Toast
              {...toast}
              onClose={onRemove}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Toast Hook
let toastId = 0

interface ToastOptions {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'default'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    title: string
    description?: string
    variant?: 'success' | 'error' | 'default'
    duration?: number
  }>>([])

  const addToast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastId}`
    setToasts(prev => [...prev, { id, ...options }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const toast = useCallback({
    success: (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: 'success', duration }),
    error: (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: 'error', duration }),
    default: (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: 'default', duration })
  }, [addToast])

  return {
    toasts,
    toast,
    removeToast
  }
}
