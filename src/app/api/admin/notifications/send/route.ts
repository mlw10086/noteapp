import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdminAuth } from '@/lib/admin-auth-middleware'

// POST - 管理员发送通知
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const body = await request.json()
      const { title, content, type, sendingType, userIds } = body

      // 验证必填字段
      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json(
          { error: '标题和内容不能为空' },
          { status: 400 }
        )
      }

      if (!['system', 'announcement', 'maintenance', 'feature'].includes(type)) {
        return NextResponse.json(
          { error: '无效的通知类型' },
          { status: 400 }
        )
      }

      if (!['broadcast', 'single'].includes(sendingType)) {
        return NextResponse.json(
          { error: '无效的发送类型' },
          { status: 400 }
        )
      }

      let targetUserIds: number[] = []

      if (sendingType === 'broadcast') {
        // 全站广播 - 获取所有用户ID
        const allUsers = await prisma.user.findMany({
          select: { id: true }
        })
        targetUserIds = allUsers.map(user => user.id)
      } else if (sendingType === 'single') {
        // 指定用户
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json(
            { error: '请选择要发送的用户' },
            { status: 400 }
          )
        }

        // 验证用户ID是否存在
        const existingUsers = await prisma.user.findMany({
          where: {
            id: { in: userIds }
          },
          select: { id: true }
        })

        if (existingUsers.length !== userIds.length) {
          return NextResponse.json(
            { error: '部分用户不存在' },
            { status: 400 }
          )
        }

        targetUserIds = userIds
      }

      if (targetUserIds.length === 0) {
        return NextResponse.json(
          { error: '没有找到目标用户' },
          { status: 400 }
        )
      }

      // 批量创建通知记录
      const notifications = targetUserIds.map(userId => ({
        userId,
        type,
        title: title.trim(),
        content: content.trim(),
        data: JSON.stringify({
          adminId,
          sendingType,
          sentAt: new Date().toISOString()
        })
      }))

      // 使用事务批量插入
      const result = await prisma.$transaction(async (tx) => {
        // 批量创建通知
        const createdNotifications = await tx.userNotification.createMany({
          data: notifications
        })

        // 记录发送历史
        await tx.adminNotificationLog.create({
          data: {
            adminId,
            title: title.trim(),
            content: content.trim(),
            type,
            sendingType,
            recipientCount: targetUserIds.length,
            recipientIds: targetUserIds
          }
        })

        return createdNotifications
      })

      console.log(`管理员 ${adminId} 发送通知给 ${targetUserIds.length} 个用户: ${title}`)

      return NextResponse.json({
        success: true,
        sentCount: targetUserIds.length,
        message: `通知已发送给 ${targetUserIds.length} 个用户`
      })

    } catch (error) {
      console.error('发送通知失败:', error)
      return NextResponse.json(
        { error: '发送通知失败' },
        { status: 500 }
      )
    }
  })
}
