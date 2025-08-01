import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// POST - 导出用户数据
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      // 获取用户基本信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        )
      }

      // 获取用户的所有便签
      const notes = await prisma.note.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          content: true,
          color: true,
          tags: true,
          status: true,
          publishAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' }
      })

      // 获取用户设置
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
          dataCollection: true,
          analyticsTracking: true,
          shareUsageData: true,
          emailNotifications: true,
          scheduledReminders: true,
          systemMessages: true,
          reminderFrequency: true,
          theme: true,
          language: true,
          timezone: true,
          dateFormat: true,
          autoSave: true,
          defaultColor: true,
          fontSize: true,
          autoSaveInterval: true,
          defaultTags: true,
          createdAt: true,
          updatedAt: true,
        }
      })

      // 获取登录历史（最近50条）
      const loginHistory = await prisma.loginHistory.findMany({
        where: { userId },
        select: {
          ipAddress: true,
          userAgent: true,
          location: true,
          success: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      // 构建导出数据
      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          description: "个人便签系统数据导出"
        },
        user: {
          ...user,
          // 移除敏感信息
          id: undefined,
        },
        notes: notes.map(note => ({
          ...note,
          id: undefined, // 移除内部ID
          userId: undefined, // 移除用户ID引用
        })),
        settings: settings ? {
          ...settings,
          userId: undefined, // 移除用户ID引用
        } : null,
        loginHistory: loginHistory.map(history => ({
          ...history,
          // 脱敏IP地址（只保留前两段）
          ipAddress: history.ipAddress ? 
            history.ipAddress.split('.').slice(0, 2).join('.') + '.***.***.***' : 
            null,
          // 简化用户代理信息
          userAgent: history.userAgent ? 
            history.userAgent.split(' ')[0] : 
            null,
        })),
        statistics: {
          totalNotes: notes.length,
          scheduledNotes: notes.filter(note => note.status === 'scheduled').length,
          publishedNotes: notes.filter(note => note.status === 'published').length,
          uniqueTags: [...new Set(notes.flatMap(note => note.tags))].length,
          accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        }
      }

      // 生成文件名
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `notes-export-${timestamp}.json`

      // 返回JSON文件
      const jsonString = JSON.stringify(exportData, null, 2)
      
      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': jsonString.length.toString(),
        },
      })

    } catch (error) {
      console.error('导出用户数据失败:', error)
      return NextResponse.json(
        { error: '导出用户数据失败' },
        { status: 500 }
      )
    }
  })
}
