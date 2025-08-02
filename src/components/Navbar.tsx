'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, FileText, Home, User, LogOut, LogIn, UserPlus } from "lucide-react"
import { UserAvatar } from "@/components/UserAvatar"
import { NavbarSearch } from "@/components/NavbarSearch"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageToggle } from "@/components/LanguageToggle"
import { NotificationCenter } from "@/components/NotificationCenter"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { SiteName } from "@/components/SiteName"

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const t = useTranslations()

  // 安全地获取站点设置，避免 SSR 错误
  let registrationEnabled = true

  try {
    const { settings } = useSiteSettings()
    registrationEnabled = settings.allow_registration !== false
  } catch (error) {
    // 在 SSR 期间或 Context 未初始化时使用默认值
    console.debug('使用默认站点设置')
  }

  const navItems = [
    {
      href: "/",
      label: t('navigation.notes'),
      icon: FileText,
      description: "管理所有便签"
    },
    {
      href: "/scheduled",
      label: t('navigation.scheduled'),
      icon: Clock,
      description: "管理定时发布的便签"
    }
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    window.location.href = "/auth/signin"
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <SiteName className="text-xl font-bold text-foreground" />
          </div>

          {/* 中间区域：搜索和导航链接 */}
          <div className="flex items-center gap-4 flex-1 justify-center max-w-2xl">
            {/* 搜索框 */}
            {session && <NavbarSearch />}

            {/* Navigation Links */}
            {session && (
              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`flex items-center gap-2 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        title={item.description}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* 右侧用户菜单 */}
          <div className="flex items-center gap-2">
            {/* 语言切换按钮 */}
            <LanguageToggle />

            {/* 通知中心 */}
            {session && <NotificationCenter />}

            {/* 主题切换按钮 */}
            {session && <ThemeToggle />}

            {/* 用户菜单或登录按钮 */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:bg-muted/50 transition-colors"
                  >
                    <UserAvatar
                      user={session.user}
                      size="md"
                      className="hover:scale-105 transition-transform"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('navigation.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t('auth.signIn')}</span>
                  </Button>
                </Link>
                {registrationEnabled && (
                  <Link href="/auth/signup">
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('auth.signUp')}</span>
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
