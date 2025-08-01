import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // 获取维护模式设置
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'site_maintenance_mode' }
    })

    const maintenanceMode = setting?.value === 'true'

    return NextResponse.json({ 
      maintenanceMode,
      message: maintenanceMode ? '系统正在维护中' : '系统正常运行'
    })
  } catch (error) {
    console.error('获取维护模式状态失败:', error)
    return NextResponse.json(
      { error: '获取维护模式状态失败' },
      { status: 500 }
    )
  }
}
