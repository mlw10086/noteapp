import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 测试协作功能的API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, noteId, userId, receiverId, permission = 'edit' } = body

    if (action === 'add_collaborator') {
      // 直接添加协作者（跳过邀请流程）
      const collaborator = await prisma.noteCollaborator.create({
        data: {
          noteId: parseInt(noteId),
          userId: parseInt(receiverId),
          permission: permission
        }
      })

      return NextResponse.json({
        success: true,
        message: '协作者添加成功',
        collaborator
      })
    }

    if (action === 'create_invitation') {
      // 创建邀请
      const invitation = await prisma.noteInvitation.create({
        data: {
          noteId: parseInt(noteId),
          senderId: parseInt(userId),
          receiverId: parseInt(receiverId),
          permission: permission,
          status: 'accepted' // 直接设为已接受用于测试
        }
      })

      return NextResponse.json({
        success: true,
        message: '邀请创建成功',
        invitation
      })
    }

    if (action === 'check_access') {
      // 检查用户对便签的访问权限
      const noteId_int = parseInt(noteId)
      const userId_int = parseInt(userId)

      // 检查是否为所有者
      const note = await prisma.note.findFirst({
        where: {
          id: noteId_int,
          userId: userId_int
        }
      })

      if (note) {
        return NextResponse.json({
          success: true,
          access: 'owner',
          note
        })
      }

      // 检查协作者权限
      const collaboration = await prisma.noteCollaborator.findFirst({
        where: {
          noteId: noteId_int,
          userId: userId_int
        },
        include: {
          note: true
        }
      })

      if (collaboration) {
        return NextResponse.json({
          success: true,
          access: 'collaborator',
          permission: collaboration.permission,
          note: collaboration.note
        })
      }

      // 检查邀请权限
      const invitation = await prisma.noteInvitation.findFirst({
        where: {
          noteId: noteId_int,
          receiverId: userId_int,
          status: 'accepted'
        },
        include: {
          note: true
        }
      })

      if (invitation) {
        return NextResponse.json({
          success: true,
          access: 'invited',
          permission: invitation.permission,
          note: invitation.note
        })
      }

      return NextResponse.json({
        success: false,
        access: 'none',
        message: '无权访问此便签'
      })
    }

    return NextResponse.json({
      success: false,
      message: '无效的操作'
    }, { status: 400 })

  } catch (error) {
    console.error('测试协作功能失败:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 获取协作信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({
        success: false,
        message: '缺少便签ID'
      }, { status: 400 })
    }

    const noteId_int = parseInt(noteId)

    // 获取便签信息
    const note = await prisma.note.findUnique({
      where: { id: noteId_int },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!note) {
      return NextResponse.json({
        success: false,
        message: '便签不存在'
      }, { status: 404 })
    }

    // 获取协作者
    const collaborators = await prisma.noteCollaborator.findMany({
      where: { noteId: noteId_int },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // 获取邀请
    const invitations = await prisma.noteInvitation.findMany({
      where: { noteId: noteId_int },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        receiver: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        owner: note.user
      },
      collaborators,
      invitations
    })

  } catch (error) {
    console.error('获取协作信息失败:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
