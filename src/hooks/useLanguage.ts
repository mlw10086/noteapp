'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export type Locale = 'zh' | 'en' | 'ja'

export function useLanguage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const changeLanguage = (locale: Locale) => {
    startTransition(() => {
      // 设置 cookie
      document.cookie = `locale=${locale}; path=/; max-age=31536000` // 1年过期
      
      // 刷新页面以应用新语言
      router.refresh()
    })
  }

  const getCurrentLanguage = (): Locale => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(cookie => cookie.trim().startsWith('locale='))
      if (localeCookie) {
        const locale = localeCookie.split('=')[1] as Locale
        if (['zh', 'en', 'ja'].includes(locale)) {
          return locale
        }
      }
    }
    return 'zh' // 默认中文
  }

  return {
    changeLanguage,
    getCurrentLanguage,
    isPending
  }
}
