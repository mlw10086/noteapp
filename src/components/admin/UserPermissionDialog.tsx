'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DateTimePicker } from '@/components/ui/date-picker'
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Ban, 
  Clock,
  Trash2,
  Plus
} from 'lucide-react'

interface User {
  id: number
  email: string
  name: string
  status: string
  bannedUntil?: string | null
  bannedReason?: string | null
  bannedIps?: string[]
  lastIpAddress?: string | null
}

interface UserPermissionDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: number, action: string, data?: any) => Promise<void>
}

export function UserPermissionDialog({ 
  user, 
  isOpen, 
  onClose, 
  onUpdate 
}: UserPermissionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [banDuration, setBanDuration] = useState('1d')
  const [banReason, setBanReason] = useState('')
  const [customDate, setCustomDate] = useState<Date | undefined>()
  const [newIpAddress, setNewIpAddress] = useState('')

  if (!user) return null

  const handleBanUser = async (permanent: boolean = false) => {
    setLoading(true)
    try {
      await onUpdate(user.id, 'ban', {
        duration: permanent ? undefined : banDuration,
        reason: banReason || '违反平台规定',
        permanent,
        customDate: banDuration === 'custom' ? customDate : undefined
      })
      onClose()
    } catch (error) {
      console.error('封禁用户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnbanUser = async () => {
    setLoading(true)
    try {
      await onUpdate(user.id, 'unban')
      onClose()
    } catch (error) {
      console.error('解封用户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleObservation = async () => {
    setLoading(true)
    try {
      const enabled = user.status !== 'under_observation'
      await onUpdate(user.id, 'set_observation', { enabled })
      onClose()
    } catch (error) {
      console.error('设置观察模式失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanIp = async () => {
    if (!newIpAddress.trim()) return
    
    setLoading(true)
    try {
      await onUpdate(user.id, 'ban_ip', { ipAddress: newIpAddress.trim() })
      setNewIpAddress('')
    } catch (error) {
      console.error('封禁IP失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnbanIp = async (ipAddress: string) => {
    setLoading(true)
    try {
      await onUpdate(user.id, 'unban_ip', { ipAddress })
    } catch (error) {
      console.error('解封IP失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <ShieldCheck className="h-3 w-3 mr-1" />
            正常
          </Badge>
        )
      case 'banned':
        return (
          <Badge variant="destructive">
            <Ban className="h-3 w-3 mr-1" />
            已封禁
          </Badge>
        )
      case 'under_observation':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Eye className="h-3 w-3 mr-1" />
            观察中
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            未知
          </Badge>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            用户权限管理 - {user.name}
          </DialogTitle>
          <DialogDescription>
            管理用户 {user.email} 的访问权限和行为限制
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前状态 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">当前状态</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusBadge(user.status)}
                <div>
                  <p className="text-sm font-medium">{user.email}</p>
                  {user.lastIpAddress && (
                    <p className="text-xs text-muted-foreground">
                      最后登录IP: {user.lastIpAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {user.status === 'banned' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>封禁原因:</strong> {user.bannedReason || '未指定'}
                </p>
                {user.bannedUntil && (
                  <p className="text-sm text-red-800 mt-1">
                    <strong>封禁到期:</strong> {new Date(user.bannedUntil).toLocaleString('zh-CN')}
                  </p>
                )}
                {!user.bannedUntil && (
                  <p className="text-sm text-red-800 mt-1">
                    <strong>封禁类型:</strong> 永久封禁
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 操作区域 */}
          {user.status !== 'banned' && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">用户操作</Label>
              
              {/* 观察模式 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">观察模式</p>
                    <p className="text-xs text-muted-foreground">
                      用户可以访问但无法发布内容
                    </p>
                  </div>
                </div>
                <Switch
                  checked={user.status === 'under_observation'}
                  onCheckedChange={handleToggleObservation}
                  disabled={loading}
                />
              </div>

              {/* 封禁用户 */}
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <Label className="text-sm font-medium">封禁用户</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">封禁时长</Label>
                    <Select value={banDuration} onValueChange={setBanDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1小时</SelectItem>
                        <SelectItem value="1d">1天</SelectItem>
                        <SelectItem value="7d">7天</SelectItem>
                        <SelectItem value="30d">30天</SelectItem>
                        <SelectItem value="custom">自定义时间</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {banDuration === 'custom' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">到期时间</Label>
                      <DateTimePicker
                        date={customDate}
                        onDateChange={setCustomDate}
                        placeholder="选择到期时间"
                        minDate={new Date()}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">封禁原因</Label>
                  <Textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="请输入封禁原因..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBanUser(false)}
                    disabled={loading}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    临时封禁
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBanUser(true)}
                    disabled={loading}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    永久封禁
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 解封操作 */}
          {user.status === 'banned' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleUnbanUser}
                disabled={loading}
                className="w-full"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                解除封禁
              </Button>
            </div>
          )}

          {/* IP管理 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">IP地址管理</Label>
            
            {/* 添加封禁IP */}
            <div className="flex gap-2">
              <Input
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="输入要封禁的IP地址"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleBanIp}
                disabled={loading || !newIpAddress.trim()}
              >
                <Plus className="h-3 w-3 mr-1" />
                封禁IP
              </Button>
            </div>

            {/* 已封禁IP列表 */}
            {user.bannedIps && user.bannedIps.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">已封禁IP地址</Label>
                <div className="space-y-1">
                  {user.bannedIps.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                      <span className="text-sm font-mono">{ip}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnbanIp(ip)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
