'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Plus, Search, Edit, Trash2, Eye, Calendar, User } from "lucide-react"
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { UpdateForm } from "@/components/admin/UpdateForm"

interface SystemUpdate {
  id: number
  version: string
  title: string
  content: string
  type: string
  priority: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  admin: {
    id: number
    name: string
    email: string
  }
}

interface UpdatesData {
  updates: SystemUpdate[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminUpdatesPage() {
  const { admin } = useAdminAuth()
  const [data, setData] = useState<UpdatesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [publishedFilter, setPublishedFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<SystemUpdate | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingUpdate, setDeletingUpdate] = useState<SystemUpdate | null>(null)

  useEffect(() => {
    fetchUpdates()
  }, [currentPage, searchQuery, typeFilter, publishedFilter])

  const fetchUpdates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (searchQuery) params.append('search', searchQuery)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      if (publishedFilter && publishedFilter !== 'all') params.append('published', publishedFilter)

      const response = await fetch(`/api/admin/updates?${params}`)
      if (response.ok) {
        const updatesData = await response.json()
        setData(updatesData)
      } else {
        console.error('获取更新记录失败')
      }
    } catch (error) {
      console.error('获取更新记录错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    fetchUpdates()
  }

  const handleEditSuccess = () => {
    setEditingUpdate(null)
    fetchUpdates()
  }

  const handleDeleteClick = (update: SystemUpdate) => {
    setDeletingUpdate(update)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUpdate) return

    try {
      const response = await fetch(`/api/admin/updates/${deletingUpdate.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteConfirmOpen(false)
        setDeletingUpdate(null)
        fetchUpdates()
      } else {
        console.error('删除更新记录失败')
      }
    } catch (error) {
      console.error('删除更新记录错误:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      feature: '新功能',
      bugfix: '修复',
      improvement: '改进',
      security: '安全'
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feature: 'bg-blue-100 text-blue-800',
      bugfix: 'bg-red-100 text-red-800',
      improvement: 'bg-green-100 text-green-800',
      security: 'bg-yellow-100 text-yellow-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AdminLayout title="更新记录管理" description="管理系统更新记录和版本发布">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="更新记录管理"
      description="管理系统更新记录和版本发布"
    >
      <div className="space-y-6">
        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索版本号、标题或内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 筛选器 */}
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="feature">新功能</SelectItem>
                  <SelectItem value="bugfix">修复</SelectItem>
                  <SelectItem value="improvement">改进</SelectItem>
                  <SelectItem value="security">安全</SelectItem>
                </SelectContent>
              </Select>

              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="true">已发布</SelectItem>
                  <SelectItem value="false">未发布</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 新建按钮 */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建更新记录
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新建更新记录</DialogTitle>
                <DialogDescription>
                  创建新的系统更新记录
                </DialogDescription>
              </DialogHeader>
              <UpdateForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {/* 更新记录列表 */}
        <div className="grid gap-6">
          {data?.updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                      <Badge variant="outline">{update.version}</Badge>
                      <Badge className={getTypeColor(update.type)}>
                        {getTypeLabel(update.type)}
                      </Badge>
                      <Badge className={getPriorityColor(update.priority)}>
                        {update.priority}
                      </Badge>
                      {update.isPublished ? (
                        <Badge className="bg-green-100 text-green-800">已发布</Badge>
                      ) : (
                        <Badge variant="secondary">草稿</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {update.admin.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(update.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </span>
                      {update.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          发布于 {format(new Date(update.publishedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUpdate(update)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(update)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="line-clamp-3 text-muted-foreground">
                    {update.content.substring(0, 200)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 分页 */}
        {data && data.pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              上一页
            </Button>
            <span className="flex items-center px-4">
              第 {currentPage} 页，共 {data.pagination.pages} 页
            </span>
            <Button
              variant="outline"
              disabled={currentPage === data.pagination.pages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </div>

      {/* 编辑对话框 */}
      {editingUpdate && (
        <Dialog open={!!editingUpdate} onOpenChange={() => setEditingUpdate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑更新记录</DialogTitle>
              <DialogDescription>
                修改更新记录信息
              </DialogDescription>
            </DialogHeader>
            <UpdateForm 
              update={editingUpdate} 
              onSuccess={handleEditSuccess} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除更新记录 "{deletingUpdate?.title}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
