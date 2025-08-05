const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// 创建 Next.js 应用
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// 协作管理辅助函数
async function checkCollaborationEnabled(noteId = null) {
  try {
    const settings = await prisma.collaborationSettings.findFirst({
      where: { noteId: null }, // 全局设置
      select: {
        isGloballyEnabled: true,
        globalDisabledUntil: true
      }
    })

    if (!settings) return true // 默认启用

    // 检查全局开关
    if (!settings.isGloballyEnabled) return false

    // 检查定时禁用
    if (settings.globalDisabledUntil && new Date(settings.globalDisabledUntil) > new Date()) {
      return false
    }

    return true
  } catch (error) {
    console.error('检查协作状态失败:', error)
    return true // 出错时默认允许
  }
}

async function checkNoteAccessPermission(userId, noteId) {
  try {
    const parsedNoteId = parseInt(noteId)
    const parsedUserId = parseInt(userId)

    // 检查是否是便签所有者
    const note = await prisma.note.findFirst({
      where: {
        id: parsedNoteId,
        userId: parsedUserId
      }
    })

    if (note) {
      return true // 所有者有权限
    }

    // 检查是否是协作者
    const collaborator = await prisma.noteCollaborator.findFirst({
      where: {
        noteId: parsedNoteId,
        userId: parsedUserId
      }
    })

    if (collaborator) {
      return true // 协作者有权限
    }

    // 检查是否有已接受的邀请
    const acceptedInvitation = await prisma.noteInvitation.findFirst({
      where: {
        noteId: parsedNoteId,
        receiverId: parsedUserId,
        status: 'accepted'
      }
    })

    if (acceptedInvitation) {
      return true // 已接受邀请者有权限
    }

    return false // 无权限
  } catch (error) {
    console.error('检查便签访问权限失败:', error)
    return false // 出错时默认拒绝
  }
}

async function recordCollaborationSession(socket, noteId) {
  try {
    await prisma.collaborationSession.create({
      data: {
        noteId: parseInt(noteId),
        userId: parseInt(socket.userId),
        socketId: socket.id,
        joinedAt: new Date(),
        lastActivity: new Date(),
        isActive: true
      }
    })
  } catch (error) {
    console.error('记录协作会话失败:', error)
  }
}

async function updateCollaborationActivity(socket) {
  try {
    await prisma.collaborationSession.updateMany({
      where: {
        socketId: socket.id,
        isActive: true
      },
      data: {
        lastActivity: new Date(),
        operationsCount: {
          increment: 1
        }
      }
    })
  } catch (error) {
    console.error('更新协作活动失败:', error)
  }
}

async function leaveCollaborationRoom(socket) {
  try {
    if (socket.currentRoom) {
      const roomId = socket.currentRoom

      // 离开房间
      socket.leave(roomId)

      // 获取房间内剩余用户列表并发送更新
      const roomSockets = await io.in(roomId).fetchSockets()

      // 对用户进行去重处理（同一个用户可能有多个Socket连接）
      const userMap = new Map()
      roomSockets.forEach(s => {
        if (!userMap.has(s.userId)) {
          userMap.set(s.userId, {
            id: s.userId,
            name: s.user.name,
            email: s.user.email,
            socketId: s.id, // 使用第一个Socket ID
            noteId: s.currentNoteId
          })
        }
      })

      const roomUsers = Array.from(userMap.values())

      // 发送更新的用户列表给房间内剩余用户（统一使用room:users事件）
      io.to(roomId).emit('room:users', roomUsers)

      console.log(`用户 ${socket.user?.name || socket.id} 离开房间 ${roomId}，剩余用户数: ${roomUsers.length}，Socket数: ${roomSockets.length}`)

      // 更新数据库记录
      await prisma.collaborationSession.updateMany({
        where: {
          socketId: socket.id,
          isActive: true
        },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      })
    }
  } catch (error) {
    console.error('离开协作房间失败:', error)
  }
}

app.prepare().then(() => {
  // 创建 HTTP 服务器
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // 创建 Socket.IO 服务器
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: dev ? ['http://localhost:3000'] : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // 设置全局io实例，供API路由使用
  global.io = io

  // Socket.IO 认证中间件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      // 验证 NextAuth JWT token
      console.log('Socket authentication:', { token: token.substring(0, 20) + '...' })

      try {
        // 解码NextAuth JWT token
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
        const userId = parseInt(decoded.id)

        if (isNaN(userId)) {
          throw new Error('Invalid user ID in token')
        }

        // 从数据库获取用户信息
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        })

        if (!user) {
          throw new Error('User not found')
        }

        // 设置socket用户信息
        socket.userId = user.id
        socket.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }

        console.log(`用户认证成功: ${user.name} (ID: ${user.id})`)
      } catch (jwtError) {
        console.error('JWT验证失败:', jwtError)
        throw new Error('Invalid token')
      }
      
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  // Socket.IO 连接处理
  io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.user?.name || socket.id}`)

    // 处理加入房间
    socket.on('room:join', async (noteId) => {
      try {
        // 检查协作功能是否启用
        const collaborationEnabled = await checkCollaborationEnabled(noteId)
        if (!collaborationEnabled) {
          socket.emit('room:error', '协作功能已被管理员禁用')
          return
        }

        // 检查用户是否有权限访问该便签
        const hasPermission = await checkNoteAccessPermission(socket.userId, noteId)
        if (!hasPermission) {
          socket.emit('room:error', '您没有权限访问此便签')
          return
        }

        const roomId = `note:${noteId}`

        // 离开之前的房间
        if (socket.currentRoom) {
          await leaveCollaborationRoom(socket)
        }

        // 加入新房间
        socket.join(roomId)
        socket.currentRoom = roomId
        socket.currentNoteId = noteId

        // 记录协作会话到数据库
        await recordCollaborationSession(socket, noteId)

        // 获取房间内所有用户列表
        const roomSockets = await io.in(roomId).fetchSockets()

        // 对用户进行去重处理（同一个用户可能有多个Socket连接）
        const userMap = new Map()
        roomSockets.forEach(s => {
          if (!userMap.has(s.userId)) {
            userMap.set(s.userId, {
              id: s.userId,
              name: s.user.name,
              email: s.user.email,
              socketId: s.id, // 使用第一个Socket ID
              noteId: noteId
            })
          }
        })

        const roomUsers = Array.from(userMap.values())

        // 发送完整的房间用户列表给所有用户（统一使用room:users事件）
        io.to(roomId).emit('room:users', roomUsers)

        console.log(`用户 ${socket.user.name} 加入房间 ${roomId}，当前用户数: ${roomUsers.length}，Socket数: ${roomSockets.length}`)

        // 发送文档同步（模拟）
        socket.emit('document:sync', '这是测试文档内容', 1)

        console.log(`用户 ${socket.user.name} 加入房间 ${roomId}`)
      } catch (error) {
        console.error('加入房间失败:', error)
        socket.emit('room:error', '加入房间失败')
      }
    })

    // 处理离开房间
    socket.on('room:leave', async (noteId) => {
      const roomId = `note:${noteId}`

      if (socket.currentRoom === roomId) {
        await leaveCollaborationRoom(socket)
        socket.currentRoom = null
        socket.currentNoteId = null
      }
    })

    // 处理文档操作
    socket.on('document:operation', async (operation) => {
      if (!socket.currentRoom) {
        return
      }

      console.log('收到文档操作:', operation)

      // 更新协作活动
      await updateCollaborationActivity(socket)

      // 广播操作到房间内其他用户
      socket.to(socket.currentRoom).emit('document:operation', {
        ...operation,
        userId: socket.userId,
        timestamp: Date.now()
      })
    })

    // 处理光标位置更新
    socket.on('document:cursor', (cursor) => {
      if (!socket.currentRoom) return

      // 广播光标位置到房间内其他用户
      socket.to(socket.currentRoom).emit('user:cursor', {
        userId: socket.userId,
        cursor
      })
    })

    // 处理文档保存
    socket.on('document:save', async (content) => {
      if (!socket.currentNoteId) return

      try {
        console.log(`保存文档 ${socket.currentNoteId}:`, content.substring(0, 50))
        
        // 这里应该保存到数据库
        // 为了演示，我们只是广播保存成功事件
        
        // 通知房间内所有用户文档已保存
        io.to(socket.currentRoom).emit('document:saved', new Date().toISOString())
        
        console.log(`文档 ${socket.currentNoteId} 已保存`)
      } catch (error) {
        console.error('保存文档失败:', error)
        socket.emit('room:error', '保存失败')
      }
    })

    // 处理用户正在输入状态
    socket.on('user:typing', (isTyping) => {
      if (!socket.currentRoom) return
      
      socket.to(socket.currentRoom).emit('user:typing', {
        userId: socket.userId,
        isTyping
      })
    })

    // 管理员专用事件：强制断开协作会话
    socket.on('admin:disconnect-session', async (sessionId) => {
      // 这里应该验证管理员权限
      try {
        // 查找并断开指定会话
        const session = await prisma.collaborationSession.findUnique({
          where: { id: sessionId }
        })

        if (session && session.socketId) {
          const targetSocket = io.sockets.sockets.get(session.socketId)
          if (targetSocket) {
            targetSocket.emit('admin:force-disconnect', '管理员强制断开了您的协作连接')
            targetSocket.disconnect(true)
          }

          // 更新数据库记录
          await prisma.collaborationSession.update({
            where: { id: sessionId },
            data: {
              isActive: false,
              leftAt: new Date()
            }
          })
        }
      } catch (error) {
        console.error('管理员断开会话失败:', error)
      }
    })

    // 管理员专用事件：广播协作状态变更
    socket.on('admin:broadcast-collaboration-status', async (data) => {
      // 这里应该验证管理员权限
      try {
        if (!data.enabled) {
          // 协作被禁用，断开所有协作连接
          const activeSessions = await prisma.collaborationSession.findMany({
            where: { isActive: true }
          })

          for (const session of activeSessions) {
            const targetSocket = io.sockets.sockets.get(session.socketId)
            if (targetSocket) {
              targetSocket.emit('collaboration:disabled', {
                reason: data.reason || '协作功能已被管理员禁用',
                until: data.until
              })
              if (targetSocket.currentRoom) {
                await leaveCollaborationRoom(targetSocket)
              }
            }
          }

          console.log('管理员禁用了协作功能，已断开所有协作连接')
        } else {
          // 协作被启用，广播给所有用户
          io.emit('collaboration:enabled', '协作功能已恢复')
          console.log('管理员启用了协作功能')
        }
      } catch (error) {
        console.error('广播协作状态变更失败:', error)
      }
    })

    // 处理断开连接
    socket.on('disconnect', async (reason) => {
      console.log(`用户断开连接: ${socket.user?.name || socket.id}, 原因: ${reason}`)

      if (socket.currentRoom) {
        await leaveCollaborationRoom(socket)
      }
    })
  })

  // 启动服务器
  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.IO server running on path: /api/socket`)
    })
})
