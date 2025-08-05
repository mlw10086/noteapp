'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  Users, 
  FileText, 
  RefreshCw, 
  Eye,
  Clock,
  User,
  Zap
} from "lucide-react"
import { UserAvatar } from "@/components/UserAvatar"

interface CollaborationSession {
  id: number
  noteId: number
  userId: number
  socketId: string
  joinedAt: string
  isActive: boolean
  lastActivity: string
  operationsCount: number
  charactersTyped: number
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  note: {
    id: number
    title: string
  }
}

interface CollaborationStats {
  totalActiveSessions: number
  totalActiveRooms: number
  totalActiveUsers: number
  totalOperationsToday: number
  averageSessionDuration: number
}

interface CollaborationMonitorProps {
  toast: {
    success: (title: string, description?: string) => void
    error: (title: string, description?: string) => void
    default: (title: string, description?: string) => void
  }
}

export function CollaborationMonitor({ toast }: CollaborationMonitorProps) {
  const [sessions, setSessions] = useState<CollaborationSession[]>([])
  const [stats, setStats] = useState<CollaborationStats>({
    totalActiveSessions: 0,
    totalActiveRooms: 0,
    totalActiveUsers: 0,
    totalOperationsToday: 0,
    averageSessionDuration: 0
  })
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 加载协作数据
  const loadCollaborationData = async () => {
    try {
      const [sessionsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/collaboration/sessions'),
        fetch('/api/admin/collaboration/stats')
      ])

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('加载协作数据失败:', error)
      toast.error('加载失败', '无法加载协作监控数据')
    } finally {
      setLoading(false)
    }
  }

  // 格式化持续时间
  const formatDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) {
      return `${diffMins}分钟`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}小时${mins}分钟`
    }
  }

  // 格式化最后活动时间
  const formatLastActivity = (lastActivity: string) => {
    const last = new Date(lastActivity)
    const now = new Date()
    const diffMs = now.getTime() - last.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    
    if (diffSecs < 60) {
      return `${diffSecs}秒前`
    } else if (diffSecs < 3600) {
      return `${Math.floor(diffSecs / 60)}分钟前`
    } else {
      return `${Math.floor(diffSecs / 3600)}小时前`
    }
  }

  // 按便签分组会话
  const sessionsByNote = sessions.reduce((acc, session) => {
    const noteId = session.noteId
    if (!acc[noteId]) {
      acc[noteId] = {
        note: session.note,
        sessions: []
      }
    }
    acc[noteId].sessions.push(session)
    return acc
  }, {} as Record<number, { note: { id: number, title: string }, sessions: CollaborationSession[] }>)

  useEffect(() => {
    loadCollaborationData()
  }, [])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadCollaborationData()
    }, 5000) // 每5秒刷新一次

    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            实时统计
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`ml-auto ${autoRefresh ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? '自动刷新' : '手动刷新'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalActiveSessions}</div>
              <div className="text-sm text-muted-foreground">活跃会话</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalActiveRooms}</div>
              <div className="text-sm text-muted-foreground">协作房间</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalActiveUsers}</div>
              <div className="text-sm text-muted-foreground">在线用户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalOperationsToday}</div>
              <div className="text-sm text-muted-foreground">今日操作</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 活跃协作房间 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            活跃协作房间
            <Badge variant="secondary" className="ml-2">
              {Object.keys(sessionsByNote).length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(sessionsByNote).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>当前没有活跃的协作房间</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {Object.values(sessionsByNote).map(({ note, sessions }) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{note.title}</span>
                        <Badge variant="outline">
                          {sessions.length} 用户
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={session.user} size="sm" />
                            <div>
                              <div className="text-sm font-medium">{session.user.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {session.user.email}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(session.joinedAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {session.operationsCount}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              最后活动：{formatLastActivity(session.lastActivity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
