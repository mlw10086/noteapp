'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserPermissionDialog } from '@/components/admin/UserPermissionDialog'
import {
  User,
  Mail,
  Calendar,
  FileText,
  Activity,
  Settings,
  MapPin,
  Monitor,
  CheckCircle,
  XCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Ban
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface UserDetail {
  id: number
  email: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
  status: string
  bannedUntil?: string | null
  bannedReason?: string | null
  bannedIps?: string[]
  lastIpAddress?: string | null
  settings?: any
  loginHistory: LoginHistory[]
  _count: {
    notes: number
    loginHistory: number
  }
}

interface LoginHistory {
  id: number
  ipAddress?: string
  userAgent?: string
  location?: string
  success: boolean
  createdAt: string
}

interface UserStats {
  noteStats: Record<string, number>
  storageUsed: number
  totalLoginAttempts: number
}

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserDetail()
    }
  }, [userId])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setStats(data.stats)
      } else {
        console.error('获取用户详情失败')
      }
    } catch (error) {
      console.error('获取用户详情错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePermissionUpdate = async (userId: number, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      })

      if (response.ok) {
        // 重新获取用户数据
        await fetchUserDetail()
      } else {
        const errorData = await response.json()
        console.error('权限更新失败:', errorData.error)
      }
    } catch (error) {
      console.error('权限更新错误:', error)
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

  if (loading) {
    return (
      <AdminLayout title="用户详情" description="查看用户详细信息">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout title="用户详情" description="用户不存在">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">用户不存在或已被删除</p>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title={`用户详情 - ${user.name}`} 
      description={`查看用户 ${user.email} 的详细信息`}
    >
      <div className="space-y-6">
        {/* 用户基本信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                基本信息
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPermissionDialogOpen(true)}
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                权限管理
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">姓名</label>
                    <p className="text-lg font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">用户ID</label>
                    <p className="font-mono">{user.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">注册时间</label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{format(new Date(user.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">账户状态</label>
                    <div className="flex items-center mt-1">
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                  {user.lastIpAddress && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">最后登录IP</label>
                      <p className="font-mono text-sm">{user.lastIpAddress}</p>
                    </div>
                  )}
                </div>

                {/* 封禁信息显示 */}
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

                {/* 观察模式信息 */}
                {user.status === 'under_observation' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      该用户当前处于观察模式，可以访问系统但无法发布新内容。
                    </p>
                  </div>
                )}

                {/* 封禁IP列表 */}
                {user.bannedIps && user.bannedIps.length > 0 && (
                  <div className="p-3 bg-gray-50 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">封禁IP地址</label>
                    <div className="mt-2 space-y-1">
                      {user.bannedIps.map((ip, index) => (
                        <Badge key={index} variant="secondary" className="mr-2">
                          {ip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总便签数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user._count.notes}</div>
              <p className="text-xs text-muted-foreground">
                已发布: {stats?.noteStats.published || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登录次数</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user._count.loginHistory}</div>
              <p className="text-xs text-muted-foreground">
                总登录次数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">存储使用</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats?.storageUsed || 0)}</div>
              <p className="text-xs text-muted-foreground">
                内容存储大小
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">草稿便签</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.noteStats.draft || 0}</div>
              <p className="text-xs text-muted-foreground">
                未发布草稿
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息标签页 */}
        <Tabs defaultValue="login-history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="login-history">登录历史</TabsTrigger>
            <TabsTrigger value="settings">用户设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>登录历史</CardTitle>
                <CardDescription>
                  最近20次登录记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>状态</TableHead>
                        <TableHead>IP地址</TableHead>
                        <TableHead>设备信息</TableHead>
                        <TableHead>位置</TableHead>
                        <TableHead>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.loginHistory.map((login) => (
                        <TableRow key={login.id}>
                          <TableCell>
                            {login.success ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                成功
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                失败
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {login.ipAddress || '--'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Monitor className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm truncate max-w-48" title={login.userAgent}>
                                {login.userAgent || '--'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              {login.location || '--'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(login.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>用户设置</CardTitle>
                <CardDescription>
                  用户的个人偏好设置
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.settings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">主题</label>
                      <p>{user.settings.theme || '系统默认'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">语言</label>
                      <p>{user.settings.language || 'zh-CN'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">时区</label>
                      <p>{user.settings.timezone || 'Asia/Shanghai'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">自动保存</label>
                      <p>{user.settings.autoSave ? '开启' : '关闭'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">用户尚未配置个人设置</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 权限管理对话框 */}
        <UserPermissionDialog
          user={user}
          isOpen={permissionDialogOpen}
          onClose={() => setPermissionDialogOpen(false)}
          onUpdate={handlePermissionUpdate}
        />
      </div>
    </AdminLayout>
  )
}
