'use client'

import { SessionProvider } from "next-auth/react"

interface AdminSessionProviderProps {
  children: React.ReactNode
}

export function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  return (
    <SessionProvider 
      basePath="/api/admin/auth"
      refetchInterval={5 * 60} // 5分钟刷新一次
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}
