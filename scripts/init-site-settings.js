const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const defaultSettings = [
  // 基础设置
  {
    key: 'site_name',
    value: 'Notes App',
    description: '站点名称',
    type: 'string',
    category: 'general',
    isPublic: true
  },
  {
    key: 'site_description',
    value: '一个简单易用的便签应用',
    description: '站点描述',
    type: 'string',
    category: 'general',
    isPublic: true
  },
  {
    key: 'site_logo',
    value: '',
    description: '站点Logo URL',
    type: 'string',
    category: 'general',
    isPublic: true
  },
  {
    key: 'site_favicon',
    value: '/favicon.ico',
    description: '站点图标 URL',
    type: 'string',
    category: 'general',
    isPublic: true
  },
  {
    key: 'contact_email',
    value: 'admin@example.com',
    description: '联系邮箱',
    type: 'string',
    category: 'general',
    isPublic: true
  },
  
  // 功能设置
  {
    key: 'allow_registration',
    value: 'true',
    description: '允许用户注册',
    type: 'boolean',
    category: 'features',
    isPublic: false
  },
  {
    key: 'require_email_verification',
    value: 'false',
    description: '需要邮箱验证',
    type: 'boolean',
    category: 'features',
    isPublic: false
  },
  {
    key: 'max_notes_per_user',
    value: '1000',
    description: '每个用户最大便签数量',
    type: 'number',
    category: 'features',
    isPublic: false
  },
  {
    key: 'max_file_size',
    value: '10485760',
    description: '最大文件上传大小（字节）',
    type: 'number',
    category: 'features',
    isPublic: false
  },
  {
    key: 'enable_collaboration',
    value: 'true',
    description: '启用协作功能',
    type: 'boolean',
    category: 'features',
    isPublic: false
  },
  
  // 安全设置
  {
    key: 'session_timeout',
    value: '86400',
    description: '会话超时时间（秒）',
    type: 'number',
    category: 'security',
    isPublic: false
  },
  {
    key: 'max_login_attempts',
    value: '5',
    description: '最大登录尝试次数',
    type: 'number',
    category: 'security',
    isPublic: false
  },
  {
    key: 'lockout_duration',
    value: '900',
    description: '账户锁定时长（秒）',
    type: 'number',
    category: 'security',
    isPublic: false
  },
  {
    key: 'password_min_length',
    value: '8',
    description: '密码最小长度',
    type: 'number',
    category: 'security',
    isPublic: false
  },
  {
    key: 'require_strong_password',
    value: 'true',
    description: '需要强密码',
    type: 'boolean',
    category: 'security',
    isPublic: false
  },
  
  // 维护设置
  {
    key: 'maintenance_mode',
    value: 'false',
    description: '维护模式',
    type: 'boolean',
    category: 'maintenance',
    isPublic: true
  },
  {
    key: 'maintenance_message',
    value: '系统正在维护中，请稍后再试。',
    description: '维护模式提示信息',
    type: 'string',
    category: 'maintenance',
    isPublic: true
  }
]

async function initSiteSettings() {
  console.log('开始初始化站点设置...')
  
  try {
    for (const setting of defaultSettings) {
      // 检查设置是否已存在
      const existing = await prisma.siteSettings.findUnique({
        where: { key: setting.key }
      })
      
      if (!existing) {
        await prisma.siteSettings.create({
          data: setting
        })
        console.log(`✅ 创建设置: ${setting.key}`)
      } else {
        console.log(`⏭️  设置已存在: ${setting.key}`)
      }
    }
    
    console.log('✅ 站点设置初始化完成！')
  } catch (error) {
    console.error('❌ 初始化站点设置失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initSiteSettings()
}

module.exports = { initSiteSettings, defaultSettings }
