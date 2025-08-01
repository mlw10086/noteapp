import { prisma } from "@/lib/prisma"

// 记录登录历史（最多保留3条记录）
export async function recordLoginHistory(userId: number, success: boolean = true) {
  try {
    // 在服务器端环境中，我们无法直接获取客户端信息
    // 这里使用默认值，实际项目中可以通过其他方式获取
    const ipAddress = '127.0.0.1' // 开发环境默认IP
    const userAgent = 'Unknown Browser' // 默认用户代理
    const location = '本地开发环境'

    // 使用事务来确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 添加新的登录记录
      await tx.loginHistory.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          location,
          success,
        }
      })

      // 2. 检查该用户的登录历史记录数量
      const totalRecords = await tx.loginHistory.count({
        where: { userId }
      })

      // 3. 如果超过3条，删除最旧的记录
      if (totalRecords > 3) {
        const recordsToDelete = totalRecords - 3

        // 获取最旧的记录ID
        const oldestRecords = await tx.loginHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          take: recordsToDelete,
          select: { id: true }
        })

        // 删除最旧的记录
        if (oldestRecords.length > 0) {
          await tx.loginHistory.deleteMany({
            where: {
              id: { in: oldestRecords.map(record => record.id) }
            }
          })

          console.log(`已删除 ${recordsToDelete} 条旧的登录记录`)
        }
      }
    })

    console.log(`登录历史已记录: 用户 ${userId}, IP: ${ipAddress}, 成功: ${success}`)
  } catch (error) {
    console.error('记录登录历史失败:', error)
  }
}

// 获取客户端 IP 地址（简化版本）
function getClientIP(): string {
  // 在开发环境中返回本地 IP
  return '127.0.0.1'
}

// 从 IP 地址获取地理位置
async function getLocationFromIP(ipAddress: string | null): Promise<string> {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return '本地开发环境'
  }
  
  // 简单的 IP 地址分类
  if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
    return '内网环境'
  }
  
  // 这里可以集成第三方地理位置服务，如：
  // - ipapi.co
  // - ip-api.com
  // - ipgeolocation.io
  
  try {
    // 示例：使用免费的 IP 地理位置 API
    // const response = await fetch(`http://ip-api.com/json/${ipAddress}`)
    // const data = await response.json()
    // if (data.status === 'success') {
    //   return `${data.city}, ${data.country}`
    // }
    
    // 暂时返回通用位置
    return '未知位置'
  } catch (error) {
    console.error('获取地理位置失败:', error)
    return '未知位置'
  }
}

// 解析用户代理字符串
export function parseUserAgent(userAgent: string): string {
  if (!userAgent) return '未知设备'
  
  try {
    // 检测浏览器
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      if (userAgent.includes('Mobile')) {
        return 'Chrome 移动端'
      }
      return 'Chrome 浏览器'
    } else if (userAgent.includes('Firefox')) {
      if (userAgent.includes('Mobile')) {
        return 'Firefox 移动端'
      }
      return 'Firefox 浏览器'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      if (userAgent.includes('Mobile')) {
        return 'Safari 移动端'
      }
      return 'Safari 浏览器'
    } else if (userAgent.includes('Edg')) {
      return 'Edge 浏览器'
    } else if (userAgent.includes('Opera')) {
      return 'Opera 浏览器'
    }
    
    // 检测操作系统
    if (userAgent.includes('Windows')) {
      return 'Windows 设备'
    } else if (userAgent.includes('Mac')) {
      return 'Mac 设备'
    } else if (userAgent.includes('Linux')) {
      return 'Linux 设备'
    } else if (userAgent.includes('Android')) {
      return 'Android 设备'
    } else if (userAgent.includes('iOS')) {
      return 'iOS 设备'
    }
    
    return '其他设备'
  } catch (error) {
    return '未知设备'
  }
}
