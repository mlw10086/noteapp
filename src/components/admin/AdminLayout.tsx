'use client'

import { AdminAuthGuard } from '@/components/AdminAuthGuard'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  requiredRole?: 'admin' | 'super_admin'
}

export function AdminLayout({ 
  children, 
  title, 
  description, 
  requiredRole = 'admin' 
}: AdminLayoutProps) {
  return (
    <AdminAuthGuard requiredRole={requiredRole}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* 侧边栏 */}
        <AdminSidebar />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* 顶部导航 */}
          <AdminHeader title={title} description={description} />
          
          {/* 主要内容 */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  )
}
