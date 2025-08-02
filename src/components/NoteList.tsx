'use client'

import { NoteCard } from "./NoteCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Trash2 } from "lucide-react"

interface Note {
  id: number
  title: string
  content: string | null
  color: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface NoteListProps {
  notes: Note[]
  onEdit: (note: Note) => void
  onDelete: (id: number) => void
  onCollaborate?: (note: Note) => void
  searchQuery?: string
  selectedNotes: number[]
  onToggleSelection: (noteId: number) => void
  onToggleSelectAll: () => void
  onBatchDelete: () => void
}

export function NoteList({
  notes,
  onEdit,
  onDelete,
  onCollaborate,
  searchQuery,
  selectedNotes,
  onToggleSelection,
  onToggleSelectAll,
  onBatchDelete
}: NoteListProps) {
  // 过滤便签
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.content?.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  if (filteredNotes.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20">
        <div className="text-muted-foreground text-base sm:text-lg">
          {searchQuery ? '没有找到匹配的便签' : '还没有便签，创建第一个吧！'}
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground/70 mt-2">
            尝试使用不同的关键词搜索
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 全选多选控制栏 */}
      {filteredNotes.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedNotes.length === filteredNotes.length ? "default" : "outline"}
                size="sm"
                onClick={onToggleSelectAll}
                className={selectedNotes.length === filteredNotes.length ? "bg-primary text-primary-foreground" : ""}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedNotes.length === filteredNotes.length ? '取消全选' : '全选'}
                {selectedNotes.length > 0 && selectedNotes.length < filteredNotes.length && (
                  <span className="ml-1 text-xs opacity-70">({selectedNotes.length}/{filteredNotes.length})</span>
                )}
              </Button>
              {selectedNotes.length > 0 && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  已选中 {selectedNotes.length} 个
                </Badge>
              )}
            </div>
            {/* 快捷键提示 */}
            <div className="text-xs text-muted-foreground hidden sm:block">
              💡 快捷键：<kbd className="px-1 py-0.5 bg-background border rounded text-xs">Ctrl+A</kbd> 全选，
              <kbd className="px-1 py-0.5 bg-background border rounded text-xs">Delete</kbd> 删除选中
            </div>
          </div>
          {selectedNotes.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBatchDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除选中 ({selectedNotes.length})
            </Button>
          )}
        </div>
      )}

      {/* 便签网格 */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            onCollaborate={onCollaborate}
            isSelected={selectedNotes.includes(note.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  )
}
