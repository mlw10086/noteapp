import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PUT - 修改管理员密码
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { currentPassword, newPassword } = await request.json()

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: '当前密码和新密码不能为空' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: '新密码至少需要6个字符' },
          { status: 400 }
        )
      }

      // 获取管理员信息
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          password: true,
        }
      })

      if (!admin) {
        return NextResponse.json(
          { error: '管理员不存在' },
          { status: 404 }
        )
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: '当前密码错误' },
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

      return NextResponse.json({
        success: true,
        message: '密码修改成功'
      })

    } catch (error) {
      console.error('修改管理员密码失败:', error)
      return NextResponse.json(
        { error: '修改密码失败' },
        { status: 500 }
      )
    }
  })
}
