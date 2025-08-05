'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Announcement {
  id: number
  title: string
  content: string
  type: string
  priority: number
  isActive: boolean
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  admin: {
    id: number
    name: string
    email: string
  }
}

export default function EditAnnouncementPage() {
  const router = useRouter()
  const params = useParams()
  const announcementId = params.id as string

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('info')
  const [priority, setPriority] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (announcementId) {
      fetchAnnouncement()
    }
  }, [announcementId])

  const fetchAnnouncement = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/announcements/${announcementId}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncement(data)
        setTitle(data.title)
        setContent(data.content)
        setType(data.type)
        setPriority(data.priority)
        setIsActive(data.isActive)
        setStartDate(data.startDate ? new Date(data.startDate) : null)
        setEndDate(data.endDate ? new Date(data.endDate) : null)
      } else {
        setMessage({ type: 'error', text: '获取公告信息失败' })
      }
    } catch (error) {
      console.error('获取公告错误:', error)
      setMessage({ type: 'error', text: '获取公告信息失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: '标题和内容不能为空' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch(`/api/admin/announcements/${announcementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          type,
          priority,
          isActive,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '公告更新成功' })
        setTimeout(() => {
          router.push('/admin/announcements')
        }, 1500)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || '更新公告失败' })
      }
    } catch (error) {
      console.error('更新公告错误:', error)
      setMessage({ type: 'error', text: '更新公告失败' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="编辑公告" description="编辑公告信息">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!announcement) {
    return (
      <AdminLayout title="编辑公告" description="公告不存在">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">公告不存在或已被删除</p>
            <Button className="mt-4" asChild>
              <Link href="/admin/announcements">返回公告列表</Link>
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="编辑公告" 
      description={`编辑公告：${announcement.title}`}
    >
      <div className="space-y-6">
        {/* 消息提示 */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* 返回按钮 */}
        <div>
          <Button variant="outline" asChild>
            <Link href="/admin/announcements">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回公告列表
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 公告内容编辑 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>公告内容</CardTitle>
                <CardDescription>
                  编辑公告的标题和内容
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">公告标题</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="请输入公告标题"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/100 字符
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">公告内容</Label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="请输入公告内容，支持 Markdown 格式..."
                    className="w-full min-h-[300px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    支持 Markdown 格式，如 **粗体**、*斜体*、# 标题 等
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 公告设置 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>公告设置</CardTitle>
                <CardDescription>
                  配置公告的显示选项
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">公告类型</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">信息</SelectItem>
                      <SelectItem value="warning">警告</SelectItem>
                      <SelectItem value="success">成功</SelectItem>
                      <SelectItem value="error">错误</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="999"
                  />
                  <p className="text-xs text-muted-foreground">
                    数字越大优先级越高
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">发布状态</Label>
                    <p className="text-sm text-muted-foreground">
                      是否向用户显示
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">开始时间（可选）</Label>
                  <DateTimePicker
                    date={startDate || undefined}
                    onDateChange={(date) => setStartDate(date || null)}
                    placeholder="选择开始时间"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">结束时间（可选）</Label>
                  <DateTimePicker
                    date={endDate || undefined}
                    onDateChange={(date) => setEndDate(date || null)}
                    placeholder="选择结束时间"
                    className="w-full"
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving || !title.trim() || !content.trim()}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存更改'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
