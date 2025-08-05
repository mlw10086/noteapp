'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: number
  email: string
  name: string
  role: string
  lastLogin?: string
}

interface AdminAuthContextType {
  admin: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const router = useRouter()

  // 缓存时间：5分钟
  const CACHE_DURATION = 5 * 60 * 1000

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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAdmin(data.admin)
          setLastCheckTime(Date.now())
          return true
        }
      }
      return false
    } catch (error) {
      console.error('管理员登录失败:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('管理员退出登录失败:', error)
    } finally {
      setAdmin(null)
      setLastCheckTime(0)
      router.push('/admin/login')
    }
  }

  const refreshAuth = async () => {
    await checkAdminAuth(true)
  }

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
    refreshAuth,
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
