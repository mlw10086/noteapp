'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/Navbar"
import { SessionProvider } from "@/components/SessionProvider"
import { SearchProvider } from "@/contexts/SearchContext"
import { ThemeProvider } from "@/components/ThemeProvider"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // 检查是否是管理端路径或维护页面
  const isAdminPath = pathname.startsWith('/admin')
  const isMaintenancePage = pathname === '/maintenance'

  if (isAdminPath || isMaintenancePage) {
    // 管理端或维护页面：只提供基础的主题支持，不包含用户端组件
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
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
      <SessionProvider>
        <SearchProvider>
          <Navbar />
          {children}
        </SearchProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
