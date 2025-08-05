import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/admin-middleware"

// GET - 获取活跃的协作会话
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      // 获取所有活跃的协作会话
      const sessions = await prisma.collaborationSession.findMany({
        where: {
          isActive: true,
          leftAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          note: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: [
          { noteId: 'asc' },
          { joinedAt: 'desc' }
        ]
      })

      // 过滤掉超过5分钟没有活动的会话（可能是僵尸连接）
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const activeSessions = sessions.filter(session => 
        new Date(session.lastActivity) > fiveMinutesAgo
      )

      return NextResponse.json(activeSessions)
    } catch (error) {
      console.error('获取协作会话失败:', error)
      return NextResponse.json(
        { error: '获取协作会话失败' },
        { status: 500 }
      )
    }
  })
}

// DELETE - 强制断开指定会话
export async function DELETE(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const { searchParams } = new URL(request.url)
      const sessionId = searchParams.get('sessionId')

      if (!sessionId) {
        return NextResponse.json(
          { error: '缺少会话ID' },
          { status: 400 }
        )
      }

      // 更新会话状态为已离开
      const session = await prisma.collaborationSession.update({
        where: { id: parseInt(sessionId) },
        data: {
          isActive: false,
          leftAt: new Date()
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          note: {
            select: {
              title: true
            }
          }
        }
      })

      // 这里可以添加通知 Socket.IO 服务器断开特定连接的逻辑
      console.log(`管理员强制断开协作会话: 用户 ${session.user.name} 在便签 "${session.note.title}" 的协作`)

      return NextResponse.json({
        message: '会话已断开',
        session
      })
    } catch (error) {
      console.error('断开协作会话失败:', error)
      return NextResponse.json(
        { error: '断开协作会话失败' },
        { status: 500 }
      )
    }
  })
}
