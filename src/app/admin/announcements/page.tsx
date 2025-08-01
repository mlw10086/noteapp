'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useToast, ToastContainer } from '@/components/Toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  MessageSquare,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
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
  _count: {
    dismissedBy: number
  }
}

interface AnnouncementListResponse {
  announcements: Announcement[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAnnouncements, setTotalAnnouncements] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null)
  const { toasts, toast, removeToast } = useToast()

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
      })

      const response = await fetch(`/api/admin/announcements?${params}`)
      if (response.ok) {
        const data: AnnouncementListResponse = await response.json()
        setAnnouncements(data.announcements)
        setTotalPages(data.pagination.totalPages)
        setTotalAnnouncements(data.pagination.total)
      } else {
        console.error('获取公告列表失败')
      }
    } catch (error) {
      console.error('获取公告列表错误:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [currentPage, statusFilter])

  const handleDeleteClick = (id: number) => {
    setAnnouncementToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return

    try {
      const response = await fetch(`/api/admin/announcements/${announcementToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('删除成功', '公告已成功删除')
        fetchAnnouncements()
      } else {
        toast.error('删除失败', '删除公告时出现错误')
      }
    } catch (error) {
      console.error('删除公告错误:', error)
      toast.error('删除失败', '删除公告时出现错误')
    } finally {
      setDeleteConfirmOpen(false)
      setAnnouncementToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setAnnouncementToDelete(null)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'info': return '信息'
      case 'warning': return '警告'
      case 'success': return '成功'
      case 'error': return '错误'
      default: return '未知'
    }
  }

  return (
    <AdminLayout 
      title="公告管理" 
      description="发布和管理系统公告"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总公告数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAnnouncements}</div>
              <p className="text-xs text-muted-foreground">
                所有公告总数
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃公告</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {announcements.filter(a => a.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                当前显示中
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">用户关闭</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {announcements.reduce((sum, a) => sum + a._count.dismissedBy, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                总关闭次数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 公告列表 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>公告列表</CardTitle>
                <CardDescription>
                  管理所有系统公告
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">非活跃</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button asChild>
                  <Link href="/admin/announcements/new">
                    <Plus className="h-4 w-4 mr-2" />
                    新建公告
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">加载中...</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>标题</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>优先级</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>关闭次数</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{announcement.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-48">
                                {announcement.content.replace(/[#*`]/g, '').substring(0, 50)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(announcement.type)}>
                              {getTypeName(announcement.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {announcement.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {announcement.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <Eye className="h-3 w-3 mr-1" />
                                活跃
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <EyeOff className="h-3 w-3 mr-1" />
                                非活跃
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {announcement._count.dismissedBy}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(announcement.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                asChild
                              >
                                <Link href={`/admin/announcements/${announcement.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(announcement.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      显示第 {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalAnnouncements)} 条，共 {totalAnnouncements} 条
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <div className="text-sm">
                        第 {currentPage} / {totalPages} 页
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 删除确认弹窗 */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这个公告吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toast 容器 */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </AdminLayout>
  )
}
