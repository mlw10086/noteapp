import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"
import bcrypt from "bcryptjs"

// POST - 删除用户账户
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { password, confirmText } = body

      // 验证确认文本
      if (confirmText !== "删除我的账户") {
        return NextResponse.json(
          { error: '确认文本不正确' },
          { status: 400 }
        )
      }

      // 获取用户信息以验证密码
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true,
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '密码错误' },
          { status: 401 }
        )
      }

      // 开始事务删除所有相关数据
      await prisma.$transaction(async (tx) => {
        // 删除用户设置
        await tx.userSettings.deleteMany({
          where: { userId }
        })

        // 删除登录历史
        await tx.loginHistory.deleteMany({
          where: { userId }
        })

        // 删除用户的所有便签
        await tx.note.deleteMany({
          where: { userId }
        })

        // 最后删除用户账户
        await tx.user.delete({
          where: { id: userId }
        })
      })

      // 记录删除日志（可选，用于审计）
      console.log(`用户账户已删除: ${user.email} (ID: ${userId}) at ${new Date().toISOString()}`)

      return NextResponse.json({
        message: '账户删除成功',
        deletedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('删除账户失败:', error)
      return NextResponse.json(
        { error: '删除账户失败，请稍后重试' },
        { status: 500 }
      )
    }
  })
}

// GET - 获取账户删除前的数据统计
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      // 获取用户数据统计
      const [user, notesCount, settingsExists, loginHistoryCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            name: true,
            createdAt: true,
          }
        }),
        prisma.note.count({
          where: { userId }
        }),
        prisma.userSettings.findUnique({
          where: { userId },
          select: { id: true }
        }),
        prisma.loginHistory.count({
          where: { userId }
        })
      ])

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))

      return NextResponse.json({
        user: {
          email: user.email,
          name: user.name,
          accountAge: `${accountAge}天`,
          createdAt: user.createdAt,
        },
        dataToDelete: {
          notes: notesCount,
          settings: settingsExists ? 1 : 0,
          loginHistory: loginHistoryCount,
        },
        warning: {
          title: '此操作无法撤销',
          description: '删除账户后，所有数据将永久丢失，包括便签、设置和历史记录。',
          recommendations: [
            '在删除前，建议先导出您的数据',
            '确保您已保存重要的便签内容',
            '考虑是否真的需要删除整个账户'
          ]
        }
      })

    } catch (error) {
      console.error('获取删除信息失败:', error)
      return NextResponse.json(
        { error: '获取删除信息失败' },
        { status: 500 }
      )
    }
  })
}
