import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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

    return await handler(request, userId)
  } catch (error) {
    console.error("认证中间件错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
