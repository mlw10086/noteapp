import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdminAuth } from '@/lib/admin-auth-middleware'

// GET - 获取通知发送历史
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const type = searchParams.get('type')
      
      const skip = (page - 1) * limit

      const where: any = {}
      if (type && ['system', 'announcement', 'maintenance', 'feature'].includes(type)) {
        where.type = type
      }

      const [logs, total] = await Promise.all([
        prisma.adminNotificationLog.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.adminNotificationLog.count({ where })
      ])

      // 转换数据格式以匹配前端期望
      const formattedLogs = logs.map(log => ({
        id: log.id,
        title: log.title,
        content: log.content,
        type: log.type,
        recipientCount: log.recipientCount,
        createdAt: log.createdAt,
        admin: {
          name: log.admin.name
        }
      }))

      return NextResponse.json(formattedLogs)

    } catch (error) {
      console.error('获取通知历史失败:', error)
      return NextResponse.json(
        { error: '获取通知历史失败' },
        { status: 500 }
      )
    }
  })
}
