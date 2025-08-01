import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取当前用户的所有标签
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      // 从当前用户的便签中提取所有唯一标签
      const notes = await prisma.note.findMany({
        where: {
          userId: userId
        },
        select: {
          tags: true
        }
      })

      const allTags = new Set<string>()
      notes.forEach(note => {
        note.tags.forEach(tag => {
          if (tag.trim()) {
            allTags.add(tag.trim())
          }
        })
      })

      const uniqueTags = Array.from(allTags).sort()

      return NextResponse.json(uniqueTags)
    } catch (error) {
      console.error('获取标签失败:', error)
      return NextResponse.json(
        { error: '获取标签失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 创建新标签（可选功能，用于预定义标签）
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { name, color } = body

      if (!name || name.trim() === '') {
        return NextResponse.json(
          { error: '标签名不能为空' },
          { status: 400 }
        )
      }

      const tag = await prisma.tag.create({
        data: {
          name: name.trim(),
          color: color || '#3b82f6'
        }
      })

      return NextResponse.json(tag, { status: 201 })
    } catch (error) {
      console.error('创建标签失败:', error)
      return NextResponse.json(
        { error: '创建标签失败' },
        { status: 500 }
      )
    }
  })
}
