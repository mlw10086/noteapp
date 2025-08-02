import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取用户通知列表
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const unreadOnly = searchParams.get('unread') === 'true'
      
      const skip = (page - 1) * limit

      const where = {
        userId: userId,
        ...(unreadOnly && { isRead: false })
      }

      const [allNotifications, total] = await Promise.all([
        prisma.userNotification.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.userNotification.count({ where })
      ])

      // 过滤掉自己邀请自己的通知
      const notifications = []
      for (const notification of allNotifications) {
        if (notification.type === 'invitation' && notification.data) {
          try {
            const data = JSON.parse(notification.data)
            if (data.invitationId) {
              // 查询邀请记录，检查是否是自己邀请自己
              const invitation = await prisma.noteInvitation.findUnique({
                where: { id: data.invitationId },
                select: { senderId: true, receiverId: true }
              })

              // 如果邀请记录存在且发送者和接收者是同一人，则跳过这个通知
              if (invitation && invitation.senderId === invitation.receiverId) {
                continue
              }
            }
          } catch (error) {
            // JSON 解析失败，保留通知
            console.error('解析通知数据失败:', error)
          }
        }
        notifications.push(notification)
      }

      return NextResponse.json({
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('获取通知失败:', error)
      return NextResponse.json(
        { error: '获取通知失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 创建新通知（系统内部使用）
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { targetUserId, type, title, content, data } = body

      // 验证权限（只有管理员或系统可以创建通知）
      // 这里简化处理，实际应该有更严格的权限验证
      
      const notification = await prisma.userNotification.create({
        data: {
          userId: targetUserId,
          type,
          title,
          content,
          data: data ? JSON.stringify(data) : null
        }
      })

      return NextResponse.json(notification)
    } catch (error) {
      console.error('创建通知失败:', error)
      return NextResponse.json(
        { error: '创建通知失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 批量标记通知为已读
export async function PUT(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { notificationIds, markAllAsRead } = body

      if (markAllAsRead) {
        // 标记所有未读通知为已读
        await prisma.userNotification.updateMany({
          where: {
            userId: userId,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        })
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // 标记指定通知为已读
        await prisma.userNotification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: userId
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('更新通知状态失败:', error)
      return NextResponse.json(
        { error: '更新通知状态失败' },
        { status: 500 }
      )
    }
  })
}
