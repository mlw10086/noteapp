'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/Navbar"
import { SessionProvider } from "@/components/SessionProvider"
import { SearchProvider } from "@/contexts/SearchContext"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext"
import { DynamicTitle } from "@/components/DynamicTitle"
import { AdminAuthProvider } from "@/contexts/AdminAuthContext"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // 检查是否是管理端路径或维护页面
  const isAdminPath = pathname.startsWith('/admin')
  const isMaintenancePage = pathname === '/maintenance'

  if (isAdminPath) {
    // 管理端：包含管理员认证、用户会话和主题支持
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SiteSettingsProvider>
          <SessionProvider>
            <AdminAuthProvider>
              <DynamicTitle />
              {children}
            </AdminAuthProvider>
          </SessionProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    )
  }

  if (isMaintenancePage) {
    // 维护页面：只提供基础的主题支持
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SiteSettingsProvider>
          <DynamicTitle />
          {children}
        </SiteSettingsProvider>
      </ThemeProvider>
    )
  }

  // 用户端：包含完整的用户端布局
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SiteSettingsProvider>
        <SessionProvider>
          <SearchProvider>
            <DynamicTitle />
            <Navbar />
            {children}
          </SearchProvider>
        </SessionProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  )
}
