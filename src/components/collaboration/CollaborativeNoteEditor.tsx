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
  
  // 编辑器引用
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const lastSyncedContent = useRef(content)
  const lastSyncedTitle = useRef(title)
  
  // 防抖保存
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  
  // 初始化协作管理器
  useEffect(() => {
    if (!session?.user || isReadOnly) return
    
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
        setConnectedUsers(prev => [...prev.filter(u => u.id !== user.id), user])
        toast.info("用户加入", `${user.name} 加入了协作`)
      },
      onUserLeft: (userId) => {
        setConnectedUsers(prev => {
          const user = prev.find(u => u.id === userId)
          if (user) {
            toast.info("用户离开", `${user.name} 离开了协作`)
          }
          return prev.filter(u => u.id !== userId)
        })
      },
      onRoomUsers: (users) => {
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
      }
    })
    
    setSocketManager(manager)
    
    return () => {
      manager.destroy()
    }
  }, [session, isReadOnly])
  
  // 启用协作
  const enableCollaboration = async () => {
    if (!socketManager || isReadOnly) return
    
    try {
      const connected = await socketManager.connect()
      if (connected) {
        await socketManager.joinNoteRoom(note.id)
        setIsCollaborationEnabled(true)
        toast.success("协作已启用", "其他用户现在可以加入编辑")
      }
    } catch (error) {
      toast.error("启用协作失败", "请稍后重试")
    }
  }
  
  // 禁用协作
  const disableCollaboration = () => {
    if (socketManager) {
      socketManager.leaveCurrentRoom()
      socketManager.disconnect()
      setIsCollaborationEnabled(false)
      setConnectedUsers([])
      toast.info("协作已禁用", "切换到单人编辑模式")
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

    // 防抖保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 2000)
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
  const handleSave = async () => {
    if (isSaving) return
    
    setIsSaving(true)
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
    } catch (error) {
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
              
              {/* 协作控制 */}
              {!isReadOnly && (
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
              
              {/* 保存按钮 */}
              {!isReadOnly && (
                <Button
                  size="sm"
                  onClick={handleSave}
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
          readOnly={isReadOnly}
        />
        
        {/* 内容编辑器 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">内容</label>
            {!isReadOnly && (
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
                readOnly={isReadOnly}
              />
            </div>
          ) : (
            <Textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              placeholder="开始编写你的便签..."
              className="flex-1 min-h-[400px] resize-none"
              readOnly={isReadOnly}
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
