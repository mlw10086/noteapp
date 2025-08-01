import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      // 获取用户的便签统计
      const [
        totalNotes,
        scheduledNotes,
        draftNotes,
        userCreatedAt
      ] = await Promise.all([
        // 总便签数
        prisma.note.count({
          where: { userId }
        }),

        // 定时便签数
        prisma.note.count({
          where: {
            userId,
            status: 'scheduled'
          }
        }),

        // 草稿便签数
        prisma.note.count({
          where: {
            userId,
            status: 'draft'
          }
        }),

        // 用户创建时间
        prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true }
        })
      ])

      // 计算使用天数
      const usageDays = userCreatedAt 
        ? Math.ceil((Date.now() - userCreatedAt.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const stats = {
        totalNotes,
        scheduledNotes,
        draftNotes,
        usageDays
      }

      return NextResponse.json(stats)
    } catch (error) {
      console.error('获取用户统计失败:', error)
      return NextResponse.json(
        { error: '获取统计信息失败' },
        { status: 500 }
      )
    }
  })
}
