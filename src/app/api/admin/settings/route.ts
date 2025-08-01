import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - 获取站点设置
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')

      const where = category ? { category } : {}

      const settings = await prisma.siteSettings.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      })

      // 将设置转换为更易用的格式
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = {
          value: setting.value,
          type: setting.type,
          description: setting.description,
          category: setting.category,
          isPublic: setting.isPublic,
          updatedAt: setting.updatedAt,
          updatedBy: setting.updatedBy,
        }
        return acc
      }, {} as Record<string, any>)

      return NextResponse.json({
        settings: settingsMap,
        categories: [...new Set(settings.map(s => s.category))]
      })

    } catch (error) {
      console.error('获取站点设置失败:', error)
      return NextResponse.json(
        { error: '获取站点设置失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新站点设置
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { settings, adminEmail } = await request.json()

      if (!settings || typeof settings !== 'object') {
        return NextResponse.json(
          { error: '无效的设置数据' },
          { status: 400 }
        )
      }

      // 批量更新设置
      const updatePromises = Object.entries(settings).map(([key, value]) => {
        return prisma.siteSettings.upsert({
          where: { key },
          update: {
            value: String(value),
            updatedBy: adminEmail,
          },
          create: {
            key,
            value: String(value),
            type: 'string',
            category: 'general',
            updatedBy: adminEmail,
          }
        })
      })

      await Promise.all(updatePromises)

      return NextResponse.json({ success: true })

    } catch (error) {
      console.error('更新站点设置失败:', error)
      return NextResponse.json(
        { error: '更新站点设置失败' },
        { status: 500 }
      )
    }
  })
}
