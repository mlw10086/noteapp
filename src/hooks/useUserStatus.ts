'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserStatus {
  status: string
  bannedUntil?: string | null
  bannedReason?: string | null
  bannedIps?: string[]
  lastIpAddress?: string | null
}

interface UseUserStatusReturn {
  userStatus: UserStatus | null
  loading: boolean
  isBanned: boolean
  isUnderObservation: boolean
  bannedMessage: string | null
  refetch: () => Promise<void>
}

export function useUserStatus(): UseUserStatusReturn {
  const { data: session, status: sessionStatus } = useSession()
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserStatus = async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/status')
      if (response.ok) {
        const data = await response.json()
        setUserStatus(data)
      } else {
        console.error('获取用户状态失败')
        setUserStatus(null)
      }
    } catch (error) {
      console.error('获取用户状态错误:', error)
      setUserStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionStatus === 'loading') return
    
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      fetchUserStatus()
    } else {
      setLoading(false)
    }
  }, [session, sessionStatus])

  const isBanned = userStatus?.status === 'banned'
  const isUnderObservation = userStatus?.status === 'under_observation'

  const getBannedMessage = (): string | null => {
    if (!isBanned) return null

    const reason = userStatus?.bannedReason || '违反平台规定'
    
    if (!userStatus?.bannedUntil) {
      return `您的账户已被永久封禁。封禁原因：${reason}。如有疑问，请联系管理员。`
    }

    const bannedUntil = new Date(userStatus.bannedUntil)
    const now = new Date()
    
    if (bannedUntil > now) {
      return `您的账户已被封禁至 ${bannedUntil.toLocaleString('zh-CN')}。封禁原因：${reason}。如有疑问，请联系管理员。`
    }

    return null // 封禁已过期
  }

  return {
    userStatus,
    loading: loading || sessionStatus === 'loading',
    isBanned,
    isUnderObservation,
    bannedMessage: getBannedMessage(),
    refetch: fetchUserStatus
  }
}
