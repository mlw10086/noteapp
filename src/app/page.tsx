'use client'

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
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
import { Plus } from "lucide-react"
import { NoteList } from "@/components/NoteList"
import { NoteEditor } from "@/components/NoteEditor"
import { TagManager } from "@/components/TagManager"
import { AuthGuard } from "@/components/AuthGuard"
import { useToast, ToastContainer } from "@/components/Toast"
import { useSearch } from "@/contexts/SearchContext"

interface Note {
  id: number
  title: string
  content: string | null
  color: string
  tags: string[]
  status: 'published' | 'draft' | 'scheduled'
  publishAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<number[]>([])
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false)
  const { toasts, toast, removeToast } = useToast()
  const { searchQuery } = useSearch()
  const t = useTranslations()

  // 获取所有便签
  const fetchNotes = async () => {
    try {
      setError(null)
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        // 转换日期字符串为 Date 对象，并只显示已发布的便签
        const notesWithDates = data
          .filter((note: any) => note.status === 'published')
          .map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
            publishAt: note.publishAt ? new Date(note.publishAt) : null
          }))
        setNotes(notesWithDates)
      } else {
        setError('获取便签失败')
      }
    } catch (error) {
      console.error('获取便签失败:', error)
      setError('网络连接失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取所有标签
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const tags = await response.json()
        setAllTags(tags)
      }
    } catch (error) {
      console.error('获取标签失败:', error)
    }
  }

  useEffect(() => {
    fetchNotes()
    fetchTags()
  }, [])

  // 过滤便签
  const filteredNotes = notes.filter(note => {
    // 搜索查询过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))

      if (!matchesSearch) return false
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      const hasSelectedTags = selectedTags.every(tag => note.tags.includes(tag))
      if (!hasSelectedTags) return false
    }

    return true
  })

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在没有输入框聚焦时处理快捷键
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl+A 全选便签
      if (event.ctrlKey && event.key === 'a' && filteredNotes.length > 0) {
        event.preventDefault()
        toggleSelectAll()
      }
      // Delete 键删除选中的便签
      if (event.key === 'Delete' && selectedNotes.length > 0) {
        event.preventDefault()
        handleBatchDeleteClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [filteredNotes.length, selectedNotes.length])

  // 保存便签
  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      const isEditing = noteData.id !== undefined
      const url = isEditing ? `/api/notes/${noteData.id}` : '/api/notes'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      })

      if (response.ok) {
        const savedNote = await response.json()

        // 刷新数据
        await fetchNotes()
        await fetchTags()

        // 关闭编辑器
        handleCloseEditor()

        // 显示成功提示
        if (isEditing) {
          toast.success("更新成功", "便签已成功更新")
        } else {
          if (noteData.status === 'scheduled') {
            toast.success("定时便签创建成功", `便签将在 ${new Date(noteData.publishAt!).toLocaleString('zh-CN')} 发布`)
          } else if (noteData.status === 'draft') {
            toast.success("草稿保存成功", "便签已保存为草稿")
          } else {
            toast.success("发布成功", "便签已成功发布")
          }
        }
      } else {
        const errorData = await response.json()
        toast.error("保存失败", errorData.error || "保存便签时出现错误，请重试")
      }
    } catch (error) {
      console.error('保存便签失败:', error)
      toast.error("保存失败", "网络错误，请检查网络连接后重试")
    }
  }

  // 删除便签
  const handleDeleteNote = async (id: number) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchNotes()
        await fetchTags()
        // 显示删除成功提示
        toast.success(t('common.success'), t('notes.deleteNote'))
      } else {
        // 显示删除失败提示
        toast.error(t('common.error'), "删除便签时出现错误，请重试")
      }
    } catch (error) {
      console.error('删除便签失败:', error)
      // 显示网络错误提示
      toast.error(t('common.error'), "网络连接失败，请检查网络后重试")
    }
  }

  // 批量删除便签
  const handleBatchDelete = async () => {
    if (selectedNotes.length === 0) return

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
      await fetchNotes()
      await fetchTags()
    } catch (error) {
      console.error('批量删除失败:', error)
      toast.error('批量删除失败', '网络连接失败')
    } finally {
      setBatchDeleteConfirmOpen(false)
    }
  }

  // 编辑便签
  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsEditorOpen(true)
  }

  // 新建便签
  const handleNewNote = () => {
    setEditingNote(null)
    setIsEditorOpen(true)
  }

  // 关闭编辑器
  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingNote(null)
  }

  // 标签筛选
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 清除标签筛选
  const handleClearTagFilters = () => {
    setSelectedTags([])
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
  const toggleSelectAll = () => {
    if (selectedNotes.length === filteredNotes.length) {
      setSelectedNotes([])
    } else {
      setSelectedNotes(filteredNotes.map(note => note.id))
    }
  }

  // 打开批量删除确认对话框
  const handleBatchDeleteClick = () => {
    if (selectedNotes.length === 0) return
    setBatchDeleteConfirmOpen(true)
  }



  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-destructive">{error}</div>
          <Button onClick={() => {
            setLoading(true)
            fetchNotes()
            fetchTags()
          }}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen custom-scrollbar">
        <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            我的便签
          </h1>
          <Button onClick={handleNewNote} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            新建便签
          </Button>
        </div>

        {/* 标签筛选 */}
        <div className="mb-6 sm:mb-8">
          <TagManager
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearFilters={handleClearTagFilters}
          />
        </div>



        {/* 统计信息 */}
        {notes.length > 0 && (
          <div className="mb-6 text-sm text-muted-foreground">
            共 {notes.length} 个便签
            {filteredNotes.length !== notes.length && (
              <span>，显示 {filteredNotes.length} 个</span>
            )}
          </div>
        )}

        {/* 便签列表 */}
        <NoteList
          notes={filteredNotes}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          searchQuery={searchQuery}
          selectedNotes={selectedNotes}
          onToggleSelection={toggleNoteSelection}
          onToggleSelectAll={toggleSelectAll}
          onBatchDelete={handleBatchDeleteClick}
        />

        {/* 编辑器 */}
        <NoteEditor
          note={editingNote}
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          onSave={handleSaveNote}
        />

        {/* Toast 容器 */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* 批量删除确认对话框 */}
        <AlertDialog open={batchDeleteConfirmOpen} onOpenChange={setBatchDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除选中的 {selectedNotes.length} 个便签吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </AuthGuard>
  )
}
