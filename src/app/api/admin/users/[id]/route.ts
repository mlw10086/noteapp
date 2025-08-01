import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { id: idParam } = await params
      const userId = parseInt(idParam)

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: '无效的用户ID' },
          { status: 400 }
        )
      }

      // 获取用户详细信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
          loginHistory: {
            orderBy: { createdAt: 'desc' },
            take: 20, // 最近20条登录记录
          },
          _count: {
            select: {
              notes: true,
              loginHistory: true,
            }
          }
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      // 获取用户的便签统计
      const noteStats = await prisma.note.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true
        }
      })

      // 计算存储使用情况
      const notes = await prisma.note.findMany({
        where: { userId },
        select: {
          content: true,
          title: true,
        }
      })

      const storageUsed = notes.reduce((total, note) => {
        const contentSize = note.content ? new Blob([note.content]).size : 0
        const titleSize = new Blob([note.title]).size
        return total + contentSize + titleSize
      }, 0)

      return NextResponse.json({
        user: {
          ...user,
          password: undefined, // 不返回密码
        },
        stats: {
          noteStats: noteStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.status
            return acc
          }, {} as Record<string, number>),
          storageUsed,
          totalLoginAttempts: user._count.loginHistory,
        }
      })

    } catch (error) {
      console.error('获取用户详情失败:', error)
      return NextResponse.json(
        { error: '获取用户详情失败' },
        { status: 500 }
      )
    }
  })
}
