import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { id: idParam } = await params
      const userId = parseInt(idParam)

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: '无效的用户ID' },
          { status: 400 }
        )
      }

      // 获取用户详细信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
          loginHistory: {
            orderBy: { createdAt: 'desc' },
            take: 20, // 最近20条登录记录
          },
          _count: {
            select: {
              notes: true,
              loginHistory: true,
            }
          }
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      // 获取用户的便签统计
      const noteStats = await prisma.note.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true
        }
      })

      // 计算存储使用情况
      const notes = await prisma.note.findMany({
        where: { userId },
        select: {
          content: true,
          title: true,
        }
      })

      const storageUsed = notes.reduce((total, note) => {
        const contentSize = note.content ? new Blob([note.content]).size : 0
        const titleSize = new Blob([note.title]).size
        return total + contentSize + titleSize
      }, 0)

      return NextResponse.json({
        user: {
          ...user,
          password: undefined, // 不返回密码
        },
        stats: {
          noteStats: noteStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.status
            return acc
          }, {} as Record<string, number>),
          storageUsed,
          totalLoginAttempts: user._count.loginHistory,
        }
      })

    } catch (error) {
      console.error('获取用户详情失败:', error)
      return NextResponse.json(
        { error: '获取用户详情失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新用户权限状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { id: idParam } = await params
      const userId = parseInt(idParam)

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: '无效的用户ID' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const { action, ...data } = body

      switch (action) {
        case 'ban':
          return await banUser(userId, data)
        case 'unban':
          return await unbanUser(userId)
        case 'set_observation':
          return await setObservationMode(userId, data.enabled)
        case 'ban_ip':
          return await banUserIp(userId, data.ipAddress)
        case 'unban_ip':
          return await unbanUserIp(userId, data.ipAddress)
        default:
          return NextResponse.json(
            { error: '无效的操作类型' },
            { status: 400 }
          )
      }

    } catch (error) {
      console.error('更新用户权限失败:', error)
      return NextResponse.json(
        { error: '更新用户权限失败' },
        { status: 500 }
      )
    }
  })
}

// 封禁用户
async function banUser(userId: number, data: { duration?: string, reason?: string, permanent?: boolean }) {
  const { duration, reason, permanent } = data

  let bannedUntil: Date | null = null
  if (!permanent && duration) {
    const now = new Date()
    switch (duration) {
      case '1h':
        bannedUntil = new Date(now.getTime() + 60 * 60 * 1000)
        break
      case '1d':
        bannedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case '7d':
        bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        bannedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (data.customDate) {
          bannedUntil = new Date(data.customDate)
        }
        break
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'banned',
      bannedUntil,
      bannedReason: reason || '违反平台规定',
    },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      bannedUntil: true,
      bannedReason: true,
    }
  })

  return NextResponse.json({
    message: '用户已被封禁',
    user: updatedUser
  })
}

// 解封用户
async function unbanUser(userId: number) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'active',
      bannedUntil: null,
      bannedReason: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    }
  })

  return NextResponse.json({
    message: '用户已解封',
    user: updatedUser
  })
}

// 设置观察模式
async function setObservationMode(userId: number, enabled: boolean) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: enabled ? 'under_observation' : 'active',
    },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    }
  })

  return NextResponse.json({
    message: enabled ? '用户已设为观察模式' : '用户已退出观察模式',
    user: updatedUser
  })
}

// 封禁用户IP
async function banUserIp(userId: number, ipAddress: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedIps: true }
  })

  if (!user) {
    return NextResponse.json(
      { error: '用户不存在' },
      { status: 404 }
    )
  }

  const bannedIps = user.bannedIps || []
  if (!bannedIps.includes(ipAddress)) {
    bannedIps.push(ipAddress)
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { bannedIps },
    select: {
      id: true,
      email: true,
      name: true,
      bannedIps: true,
    }
  })

  return NextResponse.json({
    message: 'IP地址已封禁',
    user: updatedUser
  })
}

// 解封用户IP
async function unbanUserIp(userId: number, ipAddress: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedIps: true }
  })

  if (!user) {
    return NextResponse.json(
      { error: '用户不存在' },
      { status: 404 }
    )
  }

  const bannedIps = (user.bannedIps || []).filter(ip => ip !== ipAddress)

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { bannedIps },
    select: {
      id: true,
      email: true,
      name: true,
      bannedIps: true,
    }
  })

  return NextResponse.json({
    message: 'IP地址已解封',
    user: updatedUser
  })
}
