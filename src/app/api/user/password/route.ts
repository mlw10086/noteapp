import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// PUT - 修改密码
export async function PUT(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { currentPassword, newPassword } = body

      // 验证输入
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "当前密码和新密码都是必填项" },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "新密码长度至少为6位" },
          { status: 400 }
        )
      }

      if (newPassword.length > 100) {
        return NextResponse.json(
          { error: "新密码长度不能超过100位" },
          { status: 400 }
        )
      }

      if (currentPassword === newPassword) {
        return NextResponse.json(
          { error: "新密码不能与当前密码相同" },
          { status: 400 }
        )
      }

      // 获取用户当前密码
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      })

      if (!user) {
        return NextResponse.json(
          { error: "用户不存在" },
          { status: 404 }
        )
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "当前密码不正确" },
          { status: 400 }
        )
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
        }
      })

      return NextResponse.json({
        message: "密码修改成功"
      })

    } catch (error) {
      console.error("修改密码失败:", error)
      return NextResponse.json(
        { error: "服务器内部错误" },
        { status: 500 }
      )
    }
  })
}
