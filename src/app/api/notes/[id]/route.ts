import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取单个便签
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
          { error: '无效的便签ID' },
          { status: 400 }
        )
      }

      const note = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!note) {
        return NextResponse.json(
          { error: '便签不存在或无权访问' },
          { status: 404 }
        )
      }

      return NextResponse.json(note)
    } catch (error) {
      console.error('获取便签失败:', error)
      return NextResponse.json(
        { error: '获取便签失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新便签
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
          { error: '无效的便签ID' },
          { status: 400 }
        )
      }

      // 验证便签所有权
      const existingNote = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!existingNote) {
        return NextResponse.json(
          { error: '便签不存在或无权修改' },
          { status: 404 }
        )
      }

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

      const note = await prisma.note.update({
        where: { id },
        data: {
          title: title.trim(),
          content: content?.trim() || null,
          color: color || '#ffffff',
          tags: tags || [],
          status: status || 'published',
          publishAt: publishAt ? new Date(publishAt) : null
        }
      })

      return NextResponse.json(note)
    } catch (error) {
      console.error('更新便签失败:', error)
      return NextResponse.json(
        { error: '更新便签失败' },
        { status: 500 }
      )
    }
  })
}

// DELETE - 删除便签
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
          { error: '无效的便签ID' },
          { status: 400 }
        )
      }

      // 验证便签所有权
      const existingNote = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!existingNote) {
        return NextResponse.json(
          { error: '便签不存在或无权删除' },
          { status: 404 }
        )
      }

      await prisma.note.delete({
        where: { id }
      })

      return NextResponse.json({ message: '便签已删除' })
    } catch (error) {
      console.error('删除便签失败:', error)
      return NextResponse.json(
        { error: '删除便签失败' },
        { status: 500 }
      )
    }
  })
}
