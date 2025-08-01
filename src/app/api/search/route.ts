import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 搜索便签
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q')
      const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []

      let whereConditions: any = {
        userId: userId // 只搜索当前用户的便签
      }

      if (!query && tags.length === 0) {
        // 如果没有搜索条件，返回用户的所有便签
        const notes = await prisma.note.findMany({
          where: whereConditions,
          orderBy: {
            updatedAt: 'desc'
          }
        })
        return NextResponse.json(notes)
      }

      // 文本搜索条件
      if (query) {
        whereConditions.OR = [
          {
            title: {
              contains: query
            }
          },
          {
            content: {
              contains: query
            }
          }
        ]
      }

      // 标签筛选条件
      if (tags.length > 0) {
        whereConditions.tags = {
          hasEvery: tags
        }
      }

      const notes = await prisma.note.findMany({
        where: whereConditions,
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return NextResponse.json(notes)
    } catch (error) {
      console.error('搜索便签失败:', error)
      return NextResponse.json(
        { error: '搜索便签失败' },
        { status: 500 }
      )
    }
  })
}
