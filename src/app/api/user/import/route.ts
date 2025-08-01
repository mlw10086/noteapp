import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// POST - 导入用户数据
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { error: '请选择要导入的文件' },
          { status: 400 }
        )
      }

      // 验证文件类型
      if (!file.name.endsWith('.json')) {
        return NextResponse.json(
          { error: '只支持 JSON 格式的文件' },
          { status: 400 }
        )
      }

      // 验证文件大小（限制为 10MB）
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '文件大小不能超过 10MB' },
          { status: 400 }
        )
      }

      // 读取文件内容
      const fileContent = await file.text()
      let importData: any

      try {
        importData = JSON.parse(fileContent)
      } catch (error) {
        return NextResponse.json(
          { error: '文件格式错误，请确保是有效的 JSON 文件' },
          { status: 400 }
        )
      }

      // 验证导入数据结构
      const validationResult = validateImportData(importData)
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: validationResult.error },
          { status: 400 }
        )
      }

      // 开始导入数据
      const importResult = await importUserData(userId, importData)

      return NextResponse.json({
        message: '数据导入成功',
        imported: importResult
      })

    } catch (error) {
      console.error('导入数据失败:', error)
      return NextResponse.json(
        { error: '导入数据失败，请稍后重试' },
        { status: 500 }
      )
    }
  })
}

// 验证导入数据结构
function validateImportData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '数据格式错误' }
  }

  // 检查必要的字段
  if (!data.exportInfo || !data.exportInfo.version) {
    return { valid: false, error: '缺少导出信息，请确保是从本系统导出的数据' }
  }

  // 检查版本兼容性
  if (data.exportInfo.version !== "1.0") {
    return { valid: false, error: '数据版本不兼容，请使用最新版本导出的数据' }
  }

  // 检查便签数据格式
  if (data.notes && !Array.isArray(data.notes)) {
    return { valid: false, error: '便签数据格式错误' }
  }

  return { valid: true }
}

// 导入用户数据
async function importUserData(userId: number, importData: any) {
  const result = {
    notes: 0,
    settings: 0,
    skipped: 0,
  }

  await prisma.$transaction(async (tx) => {
    // 导入便签数据
    if (importData.notes && Array.isArray(importData.notes)) {
      for (const noteData of importData.notes) {
        try {
          // 验证便签数据
          if (!noteData.title && !noteData.content) {
            result.skipped++
            continue
          }

          // 创建便签
          await tx.note.create({
            data: {
              userId,
              title: noteData.title || '无标题',
              content: noteData.content || '',
              color: noteData.color || '#ffffff',
              tags: Array.isArray(noteData.tags) ? noteData.tags : [],
              status: ['draft', 'published', 'scheduled'].includes(noteData.status) 
                ? noteData.status 
                : 'draft',
              publishAt: noteData.publishAt ? new Date(noteData.publishAt) : null,
            }
          })
          result.notes++
        } catch (error) {
          console.error('导入便签失败:', error)
          result.skipped++
        }
      }
    }

    // 导入设置数据（仅更新，不覆盖现有设置）
    if (importData.settings && typeof importData.settings === 'object') {
      try {
        const settingsData = importData.settings
        
        // 只导入安全的设置项
        const safeSettings: any = {}
        
        if (typeof settingsData.theme === 'string') {
          safeSettings.theme = settingsData.theme
        }
        if (typeof settingsData.language === 'string') {
          safeSettings.language = settingsData.language
        }
        if (typeof settingsData.timezone === 'string') {
          safeSettings.timezone = settingsData.timezone
        }
        if (typeof settingsData.dateFormat === 'string') {
          safeSettings.dateFormat = settingsData.dateFormat
        }
        if (typeof settingsData.defaultColor === 'string') {
          safeSettings.defaultColor = settingsData.defaultColor
        }
        if (typeof settingsData.fontSize === 'number') {
          safeSettings.fontSize = settingsData.fontSize
        }
        if (Array.isArray(settingsData.defaultTags)) {
          safeSettings.defaultTags = settingsData.defaultTags
        }

        if (Object.keys(safeSettings).length > 0) {
          await tx.userSettings.upsert({
            where: { userId },
            update: safeSettings,
            create: {
              userId,
              ...safeSettings,
            }
          })
          result.settings = 1
        }
      } catch (error) {
        console.error('导入设置失败:', error)
      }
    }
  })

  return result
}
