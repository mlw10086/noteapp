import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取仪表板数据
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // 并行获取所有统计数据
      const [
        totalUsers,
        totalNotes,
        totalAdmins,
        todayUsers,
        todayNotes,
        monthUsers,
        monthNotes,
        lastMonthUsers,
        lastMonthNotes,
        activeUsers,
        recentUsers,
        recentNotes,
        recentAdminLogins
      ] = await Promise.all([
        // 总用户数
        prisma.user.count(),
        
        // 总便签数
        prisma.note.count(),
        
        // 总管理员数
        prisma.admin.count({ where: { isActive: true } }),
        
        // 今日新用户
        prisma.user.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        
        // 今日新便签
        prisma.note.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        
        // 本月新用户
        prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart
            }
          }
        }),
        
        // 本月新便签
        prisma.note.count({
          where: {
            createdAt: {
              gte: monthStart
            }
          }
        }),
        
        // 上月新用户
        prisma.user.count({
          where: {
            createdAt: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          }
        }),
        
        // 上月新便签
        prisma.note.count({
          where: {
            createdAt: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          }
        }),
        
        // 活跃用户（过去30天有登录记录）
        prisma.user.count({
          where: {
            loginHistory: {
              some: {
                createdAt: {
                  gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }),
        
        // 最近注册的用户
        prisma.user.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            avatar: true
          }
        }),
        
        // 最近创建的便签
        prisma.note.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        
        // 最近管理员登录记录
        prisma.adminLoginHistory.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      ])

      // 计算增长率
      const userGrowth = lastMonthUsers > 0 
        ? ((monthUsers - lastMonthUsers) / lastMonthUsers * 100)
        : monthUsers > 0 ? 100 : 0

      const noteGrowth = lastMonthNotes > 0 
        ? ((monthNotes - lastMonthNotes) / lastMonthNotes * 100)
        : monthNotes > 0 ? 100 : 0

      // 获取过去7天的每日统计
      const dailyStats = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
        
        const [dailyUsers, dailyNotes] = await Promise.all([
          prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          }),
          prisma.note.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          })
        ])

        dailyStats.push({
          date: date.toISOString().split('T')[0],
          users: dailyUsers,
          notes: dailyNotes
        })
      }

      const dashboardData = {
        stats: {
          totalUsers,
          totalNotes,
          totalAdmins,
          activeUsers,
          todayUsers,
          todayNotes,
          monthUsers,
          monthNotes,
          userGrowth: Math.round(userGrowth * 10) / 10,
          noteGrowth: Math.round(noteGrowth * 10) / 10
        },
        charts: {
          dailyStats
        },
        recent: {
          users: recentUsers,
          notes: recentNotes,
          adminLogins: recentAdminLogins
        }
      }

      return NextResponse.json(dashboardData)

    } catch (error) {
      console.error('获取仪表板数据失败:', error)
      return NextResponse.json(
        { error: '获取仪表板数据失败' },
        { status: 500 }
      )
    }
  })
}
