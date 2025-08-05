import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// POST - 邀请用户协作编辑便签
export async function POST(
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

      const body = await request.json()
      const { receiverEmail, permission = 'edit', message, expiresInDays = 7 } = body

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

      // 查找被邀请用户
      const receiver = await prisma.user.findUnique({
        where: { email: receiverEmail }
      })

      if (!receiver) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      // 禁止邀请自己
      if (receiver.id === userId) {
        return NextResponse.json(
          { error: '不能邀请自己' },
          { status: 400 }
        )
      }

      // 检查是否已经是协作者
      const existingCollaborator = await prisma.noteCollaborator.findUnique({
        where: {
          noteId_userId: {
            noteId: noteId,
            userId: receiver.id
          }
        }
      })

      if (existingCollaborator) {
        return NextResponse.json(
          { error: '用户已经是协作者' },
          { status: 400 }
        )
      }

      // 检查是否已有待处理的邀请
      const existingInvitation = await prisma.noteInvitation.findUnique({
        where: {
          noteId_receiverId: {
            noteId: noteId,
            receiverId: receiver.id
          }
        }
      })

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          return NextResponse.json(
            { error: '已有待处理的邀请' },
            { status: 400 }
          )
        } else {
          // 如果存在非待处理的邀请记录，删除旧记录以便创建新邀请
          await prisma.noteInvitation.delete({
            where: {
              id: existingInvitation.id
            }
          })
        }
      }

      // 计算过期时间
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      // 创建邀请
      const invitation = await prisma.noteInvitation.create({
        data: {
          noteId: noteId,
          senderId: userId,
          receiverId: receiver.id,
          permission,
          message,
          expiresAt
        },
        include: {
          note: {
            select: {
              title: true
            }
          },
          sender: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      // 创建站内通知
      await prisma.userNotification.create({
        data: {
          userId: receiver.id,
          type: 'invitation',
          title: '便签协作邀请',
          content: `${invitation.sender.name} 邀请您协作编辑便签「${invitation.note.title}」`,
          data: JSON.stringify({
            invitationId: invitation.id,
            noteId: noteId,
            permission,
            senderName: invitation.sender.name
          })
        }
      })

      return NextResponse.json({
        success: true,
        invitation: {
          id: invitation.id,
          receiverEmail,
          permission,
          expiresAt: invitation.expiresAt
        }
      })
    } catch (error) {
      console.error('发送邀请失败:', error)
      return NextResponse.json(
        { error: '发送邀请失败' },
        { status: 500 }
      )
    }
  })
}

// GET - 获取便签的邀请列表
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

      const invitations = await prisma.noteInvitation.findMany({
        where: {
          noteId: noteId
        },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json(invitations)
    } catch (error) {
      console.error('获取邀请列表失败:', error)
      return NextResponse.json(
        { error: '获取邀请列表失败' },
        { status: 500 }
      )
    }
  })
}
