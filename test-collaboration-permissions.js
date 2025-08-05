// 测试协作权限的脚本
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCollaborationPermissions() {
  try {
    console.log('🧪 开始测试协作权限...')

    // 1. 检查现有数据
    console.log('\n📊 检查现有数据：')
    
    const notes = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        userId: true
      }
    })
    console.log('便签列表:', notes)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    console.log('用户列表:', users)

    const collaborators = await prisma.noteCollaborator.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        note: {
          select: {
            title: true
          }
        }
      }
    })
    console.log('协作者列表:', collaborators)

    // 2. 创建测试协作者（如果不存在）
    console.log('\n👥 创建测试协作者：')
    
    // 假设便签ID为1，用户ID为1是所有者
    const noteId = 1
    const ownerId = 1
    
    // 创建一个测试协作者用户（如果不存在）
    let collaboratorUser = await prisma.user.findFirst({
      where: {
        email: 'collaborator@test.com'
      }
    })

    if (!collaboratorUser) {
      collaboratorUser = await prisma.user.create({
        data: {
          name: '协作测试用户',
          email: 'collaborator@test.com',
          password: 'test123', // 在实际应用中应该加密
          status: 'active'
        }
      })
      console.log('✅ 创建了测试协作者用户:', collaboratorUser)
    } else {
      console.log('✅ 测试协作者用户已存在:', collaboratorUser)
    }

    // 3. 添加协作者权限
    console.log('\n🤝 添加协作权限：')
    
    const existingCollaborator = await prisma.noteCollaborator.findFirst({
      where: {
        noteId: noteId,
        userId: collaboratorUser.id
      }
    })

    if (!existingCollaborator) {
      const newCollaborator = await prisma.noteCollaborator.create({
        data: {
          noteId: noteId,
          userId: collaboratorUser.id,
          permission: 'edit', // 给予编辑权限
          joinedAt: new Date()
        }
      })
      console.log('✅ 创建了协作者记录:', newCollaborator)
    } else {
      console.log('✅ 协作者记录已存在:', existingCollaborator)
    }

    // 4. 测试权限查询
    console.log('\n🔍 测试权限查询：')
    
    // 测试所有者权限
    const ownerNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: ownerId
      }
    })
    console.log('所有者查询结果:', ownerNote ? '✅ 有权限' : '❌ 无权限')

    // 测试协作者权限
    const collaboratorPermission = await prisma.noteCollaborator.findFirst({
      where: {
        noteId: noteId,
        userId: collaboratorUser.id
      }
    })
    console.log('协作者权限查询结果:', collaboratorPermission ? `✅ 有权限 (${collaboratorPermission.permission})` : '❌ 无权限')

    // 5. 模拟API权限检查逻辑
    console.log('\n🔧 模拟API权限检查：')
    
    async function checkUserPermission(userId, noteId) {
      // 检查是否是便签所有者
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          userId: userId
        }
      })

      if (note) {
        return { permission: 'edit', isOwner: true, source: 'owner' }
      }

      // 检查协作者权限
      const collaborator = await prisma.noteCollaborator.findFirst({
        where: {
          noteId: noteId,
          userId: userId
        }
      })

      if (collaborator) {
        return { permission: collaborator.permission, isOwner: false, source: 'collaborator' }
      }

      // 检查邀请权限
      const invitation = await prisma.noteInvitation.findFirst({
        where: {
          noteId: noteId,
          receiverId: userId,
          status: 'accepted'
        }
      })

      if (invitation) {
        return { permission: invitation.permission, isOwner: false, source: 'invitation' }
      }

      return { permission: null, isOwner: false, source: 'none' }
    }

    // 测试所有者权限
    const ownerPermission = await checkUserPermission(ownerId, noteId)
    console.log(`用户 ${ownerId} (所有者) 权限:`, ownerPermission)

    // 测试协作者权限
    const collabPermission = await checkUserPermission(collaboratorUser.id, noteId)
    console.log(`用户 ${collaboratorUser.id} (协作者) 权限:`, collabPermission)

    console.log('\n🎉 权限测试完成！')
    console.log('\n📝 测试结果总结：')
    console.log(`- 便签 ${noteId} 的所有者是用户 ${ownerId}`)
    console.log(`- 用户 ${collaboratorUser.id} (${collaboratorUser.name}) 是协作者，权限: ${collabPermission.permission}`)
    console.log(`- 现在用户 ${collaboratorUser.id} 应该能够编辑便签了！`)

    console.log('\n🔗 测试链接：')
    console.log(`协作页面: http://localhost:3000/notes/${noteId}/collaborate`)
    console.log(`API测试: curl -X GET http://localhost:3000/api/notes/${noteId}`)

  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCollaborationPermissions()
