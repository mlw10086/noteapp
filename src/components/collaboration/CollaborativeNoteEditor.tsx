'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Users,
  Wifi,
  WifiOff,
  Save,
  Share2,
  Eye,
  Edit3,
  Code,
  FileText
} from 'lucide-react'
import { SocketManager, ConnectionStatus, ConnectedUser } from '@/lib/socket/client'
import { Operation, OperationalTransform } from '@/lib/socket/ot'
import { useToast, ToastContainer } from '@/components/Toast'
import { MarkdownEditor } from '@/components/MarkdownEditor'

interface Note {
  id: number
  title: string
  content: string
  color: string
  tags: string[]
  status: string
  userId: number
  createdAt: string
  updatedAt: string
}

interface CollaborativeNoteEditorProps {
  note: Note
  onSave: (note: Partial<Note>) => Promise<void>
  onClose: () => void
  isReadOnly?: boolean
}

export function CollaborativeNoteEditor({ 
  note, 
  onSave, 
  onClose, 
  isReadOnly = false 
}: CollaborativeNoteEditorProps) {
  const { data: session } = useSession()
  const { toasts, toast, removeToast } = useToast()
  
  // 编辑器状态
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)

  // 当 note prop 更新时，同步更新本地状态
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.title, note.content])

  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 检测内容是否包含 Markdown 语法
  const isMarkdownContent = (content: string) => {
    const markdownPatterns = [
      /^#{1,6}\s/m,           // 标题
      /\*\*.*\*\*/,           // 粗体
      /\*.*\*/,               // 斜体
      /`.*`/,                 // 行内代码
      /```[\s\S]*```/,        // 代码块
      /^\s*[-*+]\s/m,         // 无序列表
      /^\s*\d+\.\s/m,         // 有序列表
      /\[.*\]\(.*\)/,         // 链接
      /!\[.*\]\(.*\)/,        // 图片
      /^\s*>\s/m,             // 引用
    ]
    return markdownPatterns.some(pattern => pattern.test(content))
  }

  // 初始化时检测是否为 Markdown 内容
  useEffect(() => {
    setIsMarkdownMode(isMarkdownContent(note.content))
  }, [note.content])
  
  // 协作状态
  const [socketManager, setSocketManager] = useState<SocketManager | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  
  // 编辑器引用
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const lastSyncedContent = useRef(content)
  const lastSyncedTitle = useRef(title)

  // 防抖保存
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRequestRef = useRef<string | null>(null)
  
  // 获取协作状态
  const fetchCollaborationStatus = async () => {
    try {
      const response = await fetch(`/api/notes/${note.id}/collaboration`)
      if (response.ok) {
        const data = await response.json()
        setIsCollaborationEnabled(data.collaborationEnabled)
        setIsOwner(data.isOwner)
      }
    } catch (error) {
      console.error('获取协作状态失败:', error)
    }
  }

  // 初始化协作管理器
  useEffect(() => {
    if (!session?.user || isReadOnly) return

    // 首先获取协作状态
    fetchCollaborationStatus()
    
    const manager = new SocketManager({
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status)
        if (status === ConnectionStatus.CONNECTED) {
          toast.success("协作连接成功", "现在可以与其他用户实时协作")
        } else if (status === ConnectionStatus.ERROR) {
          toast.error("协作连接失败", "将以离线模式继续编辑")
        }
      },
      onUserJoined: (user) => {
        // 只显示通知，不更新用户列表（由onRoomUsers统一处理）
        toast.default("用户加入", `${user.name} 加入了协作`)
      },
      onUserLeft: (userId) => {
        // 只显示通知，不更新用户列表（由onRoomUsers统一处理）
        const user = connectedUsers.find(u => u.id === userId)
        if (user) {
          toast.default("用户离开", `${user.name} 离开了协作`)
        }
      },
      onRoomUsers: (users) => {
        console.log('收到房间用户列表:', users.map(u => u.name))
        setConnectedUsers(users)
      },
      onDocumentOperation: (operation) => {
        applyRemoteOperation(operation)
      },
      onDocumentSync: (syncContent, version) => {
        // 同步远程内容
        if (syncContent !== content) {
          setContent(syncContent)
          lastSyncedContent.current = syncContent
          if (contentRef.current) {
            contentRef.current.value = syncContent
          }
        }
      },
      onDocumentSaved: (timestamp) => {
        toast.success("文档已保存", "所有更改已同步")
        setHasUnsavedChanges(false)
      },
      onRoomError: (error) => {
        toast.error("协作错误", error)
      },
      onCollaborationStatusChange: (enabled) => {
        console.log('收到协作状态变化:', enabled)
        setIsCollaborationEnabled(enabled)
        if (!enabled) {
          // 协作被禁用，断开连接
          if (socketManager) {
            socketManager.leaveCurrentRoom()
            socketManager.disconnect()
            setConnectedUsers([])
          }
          toast.default("协作已被禁用", "便签所有者已关闭协作功能")
        } else {
          toast.success("协作已启用", "便签所有者已开启协作功能")
        }
      }
    })
    
    setSocketManager(manager)
    
    return () => {
      manager.destroy()
    }
  }, [session, isReadOnly])

  // 监听协作状态变化，自动连接逻辑
  useEffect(() => {
    if (!socketManager || isReadOnly) return

    // 如果协作已启用且当前未连接，则自动连接
    if (isCollaborationEnabled && connectionStatus === ConnectionStatus.DISCONNECTED) {
      const autoConnect = async () => {
        try {
          console.log(`${isOwner ? '所有者' : '被邀请者'}自动连接到协作房间`)
          const connected = await socketManager.connect()
          if (connected) {
            await socketManager.joinNoteRoom(note.id)
            console.log(`${isOwner ? '所有者' : '被邀请者'}成功连接到协作房间`)
          }
        } catch (error) {
          console.error('自动连接协作失败:', error)
        }
      }

      autoConnect()
    }
  }, [socketManager, isCollaborationEnabled, connectionStatus, isOwner, isReadOnly, note.id])

  // 启用协作
  const enableCollaboration = async () => {
    if (!socketManager || isReadOnly || !isOwner) return

    try {
      // 调用API启用协作
      const response = await fetch(`/api/notes/${note.id}/collaboration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: true }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsCollaborationEnabled(data.collaborationEnabled)

        // 确保WebSocket连接并加入房间
        console.log('所有者启用协作，当前连接状态:', connectionStatus)

        // 如果未连接，先连接
        if (connectionStatus === ConnectionStatus.DISCONNECTED) {
          const connected = await socketManager.connect()
          if (connected) {
            await socketManager.joinNoteRoom(note.id)
            toast.success("协作已启用", "其他用户现在可以加入编辑")
          } else {
            toast.error("连接失败", "无法建立协作连接")
          }
        } else if (connectionStatus === ConnectionStatus.CONNECTED) {
          // 如果已连接，直接加入房间
          await socketManager.joinNoteRoom(note.id)
          toast.success("协作已启用", "其他用户现在可以加入编辑")
        } else {
          toast.error("连接状态异常", "请稍后重试")
        }
      } else {
        throw new Error('启用协作失败')
      }
    } catch (error) {
      console.error('启用协作失败:', error)
      toast.error("启用协作失败", "请稍后重试")
    }
  }

  // 禁用协作
  const disableCollaboration = async () => {
    if (!socketManager || !isOwner) return

    try {
      // 调用API禁用协作
      const response = await fetch(`/api/notes/${note.id}/collaboration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: false }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsCollaborationEnabled(data.collaborationEnabled)

        // 断开WebSocket连接
        socketManager.leaveCurrentRoom()
        socketManager.disconnect()
        setConnectedUsers([])
        toast.default("协作已禁用", "切换到单人编辑模式")
      } else {
        throw new Error('禁用协作失败')
      }
    } catch (error) {
      toast.error("禁用协作失败", "请稍后重试")
    }
  }
  
  // 应用远程操作
  const applyRemoteOperation = (operation: Operation) => {
    if (!contentRef.current) return
    
    const textarea = contentRef.current
    const currentContent = textarea.value
    
    try {
      let newContent = currentContent
      
      if (operation.type === 'insert' && operation.content) {
        newContent = currentContent.slice(0, operation.position) + 
                   operation.content + 
                   currentContent.slice(operation.position)
      } else if (operation.type === 'delete' && operation.length) {
        newContent = currentContent.slice(0, operation.position) + 
                   currentContent.slice(operation.position + operation.length)
      }
      
      // 保存光标位置
      const cursorPosition = textarea.selectionStart
      
      // 更新内容
      setContent(newContent)
      textarea.value = newContent
      lastSyncedContent.current = newContent
      
      // 恢复光标位置（需要调整）
      let newCursorPosition = cursorPosition
      if (operation.position <= cursorPosition) {
        if (operation.type === 'insert' && operation.content) {
          newCursorPosition += operation.content.length
        } else if (operation.type === 'delete' && operation.length) {
          newCursorPosition = Math.max(operation.position, cursorPosition - operation.length)
        }
      }
      
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      }, 0)
      
    } catch (error) {
      console.error('应用远程操作失败:', error)
    }
  }
  
  // 发送本地操作
  const sendLocalOperation = (operation: Operation) => {
    if (socketManager && isCollaborationEnabled) {
      socketManager.sendOperation(operation)
    }
  }
  
  // 处理内容变更（支持 Textarea 和 Markdown 编辑器）
  const handleContentChange = (newContent: string | React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = typeof newContent === 'string' ? newContent : newContent.target.value
    const oldContent = lastSyncedContent.current

    // 计算差异并创建操作
    if (content !== oldContent) {
      // 简化的差异检测
      if (content.length > oldContent.length) {
        // 插入操作
        const insertPos = findInsertPosition(oldContent, content)
        const insertedText = content.slice(insertPos, insertPos + (content.length - oldContent.length))

        const operation = OperationalTransform.createInsertOperation(
          insertPos,
          insertedText,
          session?.user?.id?.toString() || 'unknown'
        )

        sendLocalOperation(operation)
      } else if (content.length < oldContent.length) {
        // 删除操作
        const deletePos = findDeletePosition(oldContent, content)
        const deleteLength = oldContent.length - content.length

        const operation = OperationalTransform.createDeleteOperation(
          deletePos,
          deleteLength,
          session?.user?.id?.toString() || 'unknown'
        )

        sendLocalOperation(operation)
      }
    }

    setContent(content)
    lastSyncedContent.current = content
    setHasUnsavedChanges(true)

    // 防抖保存 - 只在不是正在保存时设置
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (!isSaving) {
      saveTimeoutRef.current = setTimeout(() => {
        // 再次检查是否正在保存，避免重复调用
        if (!isSaving) {
          handleSave(false)
        }
      }, 2000)
    }
  }
  
  // 简化的插入位置检测
  const findInsertPosition = (oldText: string, newText: string): number => {
    for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
      if (oldText[i] !== newText[i]) {
        return i
      }
    }
    return oldText.length
  }
  
  // 简化的删除位置检测
  const findDeletePosition = (oldText: string, newText: string): number => {
    for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
      if (oldText[i] !== newText[i]) {
        return i
      }
    }
    return newText.length
  }
  
  // 处理标题变更
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setHasUnsavedChanges(true)
  }
  
  // 保存便签
  const handleSave = async (isManualSave = false) => {
    if (isSaving) return

    // 生成唯一的保存请求ID，防止重复保存
    const saveRequestId = `${Date.now()}-${Math.random()}`
    const currentContent = `${title}|${content}`

    // 检查是否与上次保存的内容相同
    if (lastSaveRequestRef.current === currentContent) {
      console.log('内容未变化，跳过保存')
      return
    }

    // 如果是手动保存，清除防抖定时器
    if (isManualSave && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }

    console.log(`开始保存 (${isManualSave ? '手动' : '自动'}):`, saveRequestId)

    setIsSaving(true)
    lastSaveRequestRef.current = currentContent

    try {
      await onSave({
        title,
        content
      })

      // 通知协作用户文档已保存
      if (socketManager && isCollaborationEnabled) {
        socketManager.saveDocument(content)
      }

      setHasUnsavedChanges(false)
      toast.success("保存成功", "便签已更新")
      console.log(`保存成功:`, saveRequestId)
    } catch (error) {
      console.error(`保存失败:`, saveRequestId, error)
      // 保存失败时重置标识符，允许重试
      lastSaveRequestRef.current = null
      toast.error("保存失败", "请稍后重试")
    } finally {
      setIsSaving(false)
    }
  }
  
  // 获取连接状态图标
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return <Wifi className="h-4 w-4 text-green-500" />
      case ConnectionStatus.CONNECTING:
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 协作工具栏 */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isReadOnly ? '查看便签' : '编辑便签'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* 连接状态 */}
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="text-sm text-muted-foreground">
                  {connectionStatus === ConnectionStatus.CONNECTED ? '已连接' : 
                   connectionStatus === ConnectionStatus.CONNECTING ? '连接中' : '离线'}
                </span>
              </div>
              
              {/* 协作控制 - 仅所有者可见 */}
              {isOwner && (
                <>
                  {!isCollaborationEnabled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={enableCollaboration}
                      disabled={connectionStatus === ConnectionStatus.CONNECTING}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      启用协作
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={disableCollaboration}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      禁用协作
                    </Button>
                  )}
                </>
              )}

              {/* 协作状态显示 - 被邀请者可见 */}
              {!isOwner && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isCollaborationEnabled ? (
                    <>
                      <Share2 className="h-4 w-4 text-green-500" />
                      <span>协作已启用</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span>仅查看模式</span>
                    </>
                  )}
                </div>
              )}
              
              {/* 保存按钮 - 根据协作状态和用户权限显示 */}
              {(isOwner || (!isOwner && isCollaborationEnabled)) && !isReadOnly && (
                <Button
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              )}
            </div>
          </div>
          
          {/* 在线用户 */}
          {connectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">协作用户:</span>
              <div className="flex items-center gap-1">
                {connectedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant="secondary" className="text-xs">
                      {user.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>
      
      {/* 编辑器 */}
      <div className="flex-1 space-y-4">
        {/* 标题 */}
        <Input
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="便签标题..."
          className="text-lg font-medium"
          readOnly={isReadOnly || (!isOwner && !isCollaborationEnabled)}
        />
        
        {/* 内容编辑器 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">内容</label>
            {!isReadOnly && (isOwner || isCollaborationEnabled) && (
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={isMarkdownMode}
                  onCheckedChange={setIsMarkdownMode}
                  id="markdown-mode"
                />
                <Label htmlFor="markdown-mode" className="text-sm">
                  <Code className="h-4 w-4 inline mr-1" />
                  Markdown
                </Label>
              </div>
            )}
          </div>

          {isMarkdownMode ? (
            <div className="markdown-editor-wrapper border rounded-lg overflow-hidden">
              <MarkdownEditor
                value={content}
                onChange={handleContentChange}
                placeholder="使用 Markdown 语法编写你的便签..."
                height={400}
                readOnly={isReadOnly || (!isOwner && !isCollaborationEnabled)}
              />
            </div>
          ) : (
            <Textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              placeholder="开始编写你的便签..."
              className="flex-1 min-h-[400px] resize-none"
              readOnly={isReadOnly || (!isOwner && !isCollaborationEnabled)}
            />
          )}
        </div>
      </div>
      
      {/* 状态栏 */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>字数: {content.length}</span>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              <Edit3 className="h-3 w-3 mr-1" />
              未保存
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>最后更新: {note.updatedAt ? new Date(note.updatedAt).toLocaleString('zh-CN') : '未知'}</span>
        </div>
      </div>
      
      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
