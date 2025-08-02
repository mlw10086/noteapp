import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取单个通知详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const id = parseInt(idParam)

      if (isNaN(id)) {
        return NextResponse.json(
          { error: '无效的通知ID' },
          { status: 400 }
        )
      }

      const notification = await prisma.userNotification.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!notification) {
        return NextResponse.json(
          { error: '通知不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json(notification)
    } catch (error) {
      console.error('获取通知详情失败:', error)
      return NextResponse.json(
        { error: '获取通知详情失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 标记单个通知为已读
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const id = parseInt(idParam)

      if (isNaN(id)) {
        return NextResponse.json(
          { error: '无效的通知ID' },
          { status: 400 }
        )
      }

      const notification = await prisma.userNotification.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!notification) {
        return NextResponse.json(
          { error: '通知不存在' },
          { status: 404 }
        )
      }

      const updatedNotification = await prisma.userNotification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json(updatedNotification)
    } catch (error) {
      console.error('更新通知状态失败:', error)
      return NextResponse.json(
        { error: '更新通知状态失败' },
        { status: 500 }
      )
    }
  })
}

// DELETE - 删除通知
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const id = parseInt(idParam)

      if (isNaN(id)) {
        return NextResponse.json(
          { error: '无效的通知ID' },
          { status: 400 }
        )
      }

      const notification = await prisma.userNotification.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!notification) {
        return NextResponse.json(
          { error: '通知不存在' },
          { status: 404 }
        )
      }

      await prisma.userNotification.delete({
        where: { id }
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('删除通知失败:', error)
      return NextResponse.json(
        { error: '删除通知失败' },
        { status: 500 }
      )
    }
  })
}
