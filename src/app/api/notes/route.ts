import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取当前用户的所有便签
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const notes = await prisma.note.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return NextResponse.json(notes)
    } catch (error) {
      console.error('获取便签失败:', error)
      return NextResponse.json(
        { error: '获取便签失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 创建新便签
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { title, content, color, tags, status, publishAt } = body

      if (!title || title.trim() === '') {
        return NextResponse.json(
          { error: '标题不能为空' },
          { status: 400 }
        )
      }

      // 验证定时发布设置
      if (status === 'scheduled' && !publishAt) {
        return NextResponse.json(
          { error: '定时发布需要设置发布时间' },
          { status: 400 }
        )
      }

      const note = await prisma.note.create({
        data: {
          title: title.trim(),
          content: content?.trim() || null,
          color: color || '#ffffff',
          tags: tags || [],
          status: status || 'published',
          publishAt: publishAt ? new Date(publishAt) : null,
          userId: userId
        }
      })

      return NextResponse.json(note, { status: 201 })
    } catch (error) {
      console.error('创建便签失败:', error)
      return NextResponse.json(
        { error: '创建便签失败' },
        { status: 500 }
      )
    }
  })
}
