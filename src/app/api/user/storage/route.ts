import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// GET - 获取用户存储使用情况
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      // 获取用户基本信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          createdAt: true,
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
          tags: true,
          status: true,
          createdAt: true,
        }
      })

      // 获取用户设置
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
          id: true,
          defaultTags: true,
        }
      })

      // 获取登录历史数量
      const loginHistoryCount = await prisma.loginHistory.count({
        where: { userId }
      })

      // 计算存储使用情况
      const storageStats = calculateStorageUsage(notes, settings, loginHistoryCount)
      
      // 计算账户使用天数
      const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))

      // 构建响应数据
      const storageInfo = {
        // 存储使用情况（以 KB 为单位）
        used: storageStats.totalSize,
        total: 10240, // 10MB 限制
        usagePercentage: Math.min((storageStats.totalSize / 10240) * 100, 100),
        
        // 数据统计
        statistics: {
          totalNotes: notes.length,
          scheduledNotes: notes.filter(note => note.status === 'scheduled').length,
          publishedNotes: notes.filter(note => note.status === 'published').length,
          draftNotes: notes.filter(note => note.status === 'draft').length,
          totalCharacters: storageStats.totalCharacters,
          averageNoteSize: notes.length > 0 ? Math.round(storageStats.totalCharacters / notes.length) : 0,
          uniqueTags: storageStats.uniqueTags,
          loginHistoryRecords: loginHistoryCount,
          accountAge: accountAge,
        },
        
        // 存储分解
        breakdown: {
          notes: {
            size: storageStats.notesSize,
            percentage: storageStats.totalSize > 0 ? (storageStats.notesSize / storageStats.totalSize) * 100 : 0,
            count: notes.length,
          },
          settings: {
            size: storageStats.settingsSize,
            percentage: storageStats.totalSize > 0 ? (storageStats.settingsSize / storageStats.totalSize) * 100 : 0,
            count: settings ? 1 : 0,
          },
          loginHistory: {
            size: storageStats.loginHistorySize,
            percentage: storageStats.totalSize > 0 ? (storageStats.loginHistorySize / storageStats.totalSize) * 100 : 0,
            count: loginHistoryCount,
          },
        },
        
        // 最近活动
        recentActivity: {
          lastNoteCreated: notes.length > 0 ? 
            notes.reduce((latest, note) => 
              note.createdAt > latest.createdAt ? note : latest
            ).createdAt : null,
          notesThisMonth: notes.filter(note => {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return note.createdAt > monthAgo
          }).length,
        }
      }

      return NextResponse.json(storageInfo)

    } catch (error) {
      console.error('获取存储信息失败:', error)
      return NextResponse.json(
        { error: '获取存储信息失败' },
        { status: 500 }
      )
    }
  })
}

// 计算存储使用情况的辅助函数
function calculateStorageUsage(notes: any[], settings: any, loginHistoryCount: number) {
  // 计算便签存储大小
  let notesSize = 0
  let totalCharacters = 0
  const allTags = new Set<string>()

  notes.forEach(note => {
    const noteContent = (note.title || '') + (note.content || '')
    const noteSize = Buffer.byteLength(noteContent, 'utf8')
    notesSize += noteSize
    totalCharacters += noteContent.length
    
    // 收集标签
    if (note.tags && Array.isArray(note.tags)) {
      note.tags.forEach((tag: string) => allTags.add(tag))
    }
  })

  // 计算设置存储大小
  let settingsSize = 0
  if (settings) {
    const settingsContent = JSON.stringify(settings)
    settingsSize = Buffer.byteLength(settingsContent, 'utf8')
  }

  // 估算登录历史存储大小（每条记录约 200 字节）
  const loginHistorySize = loginHistoryCount * 200

  // 转换为 KB
  const totalSize = Math.ceil((notesSize + settingsSize + loginHistorySize) / 1024)

  return {
    totalSize,
    notesSize: Math.ceil(notesSize / 1024),
    settingsSize: Math.ceil(settingsSize / 1024),
    loginHistorySize: Math.ceil(loginHistorySize / 1024),
    totalCharacters,
    uniqueTags: allTags.size,
  }
}
