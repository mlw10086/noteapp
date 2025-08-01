import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取用户可见的公告
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const now = new Date()

      // 获取用户已关闭的公告ID列表
      const dismissedAnnouncements = await prisma.userAnnouncementDismissal.findMany({
        where: { userId },
        select: { announcementId: true }
      })
      const dismissedIds = dismissedAnnouncements.map(d => d.announcementId)

      // 获取活跃的公告，排除用户已关闭的
      const announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          id: {
            notIn: dismissedIds
          },
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } }
              ]
            }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          priority: true,
          createdAt: true,
        }
      })

      return NextResponse.json(announcements)

    } catch (error) {
      console.error('获取公告失败:', error)
      return NextResponse.json(
        { error: '获取公告失败' },
        { status: 500 }
      )
    }
  })
}
