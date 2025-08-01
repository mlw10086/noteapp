'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useAdminAuth } from "@/hooks/useAdminAuth"

interface AdminAuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'super_admin'
}

export function AdminAuthGuard({ children, requiredRole = 'admin' }: AdminAuthGuardProps) {
  const { admin, isLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return // 还在加载中

    if (!admin) {
      // 未登录，跳转到管理员登录页
      router.push('/admin/login')
      return
    }

    if (!['admin', 'super_admin'].includes(admin.role)) {
      // 不是管理员，跳转到登录页
      router.push('/admin/login')
      return
    }

    if (requiredRole === 'super_admin' && admin.role !== 'super_admin') {
      // 需要超级管理员权限但当前用户不是
      router.push('/admin/dashboard?error=insufficient_permissions')
      return
    }
  }, [admin, isLoading, router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">验证管理员身份中...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null // 会被重定向到登录页
  }

  if (!['admin', 'super_admin'].includes(admin.role)) {
    return null // 会被重定向到登录页
  }

  if (requiredRole === 'super_admin' && admin.role !== 'super_admin') {
    return null // 会被重定向到仪表板
  }

  return <>{children}</>
}
