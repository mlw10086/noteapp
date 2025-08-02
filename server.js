const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// 创建 Next.js 应用
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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

  // Socket.IO 认证中间件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      // 这里应该验证 JWT token
      // 为了简化演示，我们暂时跳过验证
      console.log('Socket authentication:', { token: token.substring(0, 20) + '...' })
      
      // 模拟用户信息
      socket.userId = 'test-user-1'
      socket.user = {
        id: 'test-user-1',
        name: '测试用户',
        email: 'test@example.com'
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
        const roomId = `note:${noteId}`
        
        // 离开之前的房间
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom)
          socket.to(socket.currentRoom).emit('user:left', socket.userId)
        }

        // 加入新房间
        socket.join(roomId)
        socket.currentRoom = roomId
        socket.currentNoteId = noteId

        // 通知房间内其他用户
        const connectedUser = {
          id: socket.userId,
          name: socket.user.name,
          email: socket.user.email,
          socketId: socket.id,
          noteId: noteId
        }

        socket.to(roomId).emit('user:joined', connectedUser)

        // 发送当前房间用户列表（简化版）
        socket.emit('room:users', [connectedUser])

        // 发送文档同步（模拟）
        socket.emit('document:sync', '这是测试文档内容', 1)

        console.log(`用户 ${socket.user.name} 加入房间 ${roomId}`)
      } catch (error) {
        console.error('加入房间失败:', error)
        socket.emit('room:error', '加入房间失败')
      }
    })

    // 处理离开房间
    socket.on('room:leave', (noteId) => {
      const roomId = `note:${noteId}`
      socket.leave(roomId)
      
      if (socket.currentRoom === roomId) {
        socket.to(roomId).emit('user:left', socket.userId)
        socket.currentRoom = null
        socket.currentNoteId = null
      }
    })

    // 处理文档操作
    socket.on('document:operation', (operation) => {
      if (!socket.currentRoom) {
        return
      }

      console.log('收到文档操作:', operation)
      
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

    // 处理断开连接
    socket.on('disconnect', (reason) => {
      console.log(`用户断开连接: ${socket.user?.name || socket.id}, 原因: ${reason}`)
      
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user:left', socket.userId)
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
