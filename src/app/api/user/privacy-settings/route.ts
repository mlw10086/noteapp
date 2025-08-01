import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth-middleware"

// GET - 获取用户隐私设置
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      let settings = await prisma.userSettings.findUnique({
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
        }
      })

      // 如果用户没有设置记录，创建默认设置
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: {
            userId,
            dataCollection: true,
            analyticsTracking: false,
            shareUsageData: false,
            emailNotifications: true,
            scheduledReminders: true,
            systemMessages: true,
            reminderFrequency: "daily",
            theme: "system",
            language: "zh-CN",
            timezone: "Asia/Shanghai",
            dateFormat: "YYYY-MM-DD",
            autoSave: true,
            defaultColor: "#ffffff",
            fontSize: 14,
            autoSaveInterval: 30,
            defaultTags: ["工作", "个人"],
          },
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
          }
        })
      }

      return NextResponse.json(settings)
    } catch (error) {
      console.error('获取隐私设置失败:', error)
      return NextResponse.json(
        { error: '获取隐私设置失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新用户隐私设置
export async function PUT(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      
      // 验证输入数据
      const allowedFields = [
        'dataCollection', 'analyticsTracking', 'shareUsageData',
        'emailNotifications', 'scheduledReminders', 'systemMessages', 'reminderFrequency',
        'theme', 'language', 'timezone', 'dateFormat', 'autoSave',
        'defaultColor', 'fontSize', 'autoSaveInterval', 'defaultTags'
      ]

      const updateData: any = {}
      for (const [key, value] of Object.entries(body)) {
        if (allowedFields.includes(key)) {
          updateData[key] = value
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: '没有有效的更新字段' },
          { status: 400 }
        )
      }

      // 更新或创建设置
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData,
        },
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
        }
      })

      return NextResponse.json({
        message: '隐私设置更新成功',
        settings
      })
    } catch (error) {
      console.error('更新隐私设置失败:', error)
      return NextResponse.json(
        { error: '更新隐私设置失败' },
        { status: 500 }
      )
    }
  })
}
