'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode, useState } from "react"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log('[AuthGuard] Session status:', status, 'Session:', session)

    if (status === "unauthenticated") {
      console.log('[AuthGuard] 用户未认证，重定向到登录页面')
      setIsRedirecting(true)
      // 使用 replace 而不是 push，避免用户返回
      router.replace("/auth/signin")
    }
  }, [status, session, router])

  // 显示加载状态
  if (status === "loading" || isRedirecting) {
    return (
      fallback || (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-muted-foreground mt-2">
              {isRedirecting ? '正在跳转到登录页面...' : '加载中...'}
            </div>
          </div>
        </div>
      )
    )
  }

  // 如果未认证，不显示任何内容
  if (status === "unauthenticated") {
    console.log('[AuthGuard] 阻止未认证用户访问')
    return null
  }

  // 如果已认证但没有session，也不显示内容
  if (status === "authenticated" && !session) {
    console.log('[AuthGuard] 认证状态异常，重定向到登录页面')
    router.push("/auth/signin")
    return null
  }

  console.log('[AuthGuard] 用户已认证，显示内容')
  return <>{children}</>
}
