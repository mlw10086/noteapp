'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Monitor, MapPin, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface LoginRecord {
  id: number
  ipAddress: string
  device: string
  location: string
  success: boolean
  loginTime: string
  timeAgo: string
}

interface LoginHistoryData {
  history: LoginRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface LoginHistoryDialogProps {
  children: React.ReactNode
}

export function LoginHistoryDialog({ children }: LoginHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<LoginHistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const loadLoginHistory = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/user/login-history?page=${page}&limit=10`)
      if (response.ok) {
        const historyData = await response.json()
        setData(historyData)
        setCurrentPage(page)
      } else {
        console.error('获取登录历史失败')
      }
    } catch (error) {
      console.error('获取登录历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !data) {
      loadLoginHistory()
    }
  }, [isOpen, data])

  const handlePageChange = (page: number) => {
    loadLoginHistory(page)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            登录历史
          </DialogTitle>
          <DialogDescription>
            查看您最近的登录活动记录
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : data && data.history.length > 0 ? (
            <div className="space-y-3">
              {data.history.map((record) => (
                <Card key={record.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {record.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant={record.success ? "default" : "destructive"}>
                            {record.success ? "成功" : "失败"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {record.timeAgo}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span>{record.device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{record.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(record.loginTime).toLocaleString('zh-CN')}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          IP: {record.ipAddress}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无登录历史记录
            </div>
          )}
        </div>

        {/* 分页控件 */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              第 {data.pagination.page} 页，共 {data.pagination.totalPages} 页
              （总计 {data.pagination.total} 条记录）
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!data.pagination.hasPrev || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!data.pagination.hasNext || loading}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
