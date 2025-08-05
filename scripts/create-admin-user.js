const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const email = 'admin@example.com'
    const password = 'admin123456'
    const name = '系统管理员'

    // 检查管理员是否已存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      console.log('管理员账户已存在:', email)
      return
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建管理员账户
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'super_admin',
        isActive: true
      }
    })

    console.log('管理员账户创建成功:')
    console.log('邮箱:', email)
    console.log('密码:', password)
    console.log('角色:', admin.role)
    console.log('ID:', admin.id)

    // 创建默认的协作设置
    await prisma.collaborationSettings.upsert({
      where: { noteId: null },
      update: {},
      create: {
        noteId: null, // 全局设置
        isGloballyEnabled: true,
        maxCollaborators: 10,
        allowAnonymous: false,
        requireApproval: false,
        updatedBy: admin.id
      }
    })

    console.log('默认协作设置已创建')

  } catch (error) {
    console.error('创建管理员账户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
