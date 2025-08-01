import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "./prisma"

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: number) => Promise<NextResponse>
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token || !token.id) {
      return NextResponse.json(
        { error: "未授权访问，请先登录" },
        { status: 401 }
      )
    }

    const userId = parseInt(token.id as string)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "无效的用户ID" },
        { status: 401 }
      )
    }

    // 检查用户权限状态
    const permissionCheck = await checkUserPermissions(request, userId)
    if (permissionCheck) {
      return permissionCheck
    }

    return await handler(request, userId)
  } catch (error) {
    console.error("认证中间件错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 检查用户权限状态
async function checkUserPermissions(request: NextRequest, userId: number): Promise<NextResponse | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        bannedUntil: true,
        bannedReason: true,
        bannedIps: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 获取客户端IP地址
    const clientIp = getClientIp(request)

    // 检查IP封禁
    if (user.bannedIps && user.bannedIps.includes(clientIp)) {
      return NextResponse.json(
        { error: "您的IP地址已被封禁，无法访问" },
        { status: 403 }
      )
    }

    // 检查用户封禁状态
    if (user.status === 'banned') {
      const now = new Date()

      // 检查是否为永久封禁
      if (!user.bannedUntil) {
        return NextResponse.json(
          {
            error: "您的账户已被永久封禁",
            reason: user.bannedReason || "违反平台规定"
          },
          { status: 403 }
        )
      }

      // 检查临时封禁是否到期
      if (user.bannedUntil > now) {
        return NextResponse.json(
          {
            error: "您的账户已被封禁",
            reason: user.bannedReason || "违反平台规定",
            bannedUntil: user.bannedUntil.toISOString()
          },
          { status: 403 }
        )
      } else {
        // 封禁已到期，自动解封
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'active',
            bannedUntil: null,
            bannedReason: null,
          }
        })
      }
    }

    return null // 权限检查通过
  } catch (error) {
    console.error("权限检查错误:", error)
    return NextResponse.json(
      { error: "权限检查失败" },
      { status: 500 }
    )
  }
}

// 获取客户端IP地址
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIp || remoteAddr || 'unknown'
}

// 专门用于发布操作的权限检查
export async function withPublishAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: number) => Promise<NextResponse>
) {
  return withAuth(request, async (request, userId) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true }
      })

      if (!user) {
        return NextResponse.json(
          { error: "用户不存在" },
          { status: 404 }
        )
      }

      // 观察模式下不能发布内容
      if (user.status === 'under_observation') {
        return NextResponse.json(
          { error: "您当前处于观察模式，暂时无法发布内容" },
          { status: 403 }
        )
      }

      return await handler(request, userId)
    } catch (error) {
      console.error("发布权限检查错误:", error)
      return NextResponse.json(
        { error: "权限检查失败" },
        { status: 500 }
      )
    }
  })
}
