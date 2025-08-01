import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化管理员系统...')

  // 创建默认管理员账户
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123456' // 请在生产环境中修改
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: '系统管理员',
      role: 'super_admin',
      isActive: true,
    },
  })

  console.log(`✅ 创建管理员账户: ${admin.email}`)

  // 创建基础站点设置
  const defaultSettings = [
    {
      key: 'site_registration_enabled',
      value: 'true',
      description: '是否允许用户注册',
      type: 'boolean',
      category: 'security',
      isPublic: true,
    },
    {
      key: 'site_maintenance_mode',
      value: 'false',
      description: '维护模式开关',
      type: 'boolean',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'site_maintenance_message',
      value: '系统正在维护中，请稍后再试。',
      description: '维护模式显示的消息',
      type: 'string',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'site_name',
      value: '便签应用',
      description: '站点名称',
      type: 'string',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'max_notes_per_user',
      value: '1000',
      description: '每个用户最大便签数量',
      type: 'number',
      category: 'features',
      isPublic: false,
    },
    {
      key: 'max_file_size_mb',
      value: '10',
      description: '最大文件上传大小(MB)',
      type: 'number',
      category: 'features',
      isPublic: false,
    },
  ]

  for (const setting of defaultSettings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        ...setting,
        updatedBy: adminEmail,
      },
    })
  }

  console.log('✅ 创建基础站点设置')

  // 创建示例公告
  const announcement = await prisma.announcement.create({
    data: {
      title: '欢迎使用便签应用！',
      content: `# 欢迎使用便签应用！

这是一个功能强大的便签管理系统，您可以：

- 📝 创建和编辑便签
- 🏷️ 使用标签组织便签
- ⏰ 设置定时发布
- 🎨 自定义便签颜色
- 📱 响应式设计，支持移动端

如果您有任何问题或建议，请联系管理员。

祝您使用愉快！`,
      type: 'info',
      priority: 1,
      isActive: true,
      createdBy: admin.id,
    },
  })

  console.log(`✅ 创建示例公告: ${announcement.title}`)

  console.log('\n🎉 管理员系统初始化完成！')
  console.log(`📧 管理员邮箱: ${adminEmail}`)
  console.log(`🔑 管理员密码: ${adminPassword}`)
  console.log('⚠️  请在生产环境中修改默认密码！')
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
