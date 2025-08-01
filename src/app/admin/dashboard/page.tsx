'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Settings, MessageSquare, BarChart3, Activity, UserCheck, FileText, Shield, TrendingUp, Calendar, Clock } from "lucide-react"
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from "next/link"

interface DashboardData {
  stats: {
    totalUsers: number
    totalNotes: number
    totalAdmins: number
    activeUsers: number
    todayUsers: number
    todayNotes: number
    monthUsers: number
    monthNotes: number
    userGrowth: number
    noteGrowth: number
  }
  charts: {
    dailyStats: Array<{
      date: string
      users: number
      notes: number
    }>
  }
  recent: {
    users: Array<{
      id: number
      email: string
      name: string
      createdAt: string
      avatar?: string
    }>
    notes: Array<{
      id: number
      title: string
      createdAt: string
      user: {
        id: number
        name: string
        email: string
      }
    }>
    adminLogins: Array<{
      id: number
      createdAt: string
      ipAddress: string
      admin: {
        id: number
        name: string
        email: string
      }
    }>
  }
}

export default function AdminDashboard() {
  const { admin } = useAdminAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      } else {
        console.error('获取仪表板数据失败')
      }
    } catch (error) {
      console.error('获取仪表板数据错误:', error)
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

  if (loading) {
    return (
      <AdminLayout title="仪表板" description="管理系统概览和快速操作">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="仪表板"
      description="管理系统概览和快速操作"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalUsers.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className={data?.stats.userGrowth && data.stats.userGrowth > 0 ? "text-green-600" : "text-red-600"}>
                  {data?.stats.userGrowth && data.stats.userGrowth > 0 ? '+' : ''}{data?.stats.userGrowth || 0}%
                </span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总便签数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalNotes.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className={data?.stats.noteGrowth && data.stats.noteGrowth > 0 ? "text-green-600" : "text-red-600"}>
                  {data?.stats.noteGrowth && data.stats.noteGrowth > 0 ? '+' : ''}{data?.stats.noteGrowth || 0}%
                </span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.activeUsers.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                过去30天内活跃
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">管理员数</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalAdmins || 0}</div>
              <p className="text-xs text-muted-foreground">
                活跃管理员账户
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 今日统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日新用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.todayUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                今天注册的用户
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日新便签</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.todayNotes || 0}</div>
              <p className="text-xs text-muted-foreground">
                今天创建的便签
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月新用户</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.monthUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                本月注册的用户
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月新便签</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.monthNotes || 0}</div>
              <p className="text-xs text-muted-foreground">
                本月创建的便签
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 最近活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                最近注册用户
              </CardTitle>
              <CardDescription>
                最新注册的5个用户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recent.users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                最近创建便签
              </CardTitle>
              <CardDescription>
                最新创建的5个便签
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recent.notes.map((note) => (
                  <div key={note.id} className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {note.title || '无标题'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {note.user.name}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(note.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                用户管理
              </CardTitle>
              <CardDescription>
                查看和管理所有用户账户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin/users">
                  进入用户管理
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                站点设置
              </CardTitle>
              <CardDescription>
                配置注册开关、维护模式等
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin/settings">
                  进入站点设置
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                公告管理
              </CardTitle>
              <CardDescription>
                发布和管理系统公告
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin/announcements">
                  进入公告管理
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 管理员信息 */}
        <Card>
          <CardHeader>
            <CardTitle>管理员信息</CardTitle>
            <CardDescription>当前登录的管理员账户信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">管理员角色：</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">
                  {admin?.role === 'super_admin' ? '超级管理员' : '管理员'}
                </span>
              </div>
              <div>
                <span className="font-medium">登录邮箱：</span>
                <span className="ml-2">{admin?.email}</span>
              </div>
              <div>
                <span className="font-medium">管理员姓名：</span>
                <span className="ml-2">{admin?.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
