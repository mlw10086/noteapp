'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast, ToastContainer } from '@/components/Toast'
import {
  Settings,
  Shield,
  Globe,
  Wrench,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface SiteSettings {
  [key: string]: {
    value: string
    type: string
    description?: string
    category: string
    isPublic: boolean
    updatedAt: string
    updatedBy?: string
  }
}

export default function SettingsPage() {
  const { admin } = useAdminAuth()
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { toasts, toast, removeToast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: String(value)
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const settingsToUpdate = Object.entries(settings).reduce((acc, [key, setting]) => {
        acc[key] = setting.value
        return acc
      }, {} as Record<string, string>)

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsToUpdate,
          adminEmail: admin?.email,
        }),
      })

      if (response.ok) {
        toast.success('保存成功', '站点设置已成功更新')
        setMessage({ type: 'success', text: '设置保存成功' })
        fetchSettings() // 重新获取最新设置

        // 通知前端刷新缓存
        if (typeof window !== 'undefined') {
          // 使用 localStorage 事件通知其他标签页
          localStorage.setItem('site_settings_updated', Date.now().toString())
          // 立即移除，只是为了触发事件
          localStorage.removeItem('site_settings_updated')
        }

        // 3秒后清除Alert消息
        setTimeout(() => {
          setMessage(null)
        }, 3000)
      } else {
        toast.error('保存失败', '更新站点设置时出现错误')
        setMessage({ type: 'error', text: '保存设置失败' })
      }
    } catch (error) {
      console.error('保存设置错误:', error)
      toast.error('保存失败', '网络连接失败，请重试')
      setMessage({ type: 'error', text: '保存设置失败' })
    } finally {
      setSaving(false)
    }
  }

  const getBooleanValue = (key: string) => {
    return settings[key]?.value === 'true'
  }

  if (loading) {
    return (
      <AdminLayout title="站点设置" description="配置系统设置和功能开关">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="站点设置" 
      description="配置系统设置和功能开关"
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

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              基础设置
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              安全设置
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="h-4 w-4 mr-2" />
              维护模式
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>基础设置</CardTitle>
                <CardDescription>
                  配置站点的基本信息和显示设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">站点名称</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name?.value || ''}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      placeholder="便签应用"
                    />
                    <p className="text-xs text-muted-foreground">
                      {settings.site_name?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_notes_per_user">每用户最大便签数</Label>
                    <Input
                      id="max_notes_per_user"
                      type="number"
                      value={settings.max_notes_per_user?.value || ''}
                      onChange={(e) => updateSetting('max_notes_per_user', e.target.value)}
                      placeholder="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      {settings.max_notes_per_user?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_file_size_mb">最大文件大小(MB)</Label>
                    <Input
                      id="max_file_size_mb"
                      type="number"
                      value={settings.max_file_size_mb?.value || ''}
                      onChange={(e) => updateSetting('max_file_size_mb', e.target.value)}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {settings.max_file_size_mb?.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
                <CardDescription>
                  配置用户注册和安全相关设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registration_enabled">允许用户注册</Label>
                    <p className="text-sm text-muted-foreground">
                      {settings.site_registration_enabled?.description}
                    </p>
                  </div>
                  <Switch
                    id="registration_enabled"
                    checked={getBooleanValue('site_registration_enabled')}
                    onCheckedChange={(checked) => updateSetting('site_registration_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>维护模式</CardTitle>
                <CardDescription>
                  开启维护模式时，普通用户将无法访问系统
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance_mode">维护模式</Label>
                    <p className="text-sm text-muted-foreground">
                      开启后用户将看到维护页面
                    </p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={getBooleanValue('site_maintenance_mode')}
                    onCheckedChange={(checked) => updateSetting('site_maintenance_mode', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">维护提示信息</Label>
                  <Textarea
                    id="maintenance_message"
                    value={settings.site_maintenance_message?.value || ''}
                    onChange={(e) => updateSetting('site_maintenance_message', e.target.value)}
                    placeholder="系统正在维护中，请稍后再试。"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    维护模式下显示给用户的消息
                  </p>
                </div>

                {getBooleanValue('site_maintenance_mode') && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      维护模式已开启，普通用户将无法访问系统。管理员仍可正常使用。
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AdminLayout>
  )
}
