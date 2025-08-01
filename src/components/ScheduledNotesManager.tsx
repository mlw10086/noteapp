'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Clock, Play, RefreshCw, Calendar, Edit, Trash2, Send, CheckSquare } from "lucide-react"
import { ScheduledNoteEditDialog } from "./ScheduledNoteEditDialog"

interface ScheduledNote {
  id: number
  title: string
  publishAt: string
  createdAt: string
}

interface ScheduledNotesData {
  total: number
  readyToPublish: number
  pending: number
  notes: {
    readyToPublish: ScheduledNote[]
    pending: ScheduledNote[]
  }
}

interface ScheduledNotesManagerProps {
  toast: {
    success: (title: string, description: string) => void
    error: (title: string, description: string) => void
  }
}

export function ScheduledNotesManager({ toast }: ScheduledNotesManagerProps) {
  const [data, setData] = useState<ScheduledNotesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<number[]>([])
  const [operationLoading, setOperationLoading] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState<ScheduledNote | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null)
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false)

  const fetchScheduledNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notes/scheduled')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        console.error('获取定时便签失败:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('获取定时便签失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const publishScheduledNotes = async () => {
    setPublishing(true)
    try {
      const response = await fetch('/api/notes/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('发布结果:', result)
        toast.success('发布成功', `已发布 ${result.published} 个便签`)
        // 重新获取数据
        await fetchScheduledNotes()
      } else {
        const errorData = await response.json()
        toast.error('发布失败', errorData.error || '发布定时便签时出现错误')
      }
    } catch (error) {
      console.error('发布定时便签失败:', error)
      toast.error('发布失败', '网络连接失败')
    } finally {
      setPublishing(false)
    }
  }

  // 打开删除确认对话框
  const handleDeleteClick = (noteId: number) => {
    setNoteToDelete(noteId)
    setDeleteConfirmOpen(true)
  }

  // 确认删除定时便签
  const confirmDeleteScheduledNote = async () => {
    if (!noteToDelete) return

    setOperationLoading(noteToDelete)
    try {
      const response = await fetch(`/api/notes/${noteToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('删除成功', '定时便签已删除')
        await fetchScheduledNotes()
      } else {
        toast.error('删除失败', '删除定时便签时出现错误')
      }
    } catch (error) {
      console.error('删除定时便签失败:', error)
      toast.error('删除失败', '网络连接失败')
    } finally {
      setOperationLoading(null)
      setDeleteConfirmOpen(false)
      setNoteToDelete(null)
    }
  }

  // 立即发布单个便签
  const publishSingleNote = async (noteId: number) => {
    setOperationLoading(noteId)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'published',
          publishAt: null
        })
      })

      if (response.ok) {
        toast.success('发布成功', '便签已立即发布')
        await fetchScheduledNotes()
      } else {
        toast.error('发布失败', '发布便签时出现错误')
      }
    } catch (error) {
      console.error('发布便签失败:', error)
      toast.error('发布失败', '网络连接失败')
    } finally {
      setOperationLoading(null)
    }
  }

  // 打开批量删除确认对话框
  const handleBatchDeleteClick = useCallback(() => {
    if (selectedNotes.length === 0) return
    setBatchDeleteConfirmOpen(true)
  }, [selectedNotes])

  // 确认批量删除选中的便签
  const confirmBatchDelete = async () => {
    if (selectedNotes.length === 0) return

    setPublishing(true)
    try {
      const deletePromises = selectedNotes.map(noteId =>
        fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.ok).length

      if (successCount === selectedNotes.length) {
        toast.success('批量删除成功', `已删除 ${successCount} 个便签`)
      } else {
        toast.error('部分删除失败', `成功删除 ${successCount}/${selectedNotes.length} 个便签`)
      }

      setSelectedNotes([])
      await fetchScheduledNotes()
    } catch (error) {
      console.error('批量删除失败:', error)
      toast.error('批量删除失败', '网络连接失败')
    } finally {
      setPublishing(false)
      setBatchDeleteConfirmOpen(false)
    }
  }

  // 切换便签选中状态
  const toggleNoteSelection = (noteId: number) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (!data) return

    const allNoteIds = [
      ...data.notes.readyToPublish.map(n => n.id),
      ...data.notes.pending.map(n => n.id)
    ]

    if (selectedNotes.length === allNoteIds.length) {
      setSelectedNotes([])
    } else {
      setSelectedNotes(allNoteIds)
    }
  }, [data, selectedNotes])

  // 打开编辑对话框
  const openEditDialog = (note: ScheduledNote) => {
    setEditingNote(note)
    setIsEditDialogOpen(true)
  }

  // 保存编辑的便签
  const handleSaveEdit = async (noteId: number, publishAt: Date | null, status: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          publishAt: publishAt ? publishAt.toISOString() : null
        })
      })

      if (response.ok) {
        toast.success('修改成功', '便签设置已更新')
        await fetchScheduledNotes()
      } else {
        toast.error('修改失败', '更新便签设置时出现错误')
      }
    } catch (error) {
      console.error('修改便签失败:', error)
      toast.error('修改失败', '网络连接失败')
    }
  }

  // 初始化数据获取
  useEffect(() => {
    fetchScheduledNotes()

    // 监听刷新事件
    const handleRefresh = () => {
      fetchScheduledNotes()
    }

    window.addEventListener('refreshScheduledNotes', handleRefresh)

    return () => {
      window.removeEventListener('refreshScheduledNotes', handleRefresh)
    }
  }, [])

  // 键盘快捷键处理函数
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+A 全选
    if (event.ctrlKey && event.key === 'a' && data && data.total > 0) {
      event.preventDefault()
      toggleSelectAll()
    }
    // Delete 键删除选中的便签
    if (event.key === 'Delete' && selectedNotes.length > 0) {
      event.preventDefault()
      handleBatchDeleteClick()
    }
  }, [data, selectedNotes, toggleSelectAll, handleBatchDeleteClick])

  // 键盘快捷键监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const isOverdue = (publishAt: string) => {
    return new Date(publishAt) <= new Date()
  }

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            定时便签管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">加载中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            定时便签管理
            {data && (
              <Badge variant="secondary" className="ml-2">
                {data.total} 个便签
              </Badge>
            )}
            {selectedNotes.length > 0 && (
              <Badge variant="default" className="ml-2 bg-primary text-primary-foreground">
                已选中 {selectedNotes.length} 个
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScheduledNotes}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            {data && data.total > 0 && (
              <Button
                variant={selectedNotes.length === (data.notes.readyToPublish.length + data.notes.pending.length) ? "default" : "outline"}
                size="sm"
                onClick={toggleSelectAll}
                className={selectedNotes.length === (data.notes.readyToPublish.length + data.notes.pending.length) ? "bg-primary text-primary-foreground" : ""}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedNotes.length === (data.notes.readyToPublish.length + data.notes.pending.length) ? '取消全选' : '全选'}
                {selectedNotes.length > 0 && selectedNotes.length < (data.notes.readyToPublish.length + data.notes.pending.length) && (
                  <span className="ml-1 text-xs opacity-70">({selectedNotes.length}/{data.notes.readyToPublish.length + data.notes.pending.length})</span>
                )}
              </Button>
            )}
            {selectedNotes.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDeleteClick}
                disabled={publishing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除选中 ({selectedNotes.length})
              </Button>
            )}
            {data && data.readyToPublish > 0 && (
              <Button
                size="sm"
                onClick={publishScheduledNotes}
                disabled={publishing}
              >
                <Play className="h-4 w-4 mr-2" />
                发布到期便签 ({data.readyToPublish})
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data ? (
          <>
            {/* 快捷键提示 */}
            {data.total > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                💡 快捷键：<kbd className="px-1 py-0.5 bg-background border rounded text-xs">Ctrl+A</kbd> 全选，
                <kbd className="px-1 py-0.5 bg-background border rounded text-xs">Delete</kbd> 删除选中
              </div>
            )}

            {/* 统计信息 */}
            <div className="flex gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                总计: {data.total}
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                待发布: {data.readyToPublish}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                等待中: {data.pending}
              </Badge>
            </div>

            {/* 待发布的便签 */}
            {data.notes.readyToPublish.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-destructive">
                  待发布便签 ({data.notes.readyToPublish.length})
                </h4>
                <div className="space-y-2">
                  {data.notes.readyToPublish.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-3 border rounded-md bg-destructive/5"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedNotes.includes(note.id)}
                          onChange={() => toggleNoteSelection(note.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{note.title}</p>
                          <p className="text-xs text-muted-foreground">
                            计划发布: {formatDate(note.publishAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          已到期
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(note)}
                            disabled={operationLoading === note.id}
                            className="h-8 w-8 p-0"
                            title="编辑"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishSingleNote(note.id)}
                            disabled={operationLoading === note.id}
                            className="h-8 w-8 p-0"
                            title="立即发布"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(note.id)}
                            disabled={operationLoading === note.id}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="删除"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 等待中的便签 */}
            {data.notes.pending.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">
                  等待发布 ({data.notes.pending.length})
                </h4>
                <div className="space-y-2">
                  {data.notes.pending.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedNotes.includes(note.id)}
                          onChange={() => toggleNoteSelection(note.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{note.title}</p>
                          <p className="text-xs text-muted-foreground">
                            计划发布: {formatDate(note.publishAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          等待中
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(note)}
                            disabled={operationLoading === note.id}
                            className="h-8 w-8 p-0"
                            title="编辑"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishSingleNote(note.id)}
                            disabled={operationLoading === note.id}
                            className="h-8 w-8 p-0"
                            title="立即发布"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(note.id)}
                            disabled={operationLoading === note.id}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="删除"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.total === 0 && (
              <p className="text-muted-foreground text-center py-4">
                暂无定时便签
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">无法加载定时便签数据</p>
        )}
      </CardContent>

      {/* 编辑对话框 */}
      <ScheduledNoteEditDialog
        note={editingNote}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingNote(null)
        }}
        onSave={handleSaveEdit}
      />

      {/* 单个删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个定时便签吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteScheduledNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={batchDeleteConfirmOpen} onOpenChange={setBatchDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除选中的 {selectedNotes.length} 个定时便签吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除全部
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
