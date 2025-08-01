'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  Users, 
  FileText, 
  Activity,
  TrendingUp,
  Calendar,
  Eye,
  UserPlus
} from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  totalNotes: number
  activeUsers: number
  newUsersThisMonth: number
  notesThisMonth: number
  userGrowth: number
  noteGrowth: number
  dailyStats: Array<{
    date: string
    users: number
    notes: number
  }>
  todayNewNotes: number
  weekNewNotes: number
  avgNotesPerUser: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  retentionRate: number
  systemPerformance: {
    uptime: number
    responseTime: number
    dbSize: number
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      } else {
        console.error('获取分析数据失败')
      }
    } catch (error) {
      console.error('获取分析数据错误:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="数据分析" description="查看系统使用统计和趋势">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="数据分析" 
      description="查看系统使用统计和趋势分析"
    >
      <div className="space-y-6">
        {/* 时间范围选择 */}
        <div className="flex justify-end">
          <div className="flex space-x-2">
            {[
              { value: '7d', label: '7天' },
              { value: '30d', label: '30天' },
              { value: '90d', label: '90天' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === range.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{data?.userGrowth}%</span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总便签数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalNotes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{data?.noteGrowth}%</span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                过去30天内活跃
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月新用户</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.newUsersThisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                本月注册用户数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 趋势图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                用户增长趋势
              </CardTitle>
              <CardDescription>
                过去30天的用户注册趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 p-4">
                <div className="h-full flex items-end justify-between space-x-1">
                  {data?.dailyStats.slice(-7).map((stat, index) => {
                    const maxUsers = Math.max(...(data?.dailyStats.slice(-7).map(s => s.users) || [1]))
                    const height = maxUsers > 0 ? (stat.users / maxUsers) * 100 : 0
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${stat.date}: ${stat.users} 用户`}
                        />
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {new Date(stat.date).getDate()}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  过去7天用户注册趋势
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                便签创建趋势
              </CardTitle>
              <CardDescription>
                过去30天的便签创建趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 p-4">
                <div className="h-full flex items-end justify-between space-x-1">
                  {data?.dailyStats.slice(-7).map((stat, index) => {
                    const maxNotes = Math.max(...(data?.dailyStats.slice(-7).map(s => s.notes) || [1]))
                    const height = maxNotes > 0 ? (stat.notes / maxNotes) * 100 : 0
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${stat.date}: ${stat.notes} 便签`}
                        />
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {new Date(stat.date).getDate()}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  过去7天便签创建趋势
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>用户活动统计</CardTitle>
              <CardDescription>
                用户行为分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">日活跃用户</span>
                <span className="font-medium">{data?.dailyActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">周活跃用户</span>
                <span className="font-medium">{data?.weeklyActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">月活跃用户</span>
                <span className="font-medium">{data?.monthlyActiveUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">用户留存率</span>
                <span className="font-medium text-green-600">{data?.retentionRate || 0}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>内容统计</CardTitle>
              <CardDescription>
                便签和内容分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">今日新增便签</span>
                <span className="font-medium">{data?.todayNewNotes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">本周新增便签</span>
                <span className="font-medium">{data?.weekNewNotes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">本月新增便签</span>
                <span className="font-medium">{data?.notesThisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">平均每用户便签数</span>
                <span className="font-medium">{data?.avgNotesPerUser || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 系统性能指标 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              系统性能指标
            </CardTitle>
            <CardDescription>
              系统运行状态和性能数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data?.systemPerformance?.uptime || 99.9}%
                </div>
                <p className="text-sm text-muted-foreground">系统可用性</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data?.systemPerformance?.responseTime || 245}ms
                </div>
                <p className="text-sm text-muted-foreground">平均响应时间</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data?.systemPerformance?.dbSize || 1.2}MB
                </div>
                <p className="text-sm text-muted-foreground">数据库大小</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
