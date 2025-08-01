import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取单个公告
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { id: idParam } = await params
      const announcementId = parseInt(idParam)

      if (isNaN(announcementId)) {
        return NextResponse.json(
          { error: '无效的公告ID' },
          { status: 400 }
        )
      }

      const announcement = await prisma.announcement.findUnique({
        where: { id: announcementId },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              dismissedBy: true
            }
          }
        }
      })

      if (!announcement) {
        return NextResponse.json(
          { error: '公告不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json(announcement)

    } catch (error) {
      console.error('获取公告详情失败:', error)
      return NextResponse.json(
        { error: '获取公告详情失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { id: idParam } = await params
      const announcementId = parseInt(idParam)

      if (isNaN(announcementId)) {
        return NextResponse.json(
          { error: '无效的公告ID' },
          { status: 400 }
        )
      }

      const {
        title,
        content,
        type,
        priority,
        isActive,
        startDate,
        endDate
      } = await request.json()

      const announcement = await prisma.announcement.update({
        where: { id: announcementId },
        data: {
          title,
          content,
          type,
          priority,
          isActive,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })

      return NextResponse.json(announcement)

    } catch (error) {
      console.error('更新公告失败:', error)
      return NextResponse.json(
        { error: '更新公告失败' },
        { status: 500 }
      )
    }
  })
}

// DELETE - 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { id: idParam } = await params
      const announcementId = parseInt(idParam)

      if (isNaN(announcementId)) {
        return NextResponse.json(
          { error: '无效的公告ID' },
          { status: 400 }
        )
      }

      await prisma.announcement.delete({
        where: { id: announcementId }
      })

      return NextResponse.json({ success: true })

    } catch (error) {
      console.error('删除公告失败:', error)
      return NextResponse.json(
        { error: '删除公告失败' },
        { status: 500 }
      )
    }
  })
}
