import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/admin-auth-middleware"

// GET - 获取更新记录列表
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || ''
      const type = searchParams.get('type') || ''
      const published = searchParams.get('published')

      const skip = (page - 1) * limit

      // 构建查询条件
      const where: any = {}

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { version: { contains: search } },
          { content: { contains: search } }
        ]
      }

      if (type) {
        where.type = type
      }

      if (published !== null && published !== '') {
        where.isPublished = published === 'true'
      }

      // 获取总数
      const total = await prisma.systemUpdate.count({ where })

      // 获取更新记录
      const updates = await prisma.systemUpdate.findMany({
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
      })

      return NextResponse.json({
        updates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('获取更新记录失败:', error)
      return NextResponse.json(
        { error: '获取更新记录失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 创建新的更新记录
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const body = await request.json()
      const { version, title, content, type, priority, isPublished } = body

      // 验证必填字段
      if (!version || !title || !content) {
        return NextResponse.json(
          { error: '版本号、标题和内容为必填项' },
          { status: 400 }
        )
      }

      // 检查版本号是否已存在
      const existingUpdate = await prisma.systemUpdate.findUnique({
        where: { version }
      })

      if (existingUpdate) {
        return NextResponse.json(
          { error: '该版本号已存在' },
          { status: 400 }
        )
      }

      // 创建更新记录
      const update = await prisma.systemUpdate.create({
        data: {
          version,
          title,
          content,
          type: type || 'feature',
          priority: priority || 'normal',
          isPublished: isPublished || false,
          publishedAt: isPublished ? new Date() : null,
          createdBy: adminId
        },
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

      return NextResponse.json({
        message: '更新记录创建成功',
        update
      })
    } catch (error) {
      console.error('创建更新记录失败:', error)
      return NextResponse.json(
        { error: '创建更新记录失败' },
        { status: 500 }
      )
    }
  })
}
