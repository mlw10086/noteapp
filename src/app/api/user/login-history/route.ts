import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// GET - 获取用户登录历史
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = (page - 1) * limit

      // 获取登录历史记录
      const [loginHistory, total] = await Promise.all([
        prisma.loginHistory.findMany({
          where: { userId },
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            location: true,
            success: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.loginHistory.count({
          where: { userId }
        })
      ])

      // 处理和格式化数据
      const formattedHistory = loginHistory.map(record => ({
        id: record.id,
        ipAddress: record.ipAddress ? 
          // 脱敏IP地址
          record.ipAddress.split('.').slice(0, 2).join('.') + '.***.***.***' : 
          '未知',
        device: record.userAgent ? 
          // 简化设备信息
          parseUserAgent(record.userAgent) : 
          '未知设备',
        location: record.location || '未知位置',
        success: record.success,
        loginTime: record.createdAt,
        timeAgo: getTimeAgo(record.createdAt),
      }))

      return NextResponse.json({
        history: formattedHistory,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        }
      })

    } catch (error) {
      console.error('获取登录历史失败:', error)
      return NextResponse.json(
        { error: '获取登录历史失败' },
        { status: 500 }
      )
    }
  })
}

// POST - 记录登录历史（由认证系统调用）
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { ipAddress, userAgent, location, success = true } = body

      const loginRecord = await prisma.loginHistory.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          location,
          success,
        }
      })

      return NextResponse.json({
        message: '登录历史记录成功',
        id: loginRecord.id
      })

    } catch (error) {
      console.error('记录登录历史失败:', error)
      return NextResponse.json(
        { error: '记录登录历史失败' },
        { status: 500 }
      )
    }
  })
}

// 解析用户代理字符串，提取设备和浏览器信息
function parseUserAgent(userAgent: string): string {
  try {
    // 简单的用户代理解析
    if (userAgent.includes('Chrome')) {
      if (userAgent.includes('Mobile')) {
        return 'Chrome 移动端'
      }
      return 'Chrome 桌面端'
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox 浏览器'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      if (userAgent.includes('Mobile')) {
        return 'Safari 移动端'
      }
      return 'Safari 桌面端'
    } else if (userAgent.includes('Edge')) {
      return 'Edge 浏览器'
    } else {
      return '其他浏览器'
    }
  } catch (error) {
    return '未知设备'
  }
}

// 计算时间差
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
