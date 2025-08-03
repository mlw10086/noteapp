import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { withAdminAuth } from "@/lib/admin-auth-middleware"
import { prisma } from "@/lib/prisma"
import { captchaStore } from "@/lib/captcha-store"

// PUT - 修改管理员密码
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const body = await request.json()
      const { currentPassword, newPassword, captcha, captchaSessionId } = body

      // 验证输入
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "当前密码和新密码都是必填项" },
          { status: 400 }
        )
      }

      if (!captcha || !captchaSessionId) {
        return NextResponse.json(
          { error: "验证码不能为空" },
          { status: 400 }
        )
      }

      // 验证验证码
      const isCaptchaValid = captchaStore.verify(captchaSessionId, captcha)
      if (!isCaptchaValid) {
        return NextResponse.json(
          { error: "验证码错误或已过期" },
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

      // 获取管理员当前密码
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { password: true }
      })

      if (!admin) {
        return NextResponse.json(
          { error: "管理员不存在" },
          { status: 404 }
        )
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        admin.password
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
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          password: hashedNewPassword,
        }
      })

      // 记录管理员操作日志
      try {
        await prisma.adminLoginHistory.create({
          data: {
            adminId: adminId,
            action: 'password_changed',
            ipAddress: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            success: true,
            details: '管理员修改密码'
          }
        })
      } catch (logError) {
        console.error('记录管理员操作日志失败:', logError)
        // 不影响主要功能，继续执行
      }

      return NextResponse.json({
        message: "密码修改成功"
      })

    } catch (error) {
      console.error("修改管理员密码失败:", error)
      return NextResponse.json(
        { error: "服务器内部错误" },
        { status: 500 }
      )
    }
  })
}
