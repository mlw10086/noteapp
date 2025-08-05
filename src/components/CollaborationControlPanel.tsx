'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Power, 
  Clock, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { DateTimePicker } from "@/components/ui/date-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CollaborationSettings {
  isGloballyEnabled: boolean
  globalDisabledUntil: Date | null
  globalDisabledReason: string | null
  maxCollaborators: number
  allowAnonymous: boolean
  requireApproval: boolean
}

interface CollaborationControlPanelProps {
  toast: {
    success: (title: string, description?: string) => void
    error: (title: string, description?: string) => void
    default: (title: string, description?: string) => void
  }
}

export function CollaborationControlPanel({ toast }: CollaborationControlPanelProps) {
  const [settings, setSettings] = useState<CollaborationSettings>({
    isGloballyEnabled: true,
    globalDisabledUntil: null,
    globalDisabledReason: null,
    maxCollaborators: 10,
    allowAnonymous: false,
    requireApproval: false
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disableReason, setDisableReason] = useState("")
  const [disableUntil, setDisableUntil] = useState<Date | null>(null)

  // 加载协作设置
  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/collaboration/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          isGloballyEnabled: data.isGloballyEnabled ?? true,
          globalDisabledUntil: data.globalDisabledUntil ? new Date(data.globalDisabledUntil) : null,
          globalDisabledReason: data.globalDisabledReason,
          maxCollaborators: data.maxCollaborators ?? 10,
          allowAnonymous: data.allowAnonymous ?? false,
          requireApproval: data.requireApproval ?? false
        })
      } else {
        toast.error('加载失败', '无法加载协作设置')
      }
    } catch (error) {
      console.error('加载协作设置失败:', error)
      toast.error('加载失败', '网络连接失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存协作设置
  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/collaboration/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settings,
          globalDisabledUntil: settings.globalDisabledUntil?.toISOString()
        })
      })

      if (response.ok) {
        toast.success('保存成功', '协作设置已更新')
      } else {
        const errorData = await response.json()
        toast.error('保存失败', errorData.error || '保存协作设置时出现错误')
      }
    } catch (error) {
      console.error('保存协作设置失败:', error)
      toast.error('保存失败', '网络连接失败')
    } finally {
      setSaving(false)
    }
  }

  // 处理全局开关切换
  const handleGlobalToggle = (enabled: boolean) => {
    if (!enabled) {
      // 关闭协作时显示确认对话框
      setShowDisableDialog(true)
    } else {
      // 开启协作
      setSettings(prev => ({
        ...prev,
        isGloballyEnabled: true,
        globalDisabledUntil: null,
        globalDisabledReason: null
      }))
    }
  }

  // 确认关闭协作
  const confirmDisable = () => {
    setSettings(prev => ({
      ...prev,
      isGloballyEnabled: false,
      globalDisabledUntil: disableUntil,
      globalDisabledReason: disableReason || null
    }))
    setShowDisableDialog(false)
    setDisableReason("")
    setDisableUntil(null)
  }

  // 检查是否临时禁用
  const isTemporarilyDisabled = settings.globalDisabledUntil && 
    new Date(settings.globalDisabledUntil) > new Date()

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            协作控制面板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            协作控制面板
            {!settings.isGloballyEnabled && (
              <Badge variant="destructive" className="ml-2">
                已禁用
              </Badge>
            )}
            {isTemporarilyDisabled && (
              <Badge variant="secondary" className="ml-2">
                定时禁用
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 全局协作开关 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Power className="h-4 w-4" />
                  全局协作功能
                </Label>
                <p className="text-sm text-muted-foreground">
                  控制整个系统的协作功能开关
                </p>
              </div>
              <Switch
                checked={settings.isGloballyEnabled}
                onCheckedChange={handleGlobalToggle}
              />
            </div>

            {/* 状态显示 */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              {settings.isGloballyEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">协作功能已启用</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">协作功能已禁用</span>
                </>
              )}
            </div>

            {/* 禁用信息显示 */}
            {!settings.isGloballyEnabled && (
              <div className="space-y-2 p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    协作功能已禁用
                  </span>
                </div>
                {settings.globalDisabledReason && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    原因：{settings.globalDisabledReason}
                  </p>
                )}
                {settings.globalDisabledUntil && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    禁用至：{new Date(settings.globalDisabledUntil).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 协作限制设置 */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-medium">协作限制设置</Label>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">最大协作者数量</Label>
                  <p className="text-xs text-muted-foreground">每个便签的最大协作者数量</p>
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxCollaborators}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      maxCollaborators: parseInt(e.target.value) || 10
                    }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">允许匿名协作</Label>
                  <p className="text-xs text-muted-foreground">是否允许未登录用户参与协作</p>
                </div>
                <Switch
                  checked={settings.allowAnonymous}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    allowAnonymous: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">需要审批</Label>
                  <p className="text-xs text-muted-foreground">新协作者需要便签所有者审批</p>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    requireApproval: checked
                  }))}
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={saveSettings} disabled={saving} className="flex-1">
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存设置
            </Button>
            <Button variant="outline" onClick={loadSettings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 禁用确认对话框 */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              确认禁用协作功能
            </AlertDialogTitle>
            <AlertDialogDescription>
              禁用协作功能将断开所有当前的协作连接。您可以设置禁用原因和自动恢复时间。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="disable-reason">禁用原因（可选）</Label>
              <Textarea
                id="disable-reason"
                placeholder="请输入禁用协作功能的原因..."
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>自动恢复时间（可选）</Label>
              <div className="mt-2">
                <DateTimePicker
                  date={disableUntil || undefined}
                  onDateChange={(date) => setDisableUntil(date || null)}
                  placeholder="选择自动恢复时间"
                  minDate={new Date()}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                如果不设置，需要手动重新启用协作功能
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable} className="bg-red-600 hover:bg-red-700">
              确认禁用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
