import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/admin-token"

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, adminId: number, adminRole: string) => Promise<NextResponse>
) {
  try {
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: "未授权访问，请先登录管理员账户" },
        { status: 401 }
      )
    }

    const payload = verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: "Token无效或已过期" },
        { status: 401 }
      )
    }

    const adminId = payload.adminId
    const adminRole = payload.role

    if (!['admin', 'super_admin'].includes(adminRole)) {
      return NextResponse.json(
        { error: "权限不足" },
        { status: 403 }
      )
    }

    return await handler(request, adminId, adminRole)
  } catch (error) {
    console.error("管理员认证中间件错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 检查超级管理员权限
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
