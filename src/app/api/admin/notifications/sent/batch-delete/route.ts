import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdminAuth } from '@/lib/admin-auth-middleware'

// DELETE - 批量删除通知发送历史记录
export async function DELETE(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const body = await request.json()
      const { logIds } = body

      // 验证请求数据
      if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
        return NextResponse.json(
          { error: '请提供要删除的记录ID列表' },
          { status: 400 }
        )
      }

      // 验证所有ID都是有效的数字
      const validLogIds = logIds.filter(id => Number.isInteger(id) && id > 0)
      if (validLogIds.length === 0) {
        return NextResponse.json(
          { error: '没有有效的记录ID' },
          { status: 400 }
        )
      }

      if (validLogIds.length !== logIds.length) {
        return NextResponse.json(
          { error: '部分记录ID无效' },
          { status: 400 }
        )
      }

      // 检查要删除的记录是否存在
      const existingLogs = await prisma.adminNotificationLog.findMany({
        where: {
          id: { in: validLogIds }
        },
        select: { id: true, title: true }
      })

      if (existingLogs.length === 0) {
        return NextResponse.json(
          { error: '没有找到要删除的记录' },
          { status: 404 }
        )
      }

      // 批量删除记录
      const deleteResult = await prisma.adminNotificationLog.deleteMany({
        where: {
          id: { in: validLogIds }
        }
      })

      console.log(`管理员 ${adminId} 批量删除了 ${deleteResult.count} 条通知发送记录`)

      return NextResponse.json({
        success: true,
        deletedCount: deleteResult.count,
        message: `成功删除 ${deleteResult.count} 条发送记录`
      })

    } catch (error) {
      console.error('批量删除通知发送记录失败:', error)
      return NextResponse.json(
        { error: '批量删除发送记录失败' },
        { status: 500 }
      )
    }
  })
}
