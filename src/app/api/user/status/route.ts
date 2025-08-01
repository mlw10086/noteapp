import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET - 获取当前用户的状态信息（不使用权限中间件，因为被封禁用户也需要获取状态）
export async function GET(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        bannedUntil: true,
        bannedReason: true,
        bannedIps: true,
        lastIpAddress: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('获取用户状态失败:', error)
    return NextResponse.json(
      { error: '获取用户状态失败' },
      { status: 500 }
    )
  }
}
