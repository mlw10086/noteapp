import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdminAuth } from '@/lib/admin-auth-middleware'

// DELETE - 删除通知发送历史记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const logId = parseInt(params.id)
      
      if (isNaN(logId)) {
        return NextResponse.json(
          { error: '无效的记录ID' },
          { status: 400 }
        )
      }

      // 检查记录是否存在
      const existingLog = await prisma.adminNotificationLog.findUnique({
        where: { id: logId }
      })

      if (!existingLog) {
        return NextResponse.json(
          { error: '发送记录不存在' },
          { status: 404 }
        )
      }

      // 删除发送历史记录
      await prisma.adminNotificationLog.delete({
        where: { id: logId }
      })

      console.log(`管理员 ${adminId} 删除了通知发送记录 ${logId}`)

      return NextResponse.json({
        success: true,
        message: '发送记录已删除'
      })

    } catch (error) {
      console.error('删除通知发送记录失败:', error)
      return NextResponse.json(
        { error: '删除发送记录失败' },
        { status: 500 }
      )
    }
  })
}

// GET - 获取单个通知发送历史记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const logId = parseInt(params.id)
      
      if (isNaN(logId)) {
        return NextResponse.json(
          { error: '无效的记录ID' },
          { status: 400 }
        )
      }

      const log = await prisma.adminNotificationLog.findUnique({
        where: { id: logId },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!log) {
        return NextResponse.json(
          { error: '发送记录不存在' },
          { status: 404 }
        )
      }

      // 转换数据格式
      const formattedLog = {
        id: log.id,
        title: log.title,
        content: log.content,
        type: log.type,
        sendingType: log.sendingType,
        recipientCount: log.recipientCount,
        recipientIds: log.recipientIds,
        createdAt: log.createdAt,
        admin: {
          id: log.admin.id,
          name: log.admin.name,
          email: log.admin.email
        }
      }

      return NextResponse.json(formattedLog)

    } catch (error) {
      console.error('获取通知发送记录详情失败:', error)
      return NextResponse.json(
        { error: '获取发送记录详情失败' },
        { status: 500 }
      )
    }
  })
}
