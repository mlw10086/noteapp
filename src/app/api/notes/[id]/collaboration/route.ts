import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'

// PUT - 切换协作状态（仅所有者可操作）
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

      const { enabled } = await request.json()

      if (typeof enabled !== 'boolean') {
        return NextResponse.json(
          { error: '无效的协作状态' },
          { status: 400 }
        )
      }

      // 检查是否为便签所有者
      const note = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        }
      })

      if (!note) {
        return NextResponse.json(
          { error: '便签不存在或无权限操作' },
          { status: 404 }
        )
      }

      // 更新协作状态
      const updatedNote = await prisma.note.update({
        where: { id },
        data: { collaborationEnabled: enabled }
      })

      // 通过WebSocket广播协作状态变化给所有房间用户
      try {
        const { Server } = require('socket.io')
        const { createServer } = require('http')

        // 获取Socket.IO实例（这里需要从全局获取）
        // 注意：这是一个简化的实现，实际应该从应用实例获取io
        if (global.io) {
          global.io.to(`note:${id}`).emit('collaboration:status-changed', {
            noteId: id,
            enabled: updatedNote.collaborationEnabled,
            changedBy: userId
          })
        }
      } catch (error) {
        console.error('广播协作状态变化失败:', error)
      }

      return NextResponse.json({
        success: true,
        collaborationEnabled: updatedNote.collaborationEnabled,
        message: enabled ? '协作已启用' : '协作已禁用'
      })
    } catch (error) {
      console.error('切换协作状态失败:', error)
      return NextResponse.json(
        { error: '切换协作状态失败' },
        { status: 500 }
      )
    }
  })
}

// GET - 获取协作状态
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

      // 检查用户是否有访问权限（所有者或协作者）
      let hasAccess = false
      let noteData = null

      // 检查是否为所有者
      const ownerNote = await prisma.note.findFirst({
        where: {
          id,
          userId: userId
        },
        select: {
          collaborationEnabled: true,
          userId: true
        }
      })

      if (ownerNote) {
        hasAccess = true
        noteData = ownerNote
      } else {
        // 检查是否为协作者
        const collaborator = await prisma.noteCollaborator.findFirst({
          where: {
            noteId: id,
            userId: userId
          },
          include: {
            note: {
              select: {
                collaborationEnabled: true,
                userId: true
              }
            }
          }
        })

        if (collaborator) {
          hasAccess = true
          // 使用协作者关联的便签数据
          noteData = collaborator.note
        }
      }

      if (!hasAccess || !noteData) {
        return NextResponse.json(
          { error: '便签不存在或无权访问' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        collaborationEnabled: noteData.collaborationEnabled,
        isOwner: noteData.userId === userId
      })
    } catch (error) {
      console.error('获取协作状态失败:', error)
      return NextResponse.json(
        { error: '获取协作状态失败' },
        { status: 500 }
      )
    }
  })
}
