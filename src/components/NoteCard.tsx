'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, FileText, Clock, Eye, EyeOff, Users } from "lucide-react"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { MarkdownPreview } from "./MarkdownPreview"

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

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: number) => void
  onCollaborate?: (note: Note) => void
  isSelected?: boolean
  onToggleSelection?: (noteId: number) => void
}

export function NoteCard({ note, onEdit, onDelete, onCollaborate, isSelected = false, onToggleSelection }: NoteCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 检测内容是否包含 Markdown 语法
  const isMarkdownContent = (content: string) => {
    const markdownPatterns = [
      /^#{1,6}\s/m,           // 标题
      /\*\*.*\*\*/,           // 粗体
      /\*.*\*/,               // 斜体
      /`.*`/,                 // 行内代码
      /```[\s\S]*```/,        // 代码块
      /^\s*[-*+]\s/m,         // 无序列表
      /^\s*\d+\.\s/m,         // 有序列表
      /\[.*\]\(.*\)/,         // 链接
      /!\[.*\]\(.*\)/,        // 图片
      /^\s*>\s/m,             // 引用
    ]
    return markdownPatterns.some(pattern => pattern.test(content))
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(note.id)
    setShowDeleteDialog(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }

  return (
    <Card
      className={`group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full flex flex-col ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          {/* 复选框 */}
          {onToggleSelection && (
            <div className="flex-shrink-0 pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggleSelection(note.id)
                }}
                className="rounded cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="font-semibold text-base sm:text-lg line-clamp-2 flex-1 leading-tight"
                onClick={() => onEdit(note)}
              >
                {note.title}
              </h3>
              {/* 状态指示器 */}
              {note.status === 'draft' && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <EyeOff className="h-3 w-3" />
                  草稿
                </Badge>
              )}
              {note.status === 'scheduled' && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs border-orange-200 text-orange-700">
                  <Clock className="h-3 w-3" />
                  定时
                </Badge>
              )}
            </div>
            {/* 定时发布时间显示 */}
            {note.status === 'scheduled' && note.publishAt && (
              <p className="text-xs text-muted-foreground">
                将于 {new Date(note.publishAt).toLocaleString('zh-CN')} 发布
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onCollaborate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onCollaborate(note)
                }}
                title="协作管理"
              >
                <Users className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(note)
              }}
              title="编辑"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteClick()
              }}
              title="删除"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {note.content && (
          <div
            className="text-sm text-muted-foreground mb-3 flex-1 cursor-pointer"
            onClick={() => onEdit(note)}
          >
            {isMarkdownContent(note.content) ? (
              <div className="prose prose-sm max-w-none line-clamp-3">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">Markdown</span>
                </div>
                <MarkdownPreview
                  source={note.content}
                  className="prose-sm"
                  theme="light"
                />
              </div>
            ) : (
              <p className="line-clamp-3">
                {note.content}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto space-y-3">
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag, index) => (
                <Badge key={`tag-${note.id}-${index}`} variant="secondary" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge key={`more-tags-${note.id}`} variant="outline" className="text-xs px-2 py-0.5">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {formatDate(note.updatedAt)}
          </div>
        </div>
      </CardContent>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        noteTitle={note.title}
      />
    </Card>
  )
}
