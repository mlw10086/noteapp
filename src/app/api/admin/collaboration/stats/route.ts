import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/admin-middleware"

// GET - 获取协作统计数据
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      // 并行查询各种统计数据
      const [
        activeSessions,
        activeRooms,
        activeUsers,
        todayOperations,
        sessionDurations
      ] = await Promise.all([
        // 活跃会话数（5分钟内有活动）
        prisma.collaborationSession.count({
          where: {
            isActive: true,
            leftAt: null,
            lastActivity: {
              gte: fiveMinutesAgo
            }
          }
        }),

        // 活跃房间数（有活跃会话的便签数量）
        prisma.collaborationSession.findMany({
          where: {
            isActive: true,
            leftAt: null,
            lastActivity: {
              gte: fiveMinutesAgo
            }
          },
          select: {
            noteId: true
          },
          distinct: ['noteId']
        }),

        // 活跃用户数（5分钟内有活动的用户数量）
        prisma.collaborationSession.findMany({
          where: {
            isActive: true,
            leftAt: null,
            lastActivity: {
              gte: fiveMinutesAgo
            }
          },
          select: {
            userId: true
          },
          distinct: ['userId']
        }),

        // 今日总操作数
        prisma.collaborationSession.aggregate({
          where: {
            joinedAt: {
              gte: todayStart
            }
          },
          _sum: {
            operationsCount: true
          }
        }),

        // 会话持续时间（用于计算平均值）
        prisma.collaborationSession.findMany({
          where: {
            leftAt: {
              not: null
            },
            joinedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
            }
          },
          select: {
            joinedAt: true,
            leftAt: true
          }
        })
      ])

      // 计算平均会话持续时间（分钟）
      let averageSessionDuration = 0
      if (sessionDurations.length > 0) {
        const totalDuration = sessionDurations.reduce((sum, session) => {
          if (session.leftAt) {
            const duration = new Date(session.leftAt).getTime() - new Date(session.joinedAt).getTime()
            return sum + duration
          }
          return sum
        }, 0)
        averageSessionDuration = Math.round(totalDuration / sessionDurations.length / (1000 * 60)) // 转换为分钟
      }

      const stats = {
        totalActiveSessions: activeSessions,
        totalActiveRooms: activeRooms.length,
        totalActiveUsers: activeUsers.length,
        totalOperationsToday: todayOperations._sum.operationsCount || 0,
        averageSessionDuration
      }

      return NextResponse.json(stats)
    } catch (error) {
      console.error('获取协作统计失败:', error)
      return NextResponse.json(
        { error: '获取协作统计失败' },
        { status: 500 }
      )
    }
  })
}
