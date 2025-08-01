import { prisma } from '@/lib/prisma'

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'site_maintenance_mode' }
    })
    return setting?.value === 'true'
  } catch (error) {
    console.error('检查维护模式失败:', error)
    return false
  }
}

export async function isRegistrationEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'site_registration_enabled' }
    })
    return setting?.value !== 'false' // 默认允许注册
  } catch (error) {
    console.error('检查注册开关失败:', error)
    return true // 默认允许注册
  }
}
