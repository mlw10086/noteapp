import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// POST - 用户关闭公告
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const announcementId = parseInt(idParam)

      if (isNaN(announcementId)) {
        return NextResponse.json(
          { error: '无效的公告ID' },
          { status: 400 }
        )
      }

      // 检查公告是否存在
      const announcement = await prisma.announcement.findUnique({
        where: { id: announcementId }
      })

      if (!announcement) {
        return NextResponse.json(
          { error: '公告不存在' },
          { status: 404 }
        )
      }

      // 创建关闭记录（如果不存在）
      await prisma.userAnnouncementDismissal.upsert({
        where: {
          userId_announcementId: {
            userId,
            announcementId
          }
        },
        update: {},
        create: {
          userId,
          announcementId
        }
      })

      return NextResponse.json({ success: true })

    } catch (error) {
      console.error('关闭公告失败:', error)
      return NextResponse.json(
        { error: '关闭公告失败' },
        { status: 500 }
      )
    }
  })
}
