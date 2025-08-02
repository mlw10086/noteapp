import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// POST - 响应邀请（接受或拒绝）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (request, userId) => {
    try {
      const { id: idParam } = await params
      const invitationId = parseInt(idParam)

      if (isNaN(invitationId)) {
        return NextResponse.json(
          { error: '无效的邀请ID' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const { action } = body // 'accept' 或 'reject'

      if (!['accept', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: '无效的操作' },
          { status: 400 }
        )
      }

      // 查找邀请
      const invitation = await prisma.noteInvitation.findFirst({
        where: {
          id: invitationId,
          receiverId: userId,
          status: 'pending'
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              userId: true
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

      if (!invitation) {
        return NextResponse.json(
          { error: '邀请不存在或已处理' },
          { status: 404 }
        )
      }

      // 检查邀请是否过期
      if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        await prisma.noteInvitation.update({
          where: { id: invitationId },
          data: { status: 'expired' }
        })
        return NextResponse.json(
          { error: '邀请已过期' },
          { status: 400 }
        )
      }

      const now = new Date()

      if (action === 'accept') {
        // 接受邀请
        await prisma.$transaction(async (tx) => {
          // 更新邀请状态
          await tx.noteInvitation.update({
            where: { id: invitationId },
            data: {
              status: 'accepted',
              respondedAt: now
            }
          })

          // 创建协作者记录
          await tx.noteCollaborator.create({
            data: {
              noteId: invitation.note.id,
              userId: userId,
              permission: invitation.permission,
              joinedAt: now,
              lastActiveAt: now
            }
          })
        })

        // 通知便签所有者
        await prisma.userNotification.create({
          data: {
            userId: invitation.note.userId,
            type: 'collaboration',
            title: '协作邀请已接受',
            content: `用户接受了您的便签「${invitation.note.title}」协作邀请`,
            data: JSON.stringify({
              noteId: invitation.note.id,
              collaboratorId: userId,
              action: 'accepted'
            })
          }
        })

        return NextResponse.json({
          success: true,
          message: '已接受邀请',
          noteId: invitation.note.id
        })
      } else {
        // 拒绝邀请
        await prisma.noteInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'rejected',
            respondedAt: now
          }
        })

        // 通知便签所有者
        await prisma.userNotification.create({
          data: {
            userId: invitation.note.userId,
            type: 'collaboration',
            title: '协作邀请已拒绝',
            content: `用户拒绝了您的便签「${invitation.note.title}」协作邀请`,
            data: JSON.stringify({
              noteId: invitation.note.id,
              collaboratorId: userId,
              action: 'rejected'
            })
          }
        })

        return NextResponse.json({
          success: true,
          message: '已拒绝邀请'
        })
      }
    } catch (error) {
      console.error('响应邀请失败:', error)
      return NextResponse.json(
        { error: '响应邀请失败' },
        { status: 500 }
      )
    }
  })
}
