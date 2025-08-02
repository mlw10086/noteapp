'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Users,
  MessageSquare,
  Calendar,
  Settings
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Notification {
  id: number
  type: string
  title: string
  content: string
  data?: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // 获取通知列表
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error('获取通知失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 标记通知为已读
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT'
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markAllAsRead: true })
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
        toast.success('已标记所有通知为已读')
      }
    } catch (error) {
      console.error('标记所有已读失败:', error)
      toast.error('操作失败')
    }
  }

  // 删除通知
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success('删除成功', undefined, 1000) // 1秒后自动消失
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      toast.error('删除失败')
    }
  }

  // 处理邀请响应
  const handleInvitationResponse = async (notificationId: number, invitationId: number, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        const result = await response.json()
        await markAsRead(notificationId)
        
        if (action === 'accept') {
          toast.success('已接受邀请', '您现在可以协作编辑该便签')
          // 可以跳转到便签编辑页面
          if (result.noteId) {
            window.location.href = `/notes/${result.noteId}/collaborate`
          }
        } else {
          toast.info('已拒绝邀请')
        }
      } else {
        const error = await response.json()
        toast.error('操作失败', error.error)
      }
    } catch (error) {
      console.error('响应邀请失败:', error)
      toast.error('操作失败')
    }
  }

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation':
        return <Users className="h-4 w-4" />
      case 'collaboration':
        return <MessageSquare className="h-4 w-4" />
      case 'reminder':
        return <Calendar className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // 渲染通知内容
  const renderNotificationContent = (notification: Notification) => {
    const data = notification.data ? JSON.parse(notification.data) : null

    if (notification.type === 'invitation' && data?.invitationId) {
      return (
        <div className="space-y-2">
          <p className="text-sm">{notification.content}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleInvitationResponse(notification.id, data.invitationId, 'accept')}
            >
              接受
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleInvitationResponse(notification.id, data.invitationId, 'reject')}
            >
              拒绝
            </Button>
          </div>
        </div>
      )
    }

    return <p className="text-sm">{notification.content}</p>
  }

  useEffect(() => {
    fetchNotifications()
    
    // 定期刷新通知
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-medium px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>通知中心</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              全部已读
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer ${
                    !notification.isRead ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-auto p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {renderNotificationContent(notification)}
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
