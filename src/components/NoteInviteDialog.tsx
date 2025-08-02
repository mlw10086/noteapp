'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Share2,
  Mail,
  Users,
  Eye,
  Edit3,
  Clock,
  Trash2,
  UserPlus
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Invitation {
  id: number
  receiverId: number
  permission: string
  status: string
  message?: string
  expiresAt?: string
  createdAt: string
  receiver: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}

interface Collaborator {
  id: number
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  permission: string
  joinedAt: string
  lastActiveAt?: string
}

interface NoteInviteDialogProps {
  noteId: number
  noteTitle: string
  isOwner: boolean
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NoteInviteDialog({
  noteId,
  noteTitle,
  isOwner,
  trigger,
  open,
  onOpenChange
}: NoteInviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 使用外部控制的状态或内部状态
  const dialogOpen = open !== undefined ? open : isOpen
  const setDialogOpen = onOpenChange || setIsOpen
  const [activeTab, setActiveTab] = useState('invite')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()

  // 邀请表单状态
  const [receiverEmail, setReceiverEmail] = useState('')
  const [permission, setPermission] = useState('edit')
  const [message, setMessage] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [emailError, setEmailError] = useState('')

  // 数据状态
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [owner, setOwner] = useState<any>(null)

  // 检查邮箱输入
  const checkEmailInput = (email: string) => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setEmailError('')
      return
    }

    // 检查是否邀请自己
    if (session?.user?.email && trimmedEmail.toLowerCase() === session.user.email.toLowerCase()) {
      setEmailError('你不能邀请自己，请重新输入')
    } else {
      setEmailError('')
    }
  }

  // 处理邮箱输入变化
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setReceiverEmail(newEmail)
    checkEmailInput(newEmail)
  }

  // 发送邀请
  const sendInvitation = async () => {
    if (!receiverEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }

    // 检查是否邀请自己
    if (session?.user?.email && receiverEmail.trim().toLowerCase() === session.user.email.toLowerCase()) {
      toast.error('不能邀请自己，请重新输入')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/notes/${noteId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverEmail: receiverEmail.trim(),
          permission,
          message: message.trim() || undefined,
          expiresInDays
        })
      })

      if (response.ok) {
        toast.success('邀请已发送')
        setReceiverEmail('')
        setEmailError('')
        setMessage('')
        await fetchInvitations()
      } else {
        const error = await response.json()
        toast.error('发送失败', error.error)
      }
    } catch (error) {
      console.error('发送邀请失败:', error)
      toast.error('发送失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取邀请列表
  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}/invite`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('获取邀请列表失败:', error)
    }
  }

  // 获取协作者列表
  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}/collaborators`)
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data.collaborators)
        setOwner(data.owner)
      }
    } catch (error) {
      console.error('获取协作者列表失败:', error)
    }
  }

  // 移除协作者
  const removeCollaborator = async (collaboratorId: number) => {
    try {
      const response = await fetch(
        `/api/notes/${noteId}/collaborators?collaboratorId=${collaboratorId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        toast.success('协作者已移除')
        await fetchCollaborators()
      } else {
        const error = await response.json()
        toast.error('移除失败', error.error)
      }
    } catch (error) {
      console.error('移除协作者失败:', error)
      toast.error('移除失败')
    }
  }

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '待处理', variant: 'secondary' as const },
      accepted: { label: '已接受', variant: 'default' as const },
      rejected: { label: '已拒绝', variant: 'destructive' as const },
      expired: { label: '已过期', variant: 'outline' as const }
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // 获取权限图标
  const getPermissionIcon = (permission: string) => {
    return permission === 'edit' ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />
  }

  useEffect(() => {
    if (dialogOpen && noteId) {
      fetchInvitations()
      fetchCollaborators()
    }
  }, [dialogOpen, noteId])

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            协作
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {noteId && noteTitle ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    便签协作管理
                  </DialogTitle>
                  <DialogDescription>
                    管理便签「{noteTitle}」的协作者和邀请
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push(`/notes/${noteId}/collaborate`)
                    setDialogOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  进入协作编辑
                </Button>
              </div>
            </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invite">发送邀请</TabsTrigger>
            <TabsTrigger value="collaborators">协作者</TabsTrigger>
            <TabsTrigger value="invitations">邀请记录</TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4">
            {isOwner ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">邀请用户邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="输入用户邮箱地址"
                    value={receiverEmail}
                    onChange={handleEmailChange}
                    className={emailError ? 'border-red-500' : ''}
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>权限设置</Label>
                    <Select value={permission} onValueChange={setPermission}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edit">
                          <div className="flex items-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            编辑权限
                          </div>
                        </SelectItem>
                        <SelectItem value="view">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            查看权限
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>有效期（天）</Label>
                    <Select value={expiresInDays.toString()} onValueChange={(v) => setExpiresInDays(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1天</SelectItem>
                        <SelectItem value="3">3天</SelectItem>
                        <SelectItem value="7">7天</SelectItem>
                        <SelectItem value="30">30天</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">邀请消息（可选）</Label>
                  <Textarea
                    id="message"
                    placeholder="添加一些邀请说明..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={sendInvitation} disabled={loading} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? '发送中...' : '发送邀请'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                只有便签所有者可以发送邀请
              </div>
            )}
          </TabsContent>

          <TabsContent value="collaborators" className="space-y-4">
            {/* 所有者信息 */}
            {owner && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={owner.avatar} alt={owner.name} />
                      <AvatarFallback>{owner.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{owner.name}</p>
                      <p className="text-sm text-muted-foreground">{owner.email}</p>
                    </div>
                  </div>
                  <Badge variant="default">所有者</Badge>
                </div>
              </div>
            )}

            {/* 协作者列表 */}
            {collaborators.length > 0 ? (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collaborator.user.avatar} alt={collaborator.user.name} />
                          <AvatarFallback>{collaborator.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collaborator.user.name}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            加入时间: {new Date(collaborator.joinedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getPermissionIcon(collaborator.permission)}
                          <span className="text-sm">{collaborator.permission === 'edit' ? '编辑' : '查看'}</span>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCollaborator(collaborator.user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无协作者
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {invitations.length > 0 ? (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={invitation.receiver.avatar} alt={invitation.receiver.name} />
                          <AvatarFallback>{invitation.receiver.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invitation.receiver.name}</p>
                          <p className="text-sm text-muted-foreground">{invitation.receiver.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>发送时间: {new Date(invitation.createdAt).toLocaleString('zh-CN')}</span>
                            {invitation.expiresAt && (
                              <>
                                <span>•</span>
                                <span>过期时间: {new Date(invitation.expiresAt).toLocaleString('zh-CN')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getPermissionIcon(invitation.permission)}
                          <span className="text-sm">{invitation.permission === 'edit' ? '编辑' : '查看'}</span>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>
                    </div>
                    {invitation.message && (
                      <p className="mt-2 text-sm text-muted-foreground border-l-2 pl-2">
                        {invitation.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无邀请记录
              </div>
            )}
          </TabsContent>
        </Tabs>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>便签协作管理</DialogTitle>
              <DialogDescription>
                请选择一个便签进行协作管理
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 text-center text-muted-foreground">
              请选择一个便签进行协作管理
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
