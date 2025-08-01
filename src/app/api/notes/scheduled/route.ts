import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取当前用户的定时便签
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const now = new Date()
      
      const scheduledNotes = await prisma.note.findMany({
        where: {
          userId: userId,
          status: 'scheduled'
        },
        select: {
          id: true,
          title: true,
          publishAt: true,
          createdAt: true
        },
        orderBy: {
          publishAt: 'asc'
        }
      })

      const readyToPublish = scheduledNotes.filter(note => 
        note.publishAt && note.publishAt <= now
      )

      const pending = scheduledNotes.filter(note => 
        note.publishAt && note.publishAt > now
      )

      return NextResponse.json({
        total: scheduledNotes.length,
        readyToPublish: readyToPublish.length,
        pending: pending.length,
        notes: {
          readyToPublish,
          pending
        }
      })
    } catch (error) {
      console.error('获取定时便签失败:', error)
      return NextResponse.json(
        { error: '获取定时便签失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 立即发布当前用户的到期定时便签
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const now = new Date()
      
      // 查找当前用户需要发布的定时便签
      const scheduledNotes = await prisma.note.findMany({
        where: {
          userId: userId,
          status: 'scheduled',
          publishAt: {
            lte: now
          }
        }
      })

      if (scheduledNotes.length === 0) {
        return NextResponse.json({
          message: '没有需要发布的定时便签',
          published: 0
        })
      }

      // 批量更新状态为已发布
      const result = await prisma.note.updateMany({
        where: {
          userId: userId,
          status: 'scheduled',
          publishAt: {
            lte: now
          }
        },
        data: {
          status: 'published',
          publishAt: null
        }
      })

      console.log(`用户 ${userId} 发布了 ${result.count} 个定时便签`)

      return NextResponse.json({
        message: `成功发布 ${result.count} 个定时便签`,
        published: result.count,
        notes: scheduledNotes.map(note => ({
          id: note.id,
          title: note.title,
          publishAt: note.publishAt
        }))
      })
    } catch (error) {
      console.error('发布定时便签失败:', error)
      return NextResponse.json(
        { error: '发布定时便签失败' },
        { status: 500 }
      )
    }
  })
}
