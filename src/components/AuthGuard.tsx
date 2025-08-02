'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode, useState, useRef } from "react"
import { PageLoading } from "@/components/ui/loading"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  skipRedirect?: boolean // 新增：跳过自动重定向
}

export function AuthGuard({ children, fallback, skipRedirect = false }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasRedirected = useRef(false) // 防止重复重定向

  useEffect(() => {
    // 如果跳过重定向或已经重定向过，则不再处理
    if (skipRedirect || hasRedirected.current) {
      return
    }

    if (status === "unauthenticated") {
      console.log('[AuthGuard] 用户未认证，重定向到登录页面')
      hasRedirected.current = true
      setIsRedirecting(true)
      // 使用 replace 而不是 push，避免用户返回
      router.replace("/auth/signin")
    }
  }, [status, router, skipRedirect])

  // 显示加载状态
  if (status === "loading" || isRedirecting) {
    return (
      fallback || (
        <PageLoading
          message={isRedirecting ? '正在跳转到登录页面...' : '正在验证身份...'}
        />
      )
    )
  }

  // 如果未认证，根据 skipRedirect 决定显示内容
  if (status === "unauthenticated") {
    return skipRedirect ? (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground">请先登录</div>
          </div>
        </div>
      )
    ) : null
  }

  // 如果已认证但没有session，也不显示内容
  if (status === "authenticated" && !session) {
    console.log('[AuthGuard] 认证状态异常，重定向到登录页面')
    if (!hasRedirected.current) {
      hasRedirected.current = true
      router.replace("/auth/signin")
    }
    return null
  }

  console.log('[AuthGuard] 用户已认证，显示内容')
  return <>{children}</>
}
