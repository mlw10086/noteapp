const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // 检查管理员是否已存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (existingAdmin) {
      console.log('管理员账户已存在:', existingAdmin.email)
      return
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash('admin123456', 12)

    // 创建管理员账户
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@example.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      }
    })

    console.log('管理员账户创建成功!')
    console.log('邮箱:', admin.email)
    console.log('姓名:', admin.name)
    console.log('角色:', admin.role)
    console.log('状态:', admin.isActive ? '激活' : '未激活')
    console.log('创建时间:', admin.createdAt)

  } catch (error) {
    console.error('创建管理员账户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
