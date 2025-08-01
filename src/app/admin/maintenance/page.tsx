'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wrench, 
  Save,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Eye
} from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings?category=general')
      if (response.ok) {
        const data = await response.json()
        setMaintenanceMode(data.settings.site_maintenance_mode?.value === 'true')
        setMaintenanceMessage(data.settings.site_maintenance_message?.value || '系统正在维护中，请稍后再试。')
      } else {
        setMessage({ type: 'error', text: '获取设置失败' })
      }
    } catch (error) {
      console.error('获取设置错误:', error)
      setMessage({ type: 'error', text: '获取设置失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            site_maintenance_mode: maintenanceMode.toString(),
            site_maintenance_message: maintenanceMessage,
          },
          adminEmail: 'admin@example.com', // 这里应该从认证信息获取
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '维护设置保存成功' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || '保存设置失败' })
      }
    } catch (error) {
      console.error('保存设置错误:', error)
      setMessage({ type: 'error', text: '保存设置失败' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="系统维护" description="管理系统维护模式">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="系统维护" 
      description="管理系统维护模式和维护信息"
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

        {/* 维护模式状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              维护模式状态
            </CardTitle>
            <CardDescription>
              当前系统维护模式状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">
                  {maintenanceMode ? '🔧 维护模式已开启' : '✅ 系统正常运行'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {maintenanceMode 
                    ? '普通用户将看到维护页面，管理员可正常访问' 
                    : '所有用户都可以正常访问系统'
                  }
                </p>
              </div>
              {maintenanceMode && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/maintenance" target="_blank">
                    <Eye className="h-4 w-4 mr-2" />
                    预览维护页面
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 维护模式设置 */}
        <Card>
          <CardHeader>
            <CardTitle>维护模式设置</CardTitle>
            <CardDescription>
              配置系统维护模式和显示信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 维护模式开关 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance_mode">启用维护模式</Label>
                <p className="text-sm text-muted-foreground">
                  开启后，普通用户将无法访问系统
                </p>
              </div>
              <Switch
                id="maintenance_mode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>

            {/* 维护信息 */}
            <div className="space-y-2">
              <Label htmlFor="maintenance_message">维护提示信息</Label>
              <Textarea
                id="maintenance_message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="系统正在维护中，请稍后再试。"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                这条消息将显示在维护页面上，支持换行
              </p>
            </div>

            {/* 警告提示 */}
            {maintenanceMode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>注意：</strong>维护模式开启后，普通用户将无法访问系统。只有管理员可以正常登录和使用。
                </AlertDescription>
              </Alert>
            )}

            {/* 保存按钮 */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>
              常用的维护相关操作
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                <Link href="/maintenance" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  查看维护页面
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  查看用户端
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
