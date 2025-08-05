'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserPlus, Mail, Shield } from 'lucide-react'

interface InviteCollaboratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: number
  onInviteSent: () => void
  onError: (error: string) => void
}

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
  noteId,
  onInviteSent,
  onError
}: InviteCollaboratorDialogProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit'>('edit')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      onError('请输入邮箱地址')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      onError('邮箱格式不正确')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/notes/${noteId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverEmail: email.trim(),
          permission,
          message: message.trim() || undefined,
          expiresInDays: 7
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onInviteSent()
        // 重置表单
        setEmail('')
        setPermission('edit')
        setMessage('')
      } else {
        onError(data.error || '发送邀请失败')
      }
    } catch (error) {
      console.error('发送邀请失败:', error)
      onError('网络连接失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      // 重置表单
      setEmail('')
      setPermission('edit')
      setMessage('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            邀请协作者
          </DialogTitle>
          <DialogDescription>
            邀请其他用户协作编辑这个便签。被邀请者将收到通知，可以选择接受或拒绝邀请。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 邮箱地址 */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                邮箱地址
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入被邀请者的邮箱地址"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                请确保邮箱地址正确，邀请通知将发送到此邮箱
              </p>
            </div>

            {/* 权限设置 */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                协作权限
              </Label>
              <Select
                value={permission}
                onValueChange={(value: 'view' | 'edit') => setPermission(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">编辑权限</span>
                      <span className="text-xs text-muted-foreground">
                        可以查看和编辑便签内容
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="view">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">查看权限</span>
                      <span className="text-xs text-muted-foreground">
                        只能查看便签内容，无法编辑
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 邀请消息 */}
            <div className="grid gap-2">
              <Label htmlFor="message">
                邀请消息 <span className="text-muted-foreground">(可选)</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="添加一些个人消息，让邀请更有温度..."
                rows={3}
                disabled={isLoading}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/200 字符
              </p>
            </div>

            {/* 邀请说明 */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">邀请说明</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 邀请有效期为 7 天，过期后需要重新发送</li>
                <li>• 被邀请者必须已注册账号才能接受邀请</li>
                <li>• 你可以随时撤销协作者的权限</li>
                <li>• 协作者的所有操作都会被记录</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? '发送中...' : '发送邀请'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
