'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Users,
  Settings,
  MessageSquare,
  BarChart3,
  Menu,
  X,
  Home,
  Wrench,
  Bell,
  FileText,
  UserCog
} from 'lucide-react'

interface AdminSidebarProps {
  className?: string
}

const navigation = [
  {
    name: '仪表板',
    href: '/admin/dashboard',
    icon: Home,
  },
  {
    name: '用户管理',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: '通知管理',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    name: '更新记录',
    href: '/admin/updates',
    icon: FileText,
  },
  {
    name: '站点设置',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    name: '公告管理',
    href: '/admin/announcements',
    icon: MessageSquare,
  },
  {
    name: '系统维护',
    href: '/admin/maintenance',
    icon: Wrench,
  },
  {
    name: '统计分析',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: '个人设置',
    href: '/admin/profile',
    icon: UserCog,
  },
]

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* 移动端菜单按钮 */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 移动端遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              管理面板
            </h1>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 底部信息 */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              管理员面板 v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
