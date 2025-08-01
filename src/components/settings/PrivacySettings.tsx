'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Shield, Eye, Trash2, Download, History } from "lucide-react"
import { LoginHistoryDialog } from "./LoginHistoryDialog"

interface PrivacySettingsProps {
  toast: any
}

export function PrivacySettings({ toast }: PrivacySettingsProps) {
  const [dataCollection, setDataCollection] = useState(true)
  const [analyticsTracking, setAnalyticsTracking] = useState(false)
  const [shareUsageData, setShareUsageData] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch('/api/user/privacy-settings')
      if (response.ok) {
        const settings = await response.json()
        setDataCollection(settings.dataCollection)
        setAnalyticsTracking(settings.analyticsTracking)
        setShareUsageData(settings.shareUsageData)
      }
    } catch (error) {
      console.error('加载隐私设置失败:', error)
      toast.error("加载失败", "无法加载隐私设置")
    }
  }

  const saveSettings = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/user/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      })

      if (response.ok) {
        toast.success("设置已保存", "隐私设置已更新")
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error("保存失败", "设置保存时出现错误")
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export', {
        method: 'POST',
      })

      if (response.ok) {
        // 创建下载链接
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success("导出成功", "您的数据已开始下载")
      } else {
        throw new Error('导出失败')
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      toast.error("导出失败", "数据导出时出现错误")
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // TODO: 实现账户删除功能
      toast.success("删除请求已提交", "您的账户将在24小时内被删除")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('删除账户失败:', error)
      toast.error("删除失败", "账户删除时出现错误")
    }
  }

  return (
    <div className="space-y-6">
      {/* 数据隐私设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            数据隐私
          </CardTitle>
          <CardDescription>
            控制您的数据收集和使用方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>基础数据收集</Label>
              <p className="text-sm text-muted-foreground">
                收集基本使用数据以改善服务质量
              </p>
            </div>
            <Switch
              checked={dataCollection}
              onCheckedChange={(enabled) => {
                setDataCollection(enabled)
                saveSettings('dataCollection', enabled)
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>分析追踪</Label>
              <p className="text-sm text-muted-foreground">
                允许收集匿名使用分析数据
              </p>
            </div>
            <Switch
              checked={analyticsTracking}
              onCheckedChange={(enabled) => {
                setAnalyticsTracking(enabled)
                saveSettings('analyticsTracking', enabled)
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>共享使用数据</Label>
              <p className="text-sm text-muted-foreground">
                与第三方服务共享匿名使用统计
              </p>
            </div>
            <Switch
              checked={shareUsageData}
              onCheckedChange={(enabled) => {
                setShareUsageData(enabled)
                saveSettings('shareUsageData', enabled)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 账户安全 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            账户安全
          </CardTitle>
          <CardDescription>
            管理您的账户安全设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">登录历史</p>
                <p className="text-sm text-muted-foreground">查看最近的登录活动</p>
              </div>
              <LoginHistoryDialog>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  查看历史
                </Button>
              </LoginHistoryDialog>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">两步验证</p>
                <p className="text-sm text-muted-foreground">增强账户安全性</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                即将推出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            数据管理
          </CardTitle>
          <CardDescription>
            导出或删除您的个人数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">导出数据</p>
                <p className="text-sm text-muted-foreground">下载您的所有便签和设置数据</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/20">
              <div>
                <p className="font-medium text-destructive">删除账户</p>
                <p className="text-sm text-muted-foreground">永久删除您的账户和所有数据</p>
              </div>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除账户</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作无法撤销。这将永久删除您的账户和所有相关数据，包括：
                    </AlertDialogDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>所有便签内容</li>
                      <li>个人设置和偏好</li>
                      <li>账户信息</li>
                    </ul>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 隐私摘要 */}
      <Card>
        <CardHeader>
          <CardTitle>隐私设置摘要</CardTitle>
          <CardDescription>
            当前隐私设置概览
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>基础数据收集</span>
              <span className={dataCollection ? "text-orange-600" : "text-green-600"}>
                {dataCollection ? "已启用" : "已禁用"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>分析追踪</span>
              <span className={analyticsTracking ? "text-orange-600" : "text-green-600"}>
                {analyticsTracking ? "已启用" : "已禁用"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>共享使用数据</span>
              <span className={shareUsageData ? "text-orange-600" : "text-green-600"}>
                {shareUsageData ? "已启用" : "已禁用"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
