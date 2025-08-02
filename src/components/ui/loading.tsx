'use client'

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  )
}

interface LoadingScreenProps {
  message?: string
  showSpinner?: boolean
  showDots?: boolean
  className?: string
}

export function LoadingScreen({ 
  message = "加载中", 
  showSpinner = true, 
  showDots = false,
  className 
}: LoadingScreenProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center space-y-4 p-8 rounded-lg bg-card border shadow-lg">
        {showSpinner && <LoadingSpinner size="lg" />}
        {showDots && <LoadingDots />}
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = "加载中", className }: PageLoadingProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-40 flex items-center justify-center bg-background",
      className
    )}>
      <div className="flex flex-col items-center space-y-6 animate-fadeIn">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-xl bg-card border shadow-lg">
          <LoadingSpinner size="lg" className="text-primary" />
          <div className="flex flex-col items-center space-y-3">
            <p className="text-lg font-medium text-foreground">{message}</p>
            <LoadingDots />
          </div>
        </div>
      </div>
    </div>
  )
}
