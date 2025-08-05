import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withPublishAuth } from '@/lib/auth-middleware'

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

      // 首先检查是否为便签所有者
      let note = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      // 如果不是所有者，检查是否为协作者
      if (!note) {
        // 检查是否有协作权限
        const collaboration = await prisma.noteCollaborator.findFirst({
          where: {
            noteId: id,
            userId: userId
          },
          include: {
            note: true
          }
        })

        if (collaboration) {
          note = collaboration.note
        }
      }

      // 如果既不是所有者也不是协作者，检查是否有已接受的邀请
      if (!note) {
        const acceptedInvitation = await prisma.noteInvitation.findFirst({
          where: {
            noteId: id,
            receiverId: userId,
            status: 'accepted'
          },
          include: {
            note: true
          }
        })

        if (acceptedInvitation) {
          note = acceptedInvitation.note
        }
      }

      if (!note) {
        return NextResponse.json(
          { error: '便签不存在或无权访问' },
          { status: 404 }
        )
      }

      // 获取用户的权限信息
      let userPermission = 'view' // 默认查看权限
      let isOwner = note.userId === userId

      if (isOwner) {
        userPermission = 'edit' // 所有者有编辑权限
      } else {
        // 检查协作者权限
        const collaborator = await prisma.noteCollaborator.findFirst({
          where: {
            noteId: id,
            userId: userId
          }
        })

        if (collaborator) {
          userPermission = collaborator.permission
        } else {
          // 检查邀请权限
          const invitation = await prisma.noteInvitation.findFirst({
            where: {
              noteId: id,
              receiverId: userId,
              status: 'accepted'
            }
          })

          if (invitation) {
            userPermission = invitation.permission
          }
        }
      }

      return NextResponse.json({
        ...note,
        userPermission,
        isOwner
      })
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

      // 验证便签所有权或编辑权限
      let existingNote = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      let hasEditPermission = !!existingNote // 所有者有编辑权限

      // 如果不是所有者，检查协作权限
      if (!existingNote) {
        const collaboration = await prisma.noteCollaborator.findFirst({
          where: {
            noteId: id,
            userId: userId,
            permission: 'edit' // 只有编辑权限的协作者可以修改
          },
          include: {
            note: true
          }
        })

        if (collaboration) {
          existingNote = collaboration.note
          hasEditPermission = true
        }
      }

      // 如果还没有权限，检查已接受的编辑邀请
      if (!existingNote) {
        const acceptedInvitation = await prisma.noteInvitation.findFirst({
          where: {
            noteId: id,
            receiverId: userId,
            status: 'accepted',
            permission: 'edit' // 只有编辑权限的邀请可以修改
          },
          include: {
            note: true
          }
        })

        if (acceptedInvitation) {
          existingNote = acceptedInvitation.note
          hasEditPermission = true
        }
      }

      if (!existingNote || !hasEditPermission) {
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
