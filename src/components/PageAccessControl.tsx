'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStatus } from '@/hooks/useUserStatus'
import { BannedUserAlert } from '@/components/BannedUserAlert'

interface PageAccessControlProps {
  children: React.ReactNode
  allowedForBanned?: boolean // 是否允许被封禁用户访问
  showBannedAlert?: boolean // 是否显示封禁提示
}

export function PageAccessControl({ 
  children, 
  allowedForBanned = false,
  showBannedAlert = true
}: PageAccessControlProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isBanned, bannedMessage, bannedUntil, bannedReason, loading } = useUserStatus()

  useEffect(() => {
    // 如果正在加载，不做任何操作
    if (loading) return

    // 如果用户被封禁且当前页面不允许被封禁用户访问
    if (isBanned && !allowedForBanned) {
      // 如果不在首页，重定向到首页
      if (pathname !== '/') {
        router.push('/')
        return
      }
    }
  }, [isBanned, loading, allowedForBanned, pathname, router])

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 如果用户被封禁
  if (isBanned) {
    // 如果不允许被封禁用户访问且不在首页，不渲染内容（等待重定向）
    if (!allowedForBanned && pathname !== '/') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    // 如果在首页，显示全屏封禁提示
    if (pathname === '/' && showBannedAlert && bannedMessage) {
      return (
        <BannedUserAlert
          bannedMessage={bannedMessage}
          bannedUntil={bannedUntil}
          bannedReason={bannedReason}
          variant="card"
        />
      )
    }

    // 如果在其他允许访问的页面，显示普通封禁提示
    if (allowedForBanned && showBannedAlert && bannedMessage) {
      return (
        <div>
          <BannedUserAlert
            bannedMessage={bannedMessage}
            bannedUntil={bannedUntil}
            bannedReason={bannedReason}
            variant="alert"
          />
          {children}
        </div>
      )
    }
  }

  return <>{children}</>
}
