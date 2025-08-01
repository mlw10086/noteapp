import { prisma } from "@/lib/prisma"

// 记录登录历史（最多保留20条记录）
export async function recordLoginHistory(
  userId: number,
  success: boolean = true,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // 使用传入的参数或默认值
    const clientIp = ipAddress || '127.0.0.1'
    const clientUserAgent = userAgent || 'Unknown Browser'
    const location = getLocationFromIP(clientIp)

    // 使用事务来确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 添加新的登录记录
      await tx.loginHistory.create({
        data: {
          userId,
          ipAddress: clientIp,
          userAgent: clientUserAgent,
          location,
          success,
        }
      })

      // 2. 如果登录成功，更新用户的最后登录IP
      if (success) {
        await tx.user.update({
          where: { id: userId },
          data: { lastIpAddress: clientIp }
        })
      }

      // 3. 检查该用户的登录历史记录数量
      const totalRecords = await tx.loginHistory.count({
        where: { userId }
      })

      // 4. 如果超过20条，删除最旧的记录
      if (totalRecords > 20) {
        const recordsToDelete = totalRecords - 20

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

          console.log(`已删除用户 ${userId} 的 ${recordsToDelete} 条旧的登录记录`)
        }
      }
    })

    console.log(`登录历史已记录: 用户 ${userId}, IP: ${clientIp}, 成功: ${success}`)
  } catch (error) {
    console.error('记录登录历史失败:', error)
  }
}

// 简单的IP地址地理位置获取函数
function getLocationFromIP(ipAddress: string): string {
  // 在开发环境中，我们使用默认值
  if (ipAddress === '127.0.0.1' || ipAddress === 'localhost' || ipAddress === '::1') {
    return '本地开发环境'
  }

  // 在生产环境中，你可以集成第三方IP地理位置服务
  // 例如：ipapi.co, ipinfo.io, geoip-lite 等
  return '未知位置'
}

// 获取客户端 IP 地址（简化版本）
function getClientIP(): string {
  // 在开发环境中返回本地 IP
  return '127.0.0.1'
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
