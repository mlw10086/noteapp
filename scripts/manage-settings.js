#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function listSettings() {
  const settings = await prisma.siteSettings.findMany({
    orderBy: [
      { category: 'asc' },
      { key: 'asc' }
    ]
  })
  
  console.log('\n📋 当前站点设置:')
  console.log('=' .repeat(80))
  
  let currentCategory = ''
  settings.forEach((setting, index) => {
    if (setting.category !== currentCategory) {
      currentCategory = setting.category
      console.log(`\n📁 ${currentCategory.toUpperCase()}`)
      console.log('-'.repeat(40))
    }
    
    const publicIcon = setting.isPublic ? '🌐' : '🔒'
    const typeIcon = setting.type === 'boolean' ? '☑️' : setting.type === 'number' ? '🔢' : '📝'
    
    console.log(`${index + 1}. ${publicIcon} ${typeIcon} ${setting.key}`)
    console.log(`   值: ${setting.value}`)
    console.log(`   描述: ${setting.description || '无描述'}`)
    if (setting.updatedBy) {
      console.log(`   更新者: ${setting.updatedBy} (${setting.updatedAt.toLocaleString('zh-CN')})`)
    }
    console.log()
  })
}

async function updateSetting() {
  const key = await question('请输入要更新的设置键名: ')
  
  const setting = await prisma.siteSettings.findUnique({
    where: { key }
  })
  
  if (!setting) {
    console.log('❌ 设置不存在!')
    return
  }
  
  console.log(`\n当前设置信息:`)
  console.log(`键名: ${setting.key}`)
  console.log(`当前值: ${setting.value}`)
  console.log(`类型: ${setting.type}`)
  console.log(`描述: ${setting.description}`)
  
  const newValue = await question('请输入新值 (留空保持不变): ')
  const updatedBy = await question('请输入更新者邮箱: ')
  
  if (newValue.trim()) {
    await prisma.siteSettings.update({
      where: { key },
      data: {
        value: newValue.trim(),
        updatedBy: updatedBy.trim() || 'admin'
      }
    })
    console.log('✅ 设置更新成功!')
  } else {
    console.log('⏭️ 未进行更新')
  }
}

async function createSetting() {
  console.log('\n📝 创建新设置:')
  
  const key = await question('设置键名: ')
  const value = await question('设置值: ')
  const description = await question('描述: ')
  const type = await question('类型 (string/boolean/number/json) [string]: ') || 'string'
  const category = await question('分类 (general/features/security/maintenance) [general]: ') || 'general'
  const isPublicInput = await question('是否公开 (y/n) [n]: ')
  const updatedBy = await question('创建者邮箱: ')
  
  const isPublic = isPublicInput.toLowerCase() === 'y'
  
  try {
    await prisma.siteSettings.create({
      data: {
        key,
        value,
        description,
        type,
        category,
        isPublic,
        updatedBy: updatedBy || 'admin'
      }
    })
    console.log('✅ 设置创建成功!')
  } catch (error) {
    console.log('❌ 创建失败:', error.message)
  }
}

async function deleteSetting() {
  const key = await question('请输入要删除的设置键名: ')
  
  const setting = await prisma.siteSettings.findUnique({
    where: { key }
  })
  
  if (!setting) {
    console.log('❌ 设置不存在!')
    return
  }
  
  console.log(`\n要删除的设置:`)
  console.log(`键名: ${setting.key}`)
  console.log(`值: ${setting.value}`)
  console.log(`描述: ${setting.description}`)
  
  const confirm = await question('确认删除? (y/N): ')
  
  if (confirm.toLowerCase() === 'y') {
    await prisma.siteSettings.delete({
      where: { key }
    })
    console.log('✅ 设置删除成功!')
  } else {
    console.log('⏭️ 取消删除')
  }
}

async function main() {
  console.log('🔧 站点设置管理工具')
  console.log('=' .repeat(40))
  
  while (true) {
    console.log('\n请选择操作:')
    console.log('1. 查看所有设置')
    console.log('2. 更新设置')
    console.log('3. 创建设置')
    console.log('4. 删除设置')
    console.log('5. 退出')
    
    const choice = await question('\n请输入选项 (1-5): ')
    
    try {
      switch (choice) {
        case '1':
          await listSettings()
          break
        case '2':
          await updateSetting()
          break
        case '3':
          await createSetting()
          break
        case '4':
          await deleteSetting()
          break
        case '5':
          console.log('👋 再见!')
          rl.close()
          await prisma.$disconnect()
          return
        default:
          console.log('❌ 无效选项，请重新选择')
      }
    } catch (error) {
      console.log('❌ 操作失败:', error.message)
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { listSettings, updateSetting, createSetting, deleteSetting }
