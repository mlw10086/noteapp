'use client'

import { io, Socket } from 'socket.io-client'
import { getSession } from 'next-auth/react'

// 连接状态枚举
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// 简化的用户接口
export interface ConnectedUser {
  id: string
  name: string
  email: string
  socketId: string
  noteId?: number
}

// 简化的操作接口
export interface Operation {
  type: string
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
}

// 协作事件回调接口
export interface CollaborationCallbacks {
  onUserJoined?: (user: ConnectedUser) => void
  onUserLeft?: (userId: string) => void
  onUserCursor?: (data: { userId: string; cursor: any }) => void
  onDocumentOperation?: (operation: Operation) => void
  onDocumentSync?: (content: string, version: number) => void
  onDocumentSaved?: (timestamp: string) => void
  onRoomUsers?: (users: ConnectedUser[]) => void
  onRoomError?: (error: string) => void
  onConnectionStatusChange?: (status: ConnectionStatus) => void
}

// Socket 连接管理器类
export class SocketManager {
  private socket: Socket | null = null
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED
  private callbacks: CollaborationCallbacks = {}
  private currentNoteId: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(callbacks: CollaborationCallbacks = {}) {
    this.callbacks = callbacks
  }

  /**
   * 连接到 Socket.IO 服务器
   */
  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true
    }

    try {
      this.setConnectionStatus(ConnectionStatus.CONNECTING)

      // 获取认证 token
      const session = await getSession()
      const token = session?.accessToken || 'demo-token-for-testing'

      // 创建 Socket 连接
      this.socket = io({
        path: '/api/socket',
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retries: 3
      })

      // 设置事件监听器
      this.setupEventListeners()

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.socket!.on('connect', () => {
          clearTimeout(timeout)
          this.setConnectionStatus(ConnectionStatus.CONNECTED)
          this.reconnectAttempts = 0
          console.log('Socket.IO 连接成功')
          resolve(true)
        })

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout)
          console.error('Socket.IO 连接失败:', error)
          this.setConnectionStatus(ConnectionStatus.ERROR)
          reject(error)
        })
      })
    } catch (error) {
      console.error('连接 Socket.IO 服务器失败:', error)
      this.setConnectionStatus(ConnectionStatus.ERROR)
      return false
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED)
    this.currentNoteId = null
  }

  /**
   * 加入便签协作房间
   */
  async joinNoteRoom(noteId: number): Promise<void> {
    if (!this.socket?.connected) {
      await this.connect()
    }

    if (this.socket?.connected) {
      this.currentNoteId = noteId
      this.socket.emit('room:join', noteId)
    } else {
      throw new Error('Socket not connected')
    }
  }

  /**
   * 离开当前房间
   */
  leaveCurrentRoom(): void {
    if (this.socket?.connected && this.currentNoteId) {
      this.socket.emit('room:leave', this.currentNoteId)
      this.currentNoteId = null
    }
  }

  /**
   * 发送文档操作
   */
  sendOperation(operation: Operation): void {
    if (this.socket?.connected) {
      this.socket.emit('document:operation', operation)
    }
  }

  /**
   * 发送光标位置更新
   */
  sendCursorUpdate(cursor: any): void {
    if (this.socket?.connected) {
      this.socket.emit('document:cursor', cursor)
    }
  }

  /**
   * 保存文档
   */
  saveDocument(content: string): void {
    if (this.socket?.connected) {
      this.socket.emit('document:save', content)
    }
  }

  /**
   * 发送用户正在输入状态
   */
  sendTypingStatus(isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('user:typing', isTyping)
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * 获取当前便签ID
   */
  getCurrentNoteId(): number | null {
    return this.currentNoteId
  }

  /**
   * 更新回调函数
   */
  updateCallbacks(callbacks: Partial<CollaborationCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * 设置连接状态并触发回调
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.callbacks.onConnectionStatusChange?.(status)
    }
  }

  /**
   * 设置 Socket 事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // 连接事件
    this.socket.on('connect', () => {
      this.setConnectionStatus(ConnectionStatus.CONNECTED)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO 连接断开:', reason)
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED)
      
      // 自动重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，不自动重连
        return
      }
      
      this.attemptReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO 连接错误:', error)
      this.setConnectionStatus(ConnectionStatus.ERROR)
      this.attemptReconnect()
    })

    // 协作事件
    this.socket.on('user:joined', (user) => {
      console.log('用户加入:', user.name)
      this.callbacks.onUserJoined?.(user)
    })

    this.socket.on('user:left', (userId) => {
      console.log('用户离开:', userId)
      this.callbacks.onUserLeft?.(userId)
    })

    this.socket.on('user:cursor', (data) => {
      this.callbacks.onUserCursor?.(data)
    })

    this.socket.on('document:operation', (operation) => {
      this.callbacks.onDocumentOperation?.(operation)
    })

    this.socket.on('document:sync', (content, version) => {
      console.log('文档同步:', { contentLength: content.length, version })
      this.callbacks.onDocumentSync?.(content, version)
    })

    this.socket.on('document:saved', (timestamp) => {
      console.log('文档已保存:', timestamp)
      this.callbacks.onDocumentSaved?.(timestamp)
    })

    this.socket.on('room:users', (users) => {
      console.log('房间用户列表:', users.map((u: any) => u.name))
      this.callbacks.onRoomUsers?.(users)
    })

    this.socket.on('room:error', (error) => {
      console.error('房间错误:', error)
      this.callbacks.onRoomError?.(error)
    })
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`)
    
    setTimeout(() => {
      if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
        this.connect().catch(error => {
          console.error('重连失败:', error)
        })
      }
    }, delay)
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.disconnect()
    this.callbacks = {}
  }
}
