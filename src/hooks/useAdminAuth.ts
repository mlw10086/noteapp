'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: number
  email: string
  name: string
  role: string
}

interface UseAdminAuthReturn {
  admin: AdminUser | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const router = useRouter()

  // 缓存时间：5分钟
  const CACHE_DURATION = 5 * 60 * 1000

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async (forceRefresh = false) => {
    const now = Date.now()

    // 如果不是强制刷新且缓存未过期，跳过检查
    if (!forceRefresh && admin && (now - lastCheckTime) < CACHE_DURATION) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/me', {
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
        setLastCheckTime(now)
      } else {
        setAdmin(null)
        setLastCheckTime(0)
      }
    } catch (error) {
      console.error('检查管理员认证失败:', error)
      setAdmin(null)
      setLastCheckTime(0)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setAdmin(null)
      setLastCheckTime(0)
      router.push('/admin/login')
    } catch (error) {
      console.error('管理员退出登录失败:', error)
    }
  }

  const refreshAuth = async () => {
    await checkAdminAuth(true)
  }

  return {
    admin,
    isLoading,
    logout,
    refreshAuth,
  }
}
