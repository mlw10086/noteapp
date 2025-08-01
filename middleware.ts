import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// 需要跳过维护模式检查的路径
const SKIP_MAINTENANCE_PATHS = [
  '/admin',
  '/maintenance',
  '/api',
  '/_next',
  '/favicon.ico',
]

// 需要认证的路径
const PROTECTED_PATHS = [
  '/',
  '/notes',
  '/settings',
  '/privacy',
]

// 公开路径（不需要认证）
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/signup',
  '/maintenance',
  '/admin',
  '/api',
  '/_next',
  '/favicon.ico',
]

// 检查维护模式
async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'site_maintenance_mode' }
    })
    return setting?.value === 'true'
  } catch (error) {
    console.error('检查维护模式失败:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[Middleware] 处理路径: ${pathname}`)

  // 检查是否是公开路径
  const isPublicPath = PUBLIC_PATHS.some(path =>
    pathname.startsWith(path)
  )

  console.log(`[Middleware] 是否为公开路径: ${isPublicPath}`)

  // 如果不是公开路径，检查用户认证
  if (!isPublicPath) {
    console.log(`[Middleware] 检查认证 for ${pathname}`)
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })

      console.log(`[Middleware] Token:`, token ? 'exists' : 'null')

      // 如果没有有效的token，重定向到登录页面
      if (!token || !token.id) {
        console.log(`[Middleware] 重定向到登录页面: ${pathname}`)
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }

      console.log(`[Middleware] 认证通过: ${pathname}`)
    } catch (error) {
      console.error('[Middleware] 认证检查失败:', error)
      // 认证检查失败时，重定向到登录页面
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // 跳过特定路径的维护模式检查
  const shouldSkipMaintenance = SKIP_MAINTENANCE_PATHS.some(path =>
    pathname.startsWith(path)
  )

  if (!shouldSkipMaintenance) {
    // 检查维护模式
    const maintenanceMode = await isMaintenanceMode()

    if (maintenanceMode && pathname !== '/maintenance') {
      // 重定向到维护页面
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    // 如果不在维护模式但访问维护页面，重定向到首页
    if (!maintenanceMode && pathname === '/maintenance') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/profile',
    '/settings',
    '/scheduled',
    '/((?!api|_next|favicon.ico|auth).*)',
  ],
}
