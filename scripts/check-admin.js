const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    // 查找管理员账户
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (!admin) {
      console.log('管理员账户不存在')
      return
    }

    console.log('管理员账户信息:')
    console.log('ID:', admin.id)
    console.log('邮箱:', admin.email)
    console.log('姓名:', admin.name)
    console.log('角色:', admin.role)
    console.log('状态:', admin.isActive ? '激活' : '未激活')
    console.log('密码哈希:', admin.password.substring(0, 20) + '...')
    console.log('创建时间:', admin.createdAt)

    // 测试密码验证
    const testPassword = 'admin123456'
    const isValid = await bcrypt.compare(testPassword, admin.password)
    console.log('密码验证测试:', isValid ? '通过' : '失败')

  } catch (error) {
    console.error('检查管理员账户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
