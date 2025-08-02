import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// GET - 获取便签协作者列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const noteId = parseInt(idParam)

      if (isNaN(noteId)) {
        return NextResponse.json(
          { error: '无效的便签ID' },
          { status: 400 }
        )
      }

      // 验证用户是否有权限查看协作者（所有者或协作者）
      const note = await prisma.note.findFirst({
        where: { id: noteId }
      })

      if (!note) {
        return NextResponse.json(
          { error: '便签不存在' },
          { status: 404 }
        )
      }

      const isOwner = note.userId === userId
      const isCollaborator = await prisma.noteCollaborator.findUnique({
        where: {
          noteId_userId: {
            noteId: noteId,
            userId: userId
          }
        }
      })

      if (!isOwner && !isCollaborator) {
        return NextResponse.json(
          { error: '无权限查看协作者' },
          { status: 403 }
        )
      }

      // 获取协作者列表
      const collaborators = await prisma.noteCollaborator.findMany({
        where: {
          noteId: noteId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          joinedAt: 'asc'
        }
      })

      // 添加便签所有者信息
      const owner = await prisma.user.findUnique({
        where: { id: note.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      })

      return NextResponse.json({
        owner,
        collaborators: collaborators.map(collab => ({
          id: collab.id,
          user: collab.user,
          permission: collab.permission,
          joinedAt: collab.joinedAt,
          lastActiveAt: collab.lastActiveAt
        }))
      })
    } catch (error) {
      console.error('获取协作者列表失败:', error)
      return NextResponse.json(
        { error: '获取协作者列表失败' },
        { status: 500 }
      )
    }
  })
}

// DELETE - 移除协作者
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const noteId = parseInt(idParam)

      if (isNaN(noteId)) {
        return NextResponse.json(
          { error: '无效的便签ID' },
          { status: 400 }
        )
      }

      const { searchParams } = new URL(request.url)
      const collaboratorId = parseInt(searchParams.get('collaboratorId') || '')

      if (isNaN(collaboratorId)) {
        return NextResponse.json(
          { error: '无效的协作者ID' },
          { status: 400 }
        )
      }

      // 验证便签所有权
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          userId: userId
        }
      })

      if (!note) {
        return NextResponse.json(
          { error: '便签不存在或无权限' },
          { status: 404 }
        )
      }

      // 查找协作者
      const collaborator = await prisma.noteCollaborator.findUnique({
        where: {
          noteId_userId: {
            noteId: noteId,
            userId: collaboratorId
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      })

      if (!collaborator) {
        return NextResponse.json(
          { error: '协作者不存在' },
          { status: 404 }
        )
      }

      // 删除协作者
      await prisma.noteCollaborator.delete({
        where: {
          id: collaborator.id
        }
      })

      // 通知被移除的协作者
      await prisma.userNotification.create({
        data: {
          userId: collaboratorId,
          type: 'collaboration',
          title: '协作权限已移除',
          content: `您已被移除出便签「${note.title}」的协作列表`,
          data: JSON.stringify({
            noteId: noteId,
            action: 'removed'
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: '协作者已移除'
      })
    } catch (error) {
      console.error('移除协作者失败:', error)
      return NextResponse.json(
        { error: '移除协作者失败' },
        { status: 500 }
      )
    }
  })
}
