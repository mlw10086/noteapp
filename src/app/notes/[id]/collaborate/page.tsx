'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AuthGuard } from '@/components/AuthGuard'
import { CollaborativeNoteEditor } from '@/components/collaboration/CollaborativeNoteEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, AlertCircle, Users, UserPlus } from 'lucide-react'
import { useToast, ToastContainer } from '@/components/Toast'
// import { InviteCollaboratorDialog } from '@/components/collaboration/InviteCollaboratorDialog'

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

export default function CollaborateNotePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toasts, toast, removeToast } = useToast()
  
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [hasEditPermission, setHasEditPermission] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  
  const noteId = params.id as string
  
  // 获取便签数据
  useEffect(() => {
    if (!session?.user?.id || !noteId) return
    
    fetchNote()
  }, [session, noteId])
  
  const fetchNote = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notes/${noteId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('便签不存在')
        } else if (response.status === 403) {
          setError('没有权限访问此便签')
        } else {
          setError('获取便签失败')
        }
        return
      }
      
      const data = await response.json()
      setNote(data)

      // 调试信息
      console.log('便签数据:', data)
      console.log('用户权限:', data.userPermission)
      console.log('是否所有者:', data.isOwner)

      // 设置权限状态
      setIsOwner(data.isOwner || false)
      setHasEditPermission(data.userPermission === 'edit')
      
    } catch (error) {
      console.error('获取便签失败:', error)
      setError('网络连接失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 保存便签
  const handleSave = async (updates: Partial<Note>) => {
    if (!note) return
    
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('保存失败')
      }
      
      const data = await response.json()
      setNote(data)
      
    } catch (error) {
      console.error('保存便签失败:', error)
      throw error
    }
  }
  
  // 返回便签列表
  const handleClose = () => {
    router.push('/')
  }
  
  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-muted-foreground">加载便签中...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }
  
  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-2xl font-bold">协作编辑</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                加载失败
              </CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={fetchNote} variant="outline">
                  重试
                </Button>
                <Button onClick={handleClose}>
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </AuthGuard>
    )
  }
  
  if (!note) {
    return null
  }
  
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold">协作编辑</h1>
              <p className="text-muted-foreground">
                {isOwner ? '你是此便签的所有者' : '你正在协作编辑此便签'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteDialog(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                邀请协作
              </Button>
            )}
            {!hasEditPermission && (
              <div className="text-sm text-muted-foreground">
                只读模式
              </div>
            )}
            {hasEditPermission && !isOwner && (
              <div className="text-sm text-green-600">
                协作编辑模式
              </div>
            )}
          </div>
        </div>
        
        {/* 协作编辑器 */}
        <div className="bg-background border rounded-lg p-6 min-h-[600px]">
          <CollaborativeNoteEditor
            note={note}
            onSave={handleSave}
            onClose={handleClose}
            isReadOnly={!hasEditPermission}
          />
        </div>
        
        {/* 协作说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">协作功能说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>实时同步</strong>：多个用户可以同时编辑，更改会实时同步</p>
            <p>• <strong>冲突解决</strong>：系统会自动处理编辑冲突，确保数据一致性</p>
            <p>• <strong>在线状态</strong>：可以看到当前正在协作的其他用户</p>
            <p>• <strong>自动保存</strong>：编辑内容会自动保存，无需手动操作</p>
            {!hasEditPermission && (
              <p>• <strong>权限限制</strong>：当前为只读模式，您没有编辑权限</p>
            )}
            {hasEditPermission && !isOwner && (
              <p>• <strong>协作权限</strong>：您有编辑权限，可以与其他用户协作编辑</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 邀请协作对话框 - 暂时禁用 */}
      {/* {isOwner && (
        <InviteCollaboratorDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          noteId={parseInt(noteId)}
          onInviteSent={() => {
            toast('邀请已发送', 'success')
            setShowInviteDialog(false)
          }}
          onError={(error) => toast(error, 'error')}
        />
      )} */}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AuthGuard>
  )
}
