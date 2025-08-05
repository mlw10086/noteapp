import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/admin-middleware"

// GET - 获取协作设置
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      // 获取全局协作设置
      const globalSettings = await prisma.collaborationSettings.findFirst({
        where: { noteId: null }, // 全局设置
        select: {
          isGloballyEnabled: true,
          globalDisabledUntil: true,
          globalDisabledReason: true,
          maxCollaborators: true,
          allowAnonymous: true,
          requireApproval: true,
          updatedAt: true
        }
      })

      // 如果没有全局设置，返回默认值
      if (!globalSettings) {
        return NextResponse.json({
          isGloballyEnabled: true,
          globalDisabledUntil: null,
          globalDisabledReason: null,
          maxCollaborators: 10,
          allowAnonymous: false,
          requireApproval: false,
          updatedAt: new Date().toISOString()
        })
      }

      return NextResponse.json(globalSettings)
    } catch (error) {
      console.error('获取协作设置失败:', error)
      return NextResponse.json(
        { error: '获取协作设置失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新协作设置
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const body = await request.json()
      const {
        isGloballyEnabled,
        globalDisabledUntil,
        globalDisabledReason,
        maxCollaborators,
        allowAnonymous,
        requireApproval
      } = body

      // 验证输入
      if (typeof isGloballyEnabled !== 'boolean') {
        return NextResponse.json(
          { error: '无效的全局启用状态' },
          { status: 400 }
        )
      }

      if (maxCollaborators && (maxCollaborators < 1 || maxCollaborators > 50)) {
        return NextResponse.json(
          { error: '最大协作者数量必须在1-50之间' },
          { status: 400 }
        )
      }

      // 更新或创建全局协作设置
      const settings = await prisma.collaborationSettings.upsert({
        where: { noteId: null },
        update: {
          isGloballyEnabled,
          globalDisabledUntil: globalDisabledUntil ? new Date(globalDisabledUntil) : null,
          globalDisabledReason,
          maxCollaborators: maxCollaborators || 10,
          allowAnonymous: allowAnonymous || false,
          requireApproval: requireApproval || false,
          updatedBy: adminId
        },
        create: {
          noteId: null, // 全局设置
          isGloballyEnabled,
          globalDisabledUntil: globalDisabledUntil ? new Date(globalDisabledUntil) : null,
          globalDisabledReason,
          maxCollaborators: maxCollaborators || 10,
          allowAnonymous: allowAnonymous || false,
          requireApproval: requireApproval || false,
          updatedBy: adminId
        }
      })

      // 如果禁用了协作功能，需要通知 Socket.IO 服务器断开所有协作连接
      if (!isGloballyEnabled) {
        // 这里可以添加通知 Socket.IO 服务器的逻辑
        // 例如通过 Redis 发布消息或直接调用 Socket.IO 的方法
        console.log('协作功能已被管理员禁用，应断开所有协作连接')
      }

      return NextResponse.json({
        message: '协作设置更新成功',
        settings
      })
    } catch (error) {
      console.error('更新协作设置失败:', error)
      return NextResponse.json(
        { error: '更新协作设置失败' },
        { status: 500 }
      )
    }
  })
}
