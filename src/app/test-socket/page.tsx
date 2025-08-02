'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SocketManager, ConnectionStatus } from '@/lib/socket/client'
import { ConnectedUser } from '@/lib/socket/server'
import { Operation, OperationalTransform } from '@/lib/socket/ot'

export default function TestSocketPage() {
  const [socketManager, setSocketManager] = useState<SocketManager | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [messages, setMessages] = useState<string[]>([])
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null)

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const manager = new SocketManager({
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status)
        addMessage(`连接状态变更: ${status}`)
      },
      onUserJoined: (user) => {
        addMessage(`用户加入: ${user.name}`)
        setConnectedUsers(prev => [...prev.filter(u => u.id !== user.id), user])
      },
      onUserLeft: (userId) => {
        addMessage(`用户离开: ${userId}`)
        setConnectedUsers(prev => prev.filter(u => u.id !== userId))
      },
      onRoomUsers: (users) => {
        setConnectedUsers(users)
        addMessage(`房间用户列表更新: ${users.length} 人`)
      },
      onDocumentOperation: (operation) => {
        addMessage(`收到文档操作: ${operation.type} at ${operation.position}`)
      },
      onDocumentSync: (content, version) => {
        addMessage(`文档同步: 版本 ${version}, 内容长度 ${content.length}`)
      },
      onDocumentSaved: (timestamp) => {
        addMessage(`文档已保存: ${timestamp}`)
      },
      onRoomError: (error) => {
        addMessage(`房间错误: ${error}`)
      }
    })

    setSocketManager(manager)

    return () => {
      manager.destroy()
    }
  }, [])

  const handleConnect = async () => {
    if (socketManager) {
      try {
        const success = await socketManager.connect()
        if (success) {
          addMessage('Socket.IO 连接成功')
        } else {
          addMessage('Socket.IO 连接失败')
        }
      } catch (error) {
        addMessage(`连接错误: ${error}`)
      }
    }
  }

  const handleDisconnect = () => {
    if (socketManager) {
      socketManager.disconnect()
      addMessage('已断开连接')
      setConnectedUsers([])
      setCurrentNoteId(null)
    }
  }

  const handleJoinRoom = async () => {
    if (socketManager && socketManager.isConnected()) {
      const noteId = 1 // 测试用便签ID
      try {
        await socketManager.joinNoteRoom(noteId)
        setCurrentNoteId(noteId)
        addMessage(`加入便签房间: ${noteId}`)
      } catch (error) {
        addMessage(`加入房间失败: ${error}`)
      }
    } else {
      addMessage('请先连接 Socket.IO')
    }
  }

  const handleLeaveRoom = () => {
    if (socketManager) {
      socketManager.leaveCurrentRoom()
      setCurrentNoteId(null)
      setConnectedUsers([])
      addMessage('离开当前房间')
    }
  }

  const handleSendOperation = () => {
    if (socketManager && currentNoteId) {
      const operation: Operation = OperationalTransform.createInsertOperation(
        0,
        '测试文本插入 ',
        'test-user'
      )
      socketManager.sendOperation(operation)
      addMessage('发送插入操作')
    } else {
      addMessage('请先加入房间')
    }
  }

  const handleSaveDocument = () => {
    if (socketManager && currentNoteId) {
      socketManager.saveDocument('这是测试保存的内容')
      addMessage('保存文档')
    } else {
      addMessage('请先加入房间')
    }
  }

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'bg-green-500'
      case ConnectionStatus.CONNECTING:
        return 'bg-yellow-500'
      case ConnectionStatus.ERROR:
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Socket.IO 实时协作测试</h1>
          <p className="text-muted-foreground">测试 WebSocket 连接和实时协作功能</p>
        </div>

        {/* 连接状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              连接状态
              <Badge className={getStatusColor(connectionStatus)}>
                {connectionStatus}
              </Badge>
            </CardTitle>
            <CardDescription>
              当前 Socket.IO 连接状态和房间信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={handleConnect}
                  disabled={connectionStatus === ConnectionStatus.CONNECTED}
                >
                  连接 Socket.IO
                </Button>
                <Button 
                  onClick={handleDisconnect}
                  variant="outline"
                  disabled={connectionStatus === ConnectionStatus.DISCONNECTED}
                >
                  断开连接
                </Button>
                <Button 
                  onClick={handleJoinRoom}
                  disabled={!socketManager?.isConnected() || currentNoteId !== null}
                >
                  加入测试房间
                </Button>
                <Button 
                  onClick={handleLeaveRoom}
                  variant="outline"
                  disabled={currentNoteId === null}
                >
                  离开房间
                </Button>
              </div>
              
              {currentNoteId && (
                <div className="text-sm text-muted-foreground">
                  当前房间: note:{currentNoteId}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 协作操作 */}
        <Card>
          <CardHeader>
            <CardTitle>协作操作测试</CardTitle>
            <CardDescription>
              测试文档操作和实时同步功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleSendOperation}
                disabled={currentNoteId === null}
              >
                发送插入操作
              </Button>
              <Button 
                onClick={handleSaveDocument}
                disabled={currentNoteId === null}
                variant="outline"
              >
                保存文档
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 在线用户 */}
        <Card>
          <CardHeader>
            <CardTitle>在线用户 ({connectedUsers.length})</CardTitle>
            <CardDescription>
              当前房间内的协作用户
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectedUsers.length > 0 ? (
              <div className="space-y-2">
                {connectedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">({user.email})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">暂无在线用户</div>
            )}
          </CardContent>
        </Card>

        {/* 消息日志 */}
        <Card>
          <CardHeader>
            <CardTitle>消息日志</CardTitle>
            <CardDescription>
              实时事件和操作记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
              {messages.length > 0 ? (
                <div className="space-y-1">
                  {messages.map((message, index) => (
                    <div key={index} className="text-sm font-mono">
                      {message}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">暂无消息</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
