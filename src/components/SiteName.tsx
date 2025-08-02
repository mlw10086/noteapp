'use client'

import { useSiteName } from '@/contexts/SiteSettingsContext'

interface SiteNameProps {
  fallback?: string
  className?: string
}

export function SiteName({ fallback = '便签系统', className }: SiteNameProps) {
  try {
    const siteName = useSiteName()
    return <span className={className}>{siteName}</span>
  } catch (error) {
    // 在 Context 未初始化时使用 fallback
    return <span className={className}>{fallback}</span>
  }
}

export function SiteNameText({ fallback = '便签系统' }: { fallback?: string }) {
  try {
    return useSiteName()
  } catch (error) {
    return fallback
  }
}
