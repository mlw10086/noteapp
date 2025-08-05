import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, adminId: number, adminRole: string) => Promise<NextResponse>
) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value

    if (!adminToken) {
      return NextResponse.json(
        { error: "未授权访问，请先登录管理员账户" },
        { status: 401 }
      )
    }

    // 验证 JWT token
    let decoded: any
    try {
      decoded = jwt.verify(adminToken, process.env.NEXTAUTH_SECRET!)
    } catch (error) {
      return NextResponse.json(
        { error: "无效的管理员令牌" },
        { status: 401 }
      )
    }

    const adminId = decoded.adminId
    if (!adminId || isNaN(parseInt(adminId))) {
      return NextResponse.json(
        { error: "无效的管理员ID" },
        { status: 401 }
      )
    }

    // 验证管理员是否存在且激活
    const admin = await prisma.admin.findUnique({
      where: {
        id: parseInt(adminId),
        isActive: true
      },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: "管理员账户不存在或已被禁用" },
        { status: 401 }
      )
    }

    return await handler(request, parseInt(adminId), admin.role)
  } catch (error) {
    console.error("管理员认证中间件错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 检查是否为超级管理员
export async function withSuperAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, adminId: number) => Promise<NextResponse>
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    if (adminRole !== 'super_admin') {
      return NextResponse.json(
        { error: "需要超级管理员权限" },
        { status: 403 }
      )
    }
    return await handler(request, adminId)
  })
}

// 检查用户是否为管理员（用于前端组件）
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { 
        id: parseInt(userId),
        isActive: true 
      }
    })
    return !!admin
  } catch (error) {
    console.error("检查管理员权限错误:", error)
    return false
  }
}

// 获取管理员信息
export async function getAdminInfo(adminId: number) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        lastLogin: true,
        createdAt: true
      }
    })
    return admin
  } catch (error) {
    console.error("获取管理员信息错误:", error)
    return null
  }
}
