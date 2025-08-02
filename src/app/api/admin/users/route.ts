import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || ''
      const sortBy = searchParams.get('sortBy') || 'createdAt'
      const sortOrder = searchParams.get('sortOrder') || 'desc'

      const skip = (page - 1) * limit

      // 构建搜索条件
      const where = search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ]
      } : {}

      // 构建排序条件
      const orderBy = {
        [sortBy]: sortOrder
      }

      // 获取用户列表
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            bannedUntil: true,
            bannedReason: true,
            bannedIps: true,
            lastIpAddress: true,
            _count: {
              select: {
                notes: true,
                loginHistory: true,
              }
            }
          }
        }),
        prisma.user.count({ where })
      ])

      return NextResponse.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json(
        { error: '获取用户列表失败' },
        { status: 500 }
      )
    }
  })
}
