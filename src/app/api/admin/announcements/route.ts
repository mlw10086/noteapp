import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取公告列表
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const status = searchParams.get('status') // active, inactive, all

      const skip = (page - 1) * limit

      // 构建查询条件
      const where: any = {}
      if (status === 'active') {
        where.isActive = true
      } else if (status === 'inactive') {
        where.isActive = false
      }

      // 获取公告列表
      const [announcements, total] = await Promise.all([
        prisma.announcement.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
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
        }),
        prisma.announcement.count({ where })
      ])

      return NextResponse.json({
        announcements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('获取公告列表失败:', error)
      return NextResponse.json(
        { error: '获取公告列表失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 创建新公告
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const {
        title,
        content,
        type = 'info',
        priority = 0,
        isActive = true,
        startDate,
        endDate
      } = await request.json()

      if (!title || !content) {
        return NextResponse.json(
          { error: '标题和内容不能为空' },
          { status: 400 }
        )
      }

      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          type,
          priority,
          isActive,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdBy: adminId,
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
      console.error('创建公告失败:', error)
      return NextResponse.json(
        { error: '创建公告失败' },
        { status: 500 }
      )
    }
  })
}
