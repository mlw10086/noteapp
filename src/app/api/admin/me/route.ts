import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-token'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const payload = verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token无效' },
        { status: 401 }
      )
    }

    // 从数据库获取最新的管理员信息
    const admin = await prisma.admin.findUnique({
      where: {
        id: payload.adminId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true,
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: '管理员账户不存在或已被禁用' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      admin: admin
    })

  } catch (error) {
    console.error('获取管理员信息错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
