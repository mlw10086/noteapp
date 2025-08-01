import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - 发布到期的定时便签
export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（可以添加 API 密钥验证）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    // 查找所有需要发布的定时便签
    const scheduledNotes = await prisma.note.findMany({
      where: {
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

    console.log(`已发布 ${result.count} 个定时便签`)

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
}

// GET - 查看待发布的定时便签（用于调试）
export async function GET(request: NextRequest) {
  try {
    // 检查是否有管理员权限或CRON密钥
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const now = new Date()

    const scheduledNotes = await prisma.note.findMany({
      where: {
        status: 'scheduled'
      },
      select: {
        id: true,
        title: true,
        publishAt: true,
        createdAt: true,
        userId: true
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
}
