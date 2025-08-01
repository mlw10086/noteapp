import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - 获取公共站点设置
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        isPublic: true
      },
      select: {
        key: true,
        value: true,
        type: true,
      }
    })

    // 转换为键值对格式
    const settingsMap = settings.reduce((acc, setting) => {
      let value: any = setting.value
      
      // 根据类型转换值
      switch (setting.type) {
        case 'boolean':
          value = setting.value === 'true'
          break
        case 'number':
          value = parseFloat(setting.value)
          break
        case 'json':
          try {
            value = JSON.parse(setting.value)
          } catch {
            value = setting.value
          }
          break
        default:
          value = setting.value
      }
      
      acc[setting.key] = value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(settingsMap)

  } catch (error) {
    console.error('获取公共设置失败:', error)
    return NextResponse.json(
      { error: '获取公共设置失败' },
      { status: 500 }
    )
  }
}
