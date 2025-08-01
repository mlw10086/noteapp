'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Database, HardDrive, Trash2, Download, Upload, RefreshCw } from "lucide-react"

interface DataSettingsProps {
  toast: any
}

interface StorageInfo {
  used: number
  total: number
  usagePercentage: number
  statistics: {
    totalNotes: number
    scheduledNotes: number
    publishedNotes: number
    draftNotes: number
    totalCharacters: number
    averageNoteSize: number
    uniqueTags: number
    loginHistoryRecords: number
    accountAge: number
  }
  breakdown: {
    notes: { size: number; percentage: number; count: number }
    settings: { size: number; percentage: number; count: number }
    loginHistory: { size: number; percentage: number; count: number }
  }
  recentActivity: {
    lastNoteCreated: string | null
    notesThisMonth: number
  }
}

interface CleanupStats {
  oldLoginHistory: number
  emptyNotes: number
  duplicateTags: number
  hasCleanableData: boolean
}

export function DataSettings({ toast }: DataSettingsProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null)
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedSpaceSaved, setEstimatedSpaceSaved] = useState(0)

  useEffect(() => {
    loadStorageInfo()
    loadCleanupStats()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const response = await fetch('/api/user/storage')
      if (response.ok) {
        const data = await response.json()
        setStorageInfo(data)
      } else {
        throw new Error('获取存储信息失败')
      }
    } catch (error) {
      console.error('加载存储信息失败:', error)
      toast.error("加载失败", "无法获取存储信息")
    }
  }

  const loadCleanupStats = async () => {
    try {
      const response = await fetch('/api/user/cleanup')
      if (response.ok) {
        const data = await response.json()
        setCleanupStats(data.cleanupStats)
        setEstimatedSpaceSaved(data.estimatedSpaceSaved)
      }
    } catch (error) {
      console.error('加载清理统计失败:', error)
    }
  }

  const handleExportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/export', { method: 'POST' })

      if (response.ok) {
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setIsLoading(true)
        try {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/user/import', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const result = await response.json()
            toast.success("导入成功",
              `成功导入 ${result.imported.notes} 个便签，${result.imported.settings} 个设置项`)

            // 重新加载存储信息
            await loadStorageInfo()
          } else {
            const error = await response.json()
            throw new Error(error.error || '导入失败')
          }
        } catch (error) {
          console.error('导入数据失败:', error)
          toast.error("导入失败", error instanceof Error ? error.message : "数据导入时出现错误")
        } finally {
          setIsLoading(false)
        }
      }
    }
    input.click()
  }

  const handleCleanupData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/cleanup', { method: 'POST' })

      if (response.ok) {
        const result = await response.json()
        const cleaned = result.cleaned

        toast.success("清理完成",
          `清理了 ${cleaned.oldLoginHistory} 条旧登录记录，${cleaned.emptyNotes} 个空便签，节省了 ${cleaned.spaceSaved}KB 空间`)

        setIsCleanupDialogOpen(false)

        // 重新加载存储信息和清理统计
        await Promise.all([loadStorageInfo(), loadCleanupStats()])
      } else {
        throw new Error('清理失败')
      }
    } catch (error) {
      console.error('清理数据失败:', error)
      toast.error("清理失败", "数据清理时出现错误")
    } finally {
      setIsLoading(false)
    }
  }

  if (!storageInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 存储使用情况 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            存储使用情况
          </CardTitle>
          <CardDescription>
            查看您的数据存储使用情况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>已使用</span>
              <span>{storageInfo.used}KB / {(storageInfo.total / 1024).toFixed(1)}MB</span>
            </div>
            <Progress value={storageInfo.usagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              存储空间使用率：{storageInfo.usagePercentage.toFixed(1)}%
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{storageInfo.statistics.totalNotes}</p>
              <p className="text-sm text-muted-foreground">便签数量</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{storageInfo.breakdown.notes.size}KB</p>
              <p className="text-sm text-muted-foreground">便签大小</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{storageInfo.statistics.uniqueTags}</p>
              <p className="text-sm text-muted-foreground">标签数量</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{storageInfo.statistics.accountAge}</p>
              <p className="text-sm text-muted-foreground">使用天数</p>
            </div>
          </div>

          {/* 存储分解 */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">存储分解</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">便签数据</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${storageInfo.breakdown.notes.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{storageInfo.breakdown.notes.size}KB</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">设置数据</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full"
                      style={{ width: `${storageInfo.breakdown.settings.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{storageInfo.breakdown.settings.size}KB</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">登录历史</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: `${storageInfo.breakdown.loginHistory.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{storageInfo.breakdown.loginHistory.size}KB</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据备份与恢复 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据备份与恢复
          </CardTitle>
          <CardDescription>
            导出和导入您的便签数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">导出所有数据</p>
                <p className="text-sm text-muted-foreground">
                  下载包含所有便签和设置的备份文件
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportData}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "导出中..." : "导出"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">导入数据</p>
                <p className="text-sm text-muted-foreground">
                  从备份文件恢复您的便签数据
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleImportData}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据清理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            数据清理
          </CardTitle>
          <CardDescription>
            清理临时文件和缓存数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">清理临时数据</p>
                <p className="text-sm text-muted-foreground">
                  删除旧登录记录、空便签和重复标签以释放空间
                </p>
                {cleanupStats && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    可清理：{cleanupStats.oldLoginHistory} 条旧记录，{cleanupStats.emptyNotes} 个空便签，
                    {cleanupStats.duplicateTags} 个重复标签
                    {estimatedSpaceSaved > 0 && ` (预计节省 ${estimatedSpaceSaved}KB)`}
                  </div>
                )}
              </div>
              <AlertDialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!cleanupStats?.hasCleanableData || isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isLoading ? "清理中..." : "清理"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认清理数据</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将清理以下内容：
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <ul className="list-disc list-inside space-y-1">
                      {cleanupStats && (
                        <>
                          {cleanupStats.oldLoginHistory > 0 && (
                            <li>{cleanupStats.oldLoginHistory} 条旧登录记录（保留最近100条）</li>
                          )}
                          {cleanupStats.emptyNotes > 0 && (
                            <li>{cleanupStats.emptyNotes} 个空便签</li>
                          )}
                          {cleanupStats.duplicateTags > 0 && (
                            <li>{cleanupStats.duplicateTags} 个重复标签</li>
                          )}
                        </>
                      )}
                      <li>优化便签内容格式</li>
                    </ul>
                    {estimatedSpaceSaved > 0 && (
                      <p className="mt-3 font-medium">预计节省空间：{estimatedSpaceSaved}KB</p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">这不会影响您的正常便签数据。</p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanupData} disabled={isLoading}>
                      {isLoading ? "清理中..." : "确认清理"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据统计 */}
      <Card>
        <CardHeader>
          <CardTitle>数据统计</CardTitle>
          <CardDescription>
            您的便签系统使用统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.totalNotes}</p>
              <p className="text-xs text-muted-foreground">总便签数</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.scheduledNotes}</p>
              <p className="text-xs text-muted-foreground">定时便签</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.publishedNotes}</p>
              <p className="text-xs text-muted-foreground">已发布</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.draftNotes}</p>
              <p className="text-xs text-muted-foreground">草稿</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.totalCharacters.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">总字符数</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.averageNoteSize}</p>
              <p className="text-xs text-muted-foreground">平均字符数</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.recentActivity.notesThisMonth}</p>
              <p className="text-xs text-muted-foreground">本月新增</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-lg font-bold text-primary">{storageInfo.statistics.loginHistoryRecords}</p>
              <p className="text-xs text-muted-foreground">登录记录</p>
            </div>
          </div>

          {storageInfo.recentActivity.lastNoteCreated && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                最后创建便签：{new Date(storageInfo.recentActivity.lastNoteCreated).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
