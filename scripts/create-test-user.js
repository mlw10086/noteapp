const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // 检查是否已存在测试用户
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('测试用户已存在')
      return
    }

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: '测试用户',
        status: 'active'
      }
    })

    console.log('测试用户创建成功:')
    console.log('邮箱: test@example.com')
    console.log('密码: test123')
    console.log('姓名: 测试用户')
    console.log('状态: 正常')
    
  } catch (error) {
    console.error('创建测试用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
