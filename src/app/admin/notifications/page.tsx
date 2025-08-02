'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  MessageSquare, 
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Plus
} from 'lucide-react'
import { useToast, ToastContainer } from '@/components/Toast'

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

interface NotificationTemplate {
  id: string
  title: string
  content: string
  type: string
}

interface SentNotification {
  id: number
  title: string
  content: string
  type: string
  recipientCount: number
  createdAt: string
  admin: {
    name: string
  }
}

export default function AdminNotificationsPage() {
  const { toast, toasts, removeToast } = useToast()

  // 标签页状态
  const [activeTab, setActiveTab] = useState('send')

  // 发送通知状态
  const [sendingType, setSendingType] = useState<'single' | 'batch' | 'broadcast'>('broadcast')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationContent, setNotificationContent] = useState('')
  const [notificationType, setNotificationType] = useState('system')
  const [sending, setSending] = useState(false)
  
  // 数据状态
  const [users, setUsers] = useState<User[]>([])
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(false)
  
  // 搜索和筛选
  const [userSearch, setUserSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  // 预设通知模板
  const defaultTemplates: NotificationTemplate[] = [
    {
      id: 'welcome',
      title: '欢迎使用便签应用',
      content: '欢迎您使用我们的便签应用！您可以创建、编辑和管理您的便签，还可以与他人协作。如有任何问题，请随时联系我们。',
      type: 'system'
    },
    {
      id: 'maintenance',
      title: '系统维护通知',
      content: '系统将于今晚 23:00 - 01:00 进行维护升级，期间可能无法正常访问。维护完成后将恢复正常服务，感谢您的理解。',
      type: 'system'
    },
    {
      id: 'feature',
      title: '新功能上线',
      content: '我们很高兴地宣布新功能已经上线！现在您可以使用协作编辑功能，邀请其他用户一起编辑便签。快去体验吧！',
      type: 'system'
    },
    {
      id: 'security',
      title: '安全提醒',
      content: '为了保护您的账户安全，请定期更改密码，不要与他人分享您的登录信息。如发现异常登录，请立即联系我们。',
      type: 'system'
    }
  ]

  useEffect(() => {
    setTemplates(defaultTemplates)
    fetchUsers()
    fetchSentNotifications()
  }, [])

  // 获取用户列表
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setTotalUsers(data.pagination.total)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取已发送通知
  const fetchSentNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications/sent')
      if (response.ok) {
        const data = await response.json()
        setSentNotifications(data)
      }
    } catch (error) {
      console.error('获取通知历史失败:', error)
    }
  }

  // 发送通知
  const sendNotification = async () => {
    if (!notificationTitle.trim() || !notificationContent.trim()) {
      toast.error('请填写通知标题和内容')
      return
    }

    if (sendingType === 'single' && selectedUsers.length === 0) {
      toast.error('请选择要发送的用户')
      return
    }

    try {
      setSending(true)
      
      const payload = {
        title: notificationTitle.trim(),
        content: notificationContent.trim(),
        type: notificationType,
        sendingType,
        ...(sendingType === 'single' && { userIds: selectedUsers })
      }

      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('通知发送成功', `已发送给 ${result.sentCount} 个用户`)
        
        // 清空表单
        setNotificationTitle('')
        setNotificationContent('')
        setSelectedUsers([])
        
        // 刷新通知历史
        await fetchSentNotifications()
      } else {
        const error = await response.json()
        toast.error('发送失败', error.error)
      }
    } catch (error) {
      console.error('发送通知失败:', error)
      toast.error('发送失败', '网络连接失败')
    } finally {
      setSending(false)
    }
  }

  // 使用模板
  const useTemplate = (template: NotificationTemplate) => {
    setNotificationTitle(template.title)
    setNotificationContent(template.content)
    setNotificationType(template.type)

    // 显示成功提示
    toast.success('模板已应用', `已使用模板"${template.title}"`)

    // 自动跳转到发送通知标签页
    setTimeout(() => {
      setActiveTab('send')
    }, 500)
  }

  // 切换用户选择
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // 搜索用户
  const handleUserSearch = () => {
    setCurrentPage(1)
    fetchUsers(1, userSearch)
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <AdminLayout title="通知管理" description="发送系统通知给用户">
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                可接收通知的用户
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已发送通知</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentNotifications.length}</div>
              <p className="text-xs text-muted-foreground">
                历史发送记录
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">通知模板</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">
                可用的通知模板
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="send">发送通知</TabsTrigger>
            <TabsTrigger value="history">发送历史</TabsTrigger>
            <TabsTrigger value="templates">通知模板</TabsTrigger>
          </TabsList>

          {/* 发送通知 */}
          <TabsContent value="send" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 通知编辑 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    编写通知
                  </CardTitle>
                  <CardDescription>
                    创建并发送系统通知给用户
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 发送类型 */}
                  <div>
                    <Label>发送类型</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={sendingType === 'broadcast' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSendingType('broadcast')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        全站广播
                      </Button>
                      <Button
                        variant={sendingType === 'single' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSendingType('single')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        指定用户
                      </Button>
                    </div>
                  </div>

                  {/* 通知类型 */}
                  <div>
                    <Label htmlFor="type">通知类型</Label>
                    <select
                      id="type"
                      className="w-full p-2 border rounded-md mt-1"
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value)}
                    >
                      <option value="system">系统通知</option>
                      <option value="announcement">公告通知</option>
                      <option value="maintenance">维护通知</option>
                      <option value="feature">功能更新</option>
                    </select>
                  </div>

                  {/* 通知标题 */}
                  <div>
                    <Label htmlFor="title">通知标题</Label>
                    <Input
                      id="title"
                      placeholder="输入通知标题"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                    />
                  </div>

                  {/* 通知内容 */}
                  <div>
                    <Label htmlFor="content">通知内容</Label>
                    <Textarea
                      id="content"
                      placeholder="输入通知内容"
                      rows={6}
                      value={notificationContent}
                      onChange={(e) => setNotificationContent(e.target.value)}
                    />
                  </div>

                  {/* 发送按钮 */}
                  <Button
                    onClick={sendNotification}
                    disabled={sending}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? '发送中...' : '发送通知'}
                  </Button>
                </CardContent>
              </Card>

              {/* 用户选择（仅在指定用户模式下显示） */}
              {sendingType === 'single' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      选择用户
                    </CardTitle>
                    <CardDescription>
                      选择要接收通知的用户
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 搜索用户 */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="搜索用户名或邮箱"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                      <Button onClick={handleUserSearch} variant="outline">
                        搜索
                      </Button>
                    </div>

                    {/* 已选择用户 */}
                    {selectedUsers.length > 0 && (
                      <div>
                        <Label>已选择 {selectedUsers.length} 个用户</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedUsers.map(userId => {
                            const user = users.find(u => u.id === userId)
                            return user ? (
                              <Badge key={userId} variant="secondary">
                                {user.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* 用户列表 */}
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedUsers.includes(user.id)
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleUserSelection(user.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                              {selectedUsers.includes(user.id) && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 发送历史 */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  发送历史
                </CardTitle>
                <CardDescription>
                  查看已发送的通知记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {sentNotifications.map(notification => (
                      <div key={notification.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>发送者: {notification.admin.name}</span>
                              <span>接收者: {notification.recipientCount} 人</span>
                              <span>时间: {new Date(notification.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {sentNotifications.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        暂无发送记录
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知模板 */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  通知模板
                </CardTitle>
                <CardDescription>
                  使用预设模板快速创建通知
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{template.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.content.substring(0, 100)}...
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {template.type}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => useTemplate(template)}
                        >
                          使用
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AdminLayout>
  )
}
