import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// PUT - 更新用户信息
export async function PUT(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { name } = body

      // 验证输入
      if (!name || name.trim() === '') {
        return NextResponse.json(
          { error: "用户名不能为空" },
          { status: 400 }
        )
      }

      if (name.trim().length < 2) {
        return NextResponse.json(
          { error: "用户名至少需要2个字符" },
          { status: 400 }
        )
      }

      if (name.trim().length > 50) {
        return NextResponse.json(
          { error: "用户名不能超过50个字符" },
          { status: 400 }
        )
      }

      // 更新用户信息
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          updatedAt: true,
        }
      })

      return NextResponse.json({
        message: "用户信息更新成功",
        user: updatedUser
      })

    } catch (error) {
      console.error("更新用户信息失败:", error)
      return NextResponse.json(
        { error: "服务器内部错误" },
        { status: 500 }
      )
    }
  })
}
