// 简单的内存验证码存储
// 在生产环境中，建议使用 Redis 或其他持久化存储

interface CaptchaData {
  text: string
  expires: number
}

class CaptchaStore {
  private store: Map<string, CaptchaData> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 每分钟清理一次过期的验证码
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  // 存储验证码
  set(sessionId: string, text: string, ttl: number = 5 * 60 * 1000): void {
    const expires = Date.now() + ttl
    this.store.set(sessionId, { text: text.toLowerCase(), expires })
  }

  // 获取验证码
  get(sessionId: string): string | null {
    const data = this.store.get(sessionId)
    if (!data) {
      return null
    }

    if (Date.now() > data.expires) {
      this.store.delete(sessionId)
      return null
    }

    return data.text
  }

  // 验证并删除验证码（一次性使用）
  verify(sessionId: string, inputText: string): boolean {
    const storedText = this.get(sessionId)
    if (!storedText) {
      return false
    }

    // 删除已使用的验证码
    this.store.delete(sessionId)

    // 不区分大小写比较
    return storedText === inputText.toLowerCase()
  }

  // 删除验证码
  delete(sessionId: string): void {
    this.store.delete(sessionId)
  }

  // 清理过期的验证码
  private cleanup(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.store.entries()) {
      if (now > data.expires) {
        this.store.delete(sessionId)
      }
    }
  }

  // 获取存储统计信息
  getStats(): { total: number; expired: number } {
    const now = Date.now()
    let expired = 0
    
    for (const data of this.store.values()) {
      if (now > data.expires) {
        expired++
      }
    }

    return {
      total: this.store.size,
      expired
    }
  }

  // 生成验证码和SVG
  generateCaptcha(): { sessionId: string; captchaSvg: string } {
    const sessionId = generateSessionId()
    const captchaText = this.generateRandomText()

    // 存储验证码
    this.set(sessionId, captchaText)

    // 生成SVG
    const captchaSvg = this.generateSvg(captchaText)

    return { sessionId, captchaSvg }
  }

  // 验证验证码
  verifyCaptcha(sessionId: string, inputText: string): boolean {
    return this.verify(sessionId, inputText)
  }

  // 删除验证码
  deleteCaptcha(sessionId: string): void {
    this.delete(sessionId)
  }

  // 生成随机验证码文本
  private generateRandomText(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 生成简单的SVG验证码
  private generateSvg(text: string): string {
    const width = 120
    const height = 40
    const fontSize = 18

    // 生成随机颜色
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    const bgColor = '#F8F9FA'

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`
    svg += `<rect width="100%" height="100%" fill="${bgColor}"/>`

    // 添加干扰线
    for (let i = 0; i < 3; i++) {
      const x1 = Math.random() * width
      const y1 = Math.random() * height
      const x2 = Math.random() * width
      const y2 = Math.random() * height
      const color = colors[Math.floor(Math.random() * colors.length)]
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.3"/>`
    }

    // 添加文字
    for (let i = 0; i < text.length; i++) {
      const x = 20 + i * 20 + Math.random() * 10 - 5
      const y = 25 + Math.random() * 6 - 3
      const rotation = Math.random() * 30 - 15
      const color = colors[Math.floor(Math.random() * colors.length)]

      svg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" transform="rotate(${rotation} ${x} ${y})">${text[i]}</text>`
    }

    // 添加干扰点
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const color = colors[Math.floor(Math.random() * colors.length)]
      svg += `<circle cx="${x}" cy="${y}" r="1" fill="${color}" opacity="0.5"/>`
    }

    svg += '</svg>'

    // 在服务器端使用 Buffer，在客户端使用 btoa
    if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
    } else {
      return `data:image/svg+xml;base64,${btoa(svg)}`
    }
  }

  // 清理资源
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// 全局单例实例
export const captchaStore = new CaptchaStore()

// 生成随机会话ID
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
