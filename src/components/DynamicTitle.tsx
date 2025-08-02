'use client'

import { useEffect } from 'react'
import { useSiteName, useSiteDescription } from '@/contexts/SiteSettingsContext'

interface DynamicTitleProps {
  pageTitle?: string
  description?: string
}

export function DynamicTitle({ pageTitle, description }: DynamicTitleProps) {
  const siteName = useSiteName()
  const siteDescription = useSiteDescription()

  useEffect(() => {
    // 更新页面标题
    const title = pageTitle ? `${pageTitle} - ${siteName}` : siteName
    document.title = title

    // 更新页面描述
    const desc = description || siteDescription
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', desc)
    } else {
      // 如果不存在描述标签，创建一个
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = desc
      document.head.appendChild(meta)
    }

    // 更新 Open Graph 标题
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', title)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      meta.content = title
      document.head.appendChild(meta)
    }

    // 更新 Open Graph 描述
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', desc)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      meta.content = desc
      document.head.appendChild(meta)
    }

  }, [siteName, siteDescription, pageTitle, description])

  return null // 这个组件不渲染任何内容
}

// 便捷的 Hook 用于设置页面标题
export function usePageTitle(pageTitle?: string, description?: string) {
  const siteName = useSiteName()
  const siteDescription = useSiteDescription()

  useEffect(() => {
    const title = pageTitle ? `${pageTitle} - ${siteName}` : siteName
    document.title = title

    const desc = description || siteDescription
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', desc)
    }
  }, [siteName, siteDescription, pageTitle, description])
}
