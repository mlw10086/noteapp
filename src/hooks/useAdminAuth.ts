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
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
      } else {
        setAdmin(null)
      }
    } catch (error) {
      console.error('检查管理员认证失败:', error)
      setAdmin(null)
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
      router.push('/admin/login')
    } catch (error) {
      console.error('管理员退出登录失败:', error)
    }
  }

  return {
    admin,
    isLoading,
    logout,
  }
}
