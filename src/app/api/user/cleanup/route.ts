import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// POST - 清理用户数据
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const cleanupResult = await performDataCleanup(userId)

      return NextResponse.json({
        message: '数据清理完成',
        cleaned: cleanupResult
      })

    } catch (error) {
      console.error('数据清理失败:', error)
      return NextResponse.json(
        { error: '数据清理失败，请稍后重试' },
        { status: 500 }
      )
    }
  })
}

// GET - 获取可清理的数据统计
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const cleanupStats = await getCleanupStats(userId)

      return NextResponse.json({
        cleanupStats,
        estimatedSpaceSaved: calculateEstimatedSpaceSaved(cleanupStats)
      })

    } catch (error) {
      console.error('获取清理统计失败:', error)
      return NextResponse.json(
        { error: '获取清理统计失败' },
        { status: 500 }
      )
    }
  })
}

// 执行数据清理
async function performDataCleanup(userId: number) {
  const result = {
    oldLoginHistory: 0,
    emptyNotes: 0,
    duplicateTags: 0,
    spaceSaved: 0, // KB
  }

  await prisma.$transaction(async (tx) => {
    // 1. 清理旧的登录历史（保留最近 100 条）
    const oldLoginHistory = await tx.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 100, // 跳过最新的 100 条
      select: { id: true }
    })

    if (oldLoginHistory.length > 0) {
      const deleteResult = await tx.loginHistory.deleteMany({
        where: {
          id: { in: oldLoginHistory.map(record => record.id) }
        }
      })
      result.oldLoginHistory = deleteResult.count
      result.spaceSaved += deleteResult.count * 0.2 // 每条记录约 0.2KB
    }

    // 2. 清理空便签（标题和内容都为空的便签）
    const emptyNotes = await tx.note.findMany({
      where: {
        userId,
        AND: [
          {
            OR: [
              { title: { equals: '' } },
              { title: { equals: null } },
            ]
          },
          {
            OR: [
              { content: { equals: '' } },
              { content: { equals: null } },
            ]
          }
        ]
      },
      select: { id: true, title: true, content: true }
    })

    if (emptyNotes.length > 0) {
      const deleteResult = await tx.note.deleteMany({
        where: {
          id: { in: emptyNotes.map(note => note.id) }
        }
      })
      result.emptyNotes = deleteResult.count
      result.spaceSaved += deleteResult.count * 0.1 // 每个空便签约 0.1KB
    }

    // 3. 清理重复标签（在用户设置中）
    const userSettings = await tx.userSettings.findUnique({
      where: { userId },
      select: { id: true, defaultTags: true }
    })

    if (userSettings && userSettings.defaultTags) {
      const uniqueTags = [...new Set(userSettings.defaultTags)]
      const duplicateCount = userSettings.defaultTags.length - uniqueTags.length
      
      if (duplicateCount > 0) {
        await tx.userSettings.update({
          where: { userId },
          data: { defaultTags: uniqueTags }
        })
        result.duplicateTags = duplicateCount
        result.spaceSaved += duplicateCount * 0.01 // 每个重复标签约 0.01KB
      }
    }

    // 4. 优化便签内容（移除多余的空白字符）
    const notesToOptimize = await tx.note.findMany({
      where: { userId },
      select: { id: true, title: true, content: true }
    })

    let optimizedNotes = 0
    for (const note of notesToOptimize) {
      const originalTitle = note.title || ''
      const originalContent = note.content || ''
      
      // 清理多余的空白字符
      const cleanTitle = originalTitle.trim().replace(/\s+/g, ' ')
      const cleanContent = originalContent.trim().replace(/\n\s*\n\s*\n/g, '\n\n')
      
      if (cleanTitle !== originalTitle || cleanContent !== originalContent) {
        await tx.note.update({
          where: { id: note.id },
          data: {
            title: cleanTitle,
            content: cleanContent
          }
        })
        optimizedNotes++
        
        // 计算节省的空间
        const originalSize = Buffer.byteLength(originalTitle + originalContent, 'utf8')
        const cleanSize = Buffer.byteLength(cleanTitle + cleanContent, 'utf8')
        result.spaceSaved += Math.max(0, (originalSize - cleanSize) / 1024)
      }
    }
  })

  // 四舍五入空间节省数值
  result.spaceSaved = Math.round(result.spaceSaved * 100) / 100

  return result
}

// 获取清理统计信息
async function getCleanupStats(userId: number) {
  const [loginHistoryCount, emptyNotesCount, userSettings] = await Promise.all([
    // 获取旧登录历史数量（超过 100 条的部分）
    prisma.loginHistory.count({
      where: { userId }
    }).then(count => Math.max(0, count - 100)),

    // 获取空便签数量
    prisma.note.count({
      where: {
        userId,
        AND: [
          {
            OR: [
              { title: { equals: '' } },
              { title: { equals: null } },
            ]
          },
          {
            OR: [
              { content: { equals: '' } },
              { content: { equals: null } },
            ]
          }
        ]
      }
    }),

    // 获取用户设置中的重复标签
    prisma.userSettings.findUnique({
      where: { userId },
      select: { defaultTags: true }
    })
  ])

  // 计算重复标签数量
  let duplicateTagsCount = 0
  if (userSettings && userSettings.defaultTags) {
    const uniqueTags = new Set(userSettings.defaultTags)
    duplicateTagsCount = userSettings.defaultTags.length - uniqueTags.size
  }

  return {
    oldLoginHistory: loginHistoryCount,
    emptyNotes: emptyNotesCount,
    duplicateTags: duplicateTagsCount,
    hasCleanableData: loginHistoryCount > 0 || emptyNotesCount > 0 || duplicateTagsCount > 0
  }
}

// 计算预估节省空间
function calculateEstimatedSpaceSaved(stats: any): number {
  let estimatedSaved = 0
  
  // 旧登录历史：每条约 0.2KB
  estimatedSaved += stats.oldLoginHistory * 0.2
  
  // 空便签：每个约 0.1KB
  estimatedSaved += stats.emptyNotes * 0.1
  
  // 重复标签：每个约 0.01KB
  estimatedSaved += stats.duplicateTags * 0.01
  
  return Math.round(estimatedSaved * 100) / 100
}
