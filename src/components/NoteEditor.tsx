'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { X, Plus, FileText, Code, Clock, Calendar, Save } from "lucide-react"
import { MarkdownEditor } from "./MarkdownEditor"
import { DateTimePicker } from "@/components/ui/date-picker"
import { useAutoSave } from "@/hooks/useAutoSave"

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

interface NoteEditorProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (noteData: Partial<Note>) => void
}

const colorOptions = [
  '#ffffff', '#fef3c7', '#fecaca', '#fed7d7', 
  '#e0e7ff', '#d1fae5', '#f3e8ff', '#fce7f3'
]

export function NoteEditor({ note, isOpen, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('#ffffff')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('published')
  const [publishAt, setPublishAt] = useState<Date | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 自动保存相关
  const { autoSave, autoSaveInterval, loading: autoSaveLoading } = useAutoSave()
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastAutoSaveRef = useRef<string>('')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || '')
      setColor(note.color)
      setTags(note.tags)
      setStatus(note.status)
      setPublishAt(note.publishAt ? new Date(note.publishAt) : null)
      setLastSaved(note.updatedAt)
      setHasUnsavedChanges(false)
      lastAutoSaveRef.current = JSON.stringify({
        title: note.title,
        content: note.content || '',
        color: note.color,
        tags: note.tags
      })
    } else {
      setTitle('')
      setContent('')
      setColor('#ffffff')
      setTags([])
      setStatus('published')
      setPublishAt(null)
      setLastSaved(null)
      setHasUnsavedChanges(false)
      lastAutoSaveRef.current = ''
    }
    setNewTag('')
  }, [note, isOpen])

  // 自动保存函数
  const performAutoSave = useCallback(async () => {
    if (!title.trim() || !note?.id) return

    const currentContent = JSON.stringify({ title, content, color, tags })
    if (currentContent === lastAutoSaveRef.current) return

    try {
      // 只有在编辑现有便签时才自动保存
      onSave({
        id: note.id,
        title: title.trim(),
        content: content.trim() || null,
        color,
        tags,
        status: 'draft', // 自动保存时总是保存为草稿
        publishAt: null
      })

      lastAutoSaveRef.current = currentContent
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }, [title, content, color, tags, note?.id, onSave])

  // 监听内容变化，标记为有未保存的更改
  useEffect(() => {
    if (!note) return

    const currentContent = JSON.stringify({ title, content, color, tags })
    const originalContent = JSON.stringify({
      title: note.title,
      content: note.content || '',
      color: note.color,
      tags: note.tags
    })

    setHasUnsavedChanges(currentContent !== originalContent)
  }, [title, content, color, tags, note])

  // 自动保存定时器
  useEffect(() => {
    if (!autoSave || !isOpen || !note?.id || autoSaveLoading) return

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // 设置新的定时器
    autoSaveTimerRef.current = setInterval(() => {
      performAutoSave()
    }, autoSaveInterval * 1000)

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [autoSave, autoSaveInterval, isOpen, note?.id, autoSaveLoading, performAutoSave])

  // 手动保存函数
  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      id: note?.id,
      title: title.trim(),
      content: content.trim() || null,
      color,
      tags,
      status,
      publishAt
    })

    setLastSaved(new Date())
    setHasUnsavedChanges(false)
    onClose()
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {note ? '编辑便签' : '新建便签'}
              </DialogTitle>
              <DialogDescription>
                {note ? '修改便签的标题、内容、颜色和标签' : '创建一个新的便签，支持 Markdown 格式'}
              </DialogDescription>
            </div>

            {/* 自动保存状态指示器 */}
            {note && autoSave && !autoSaveLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4" />
                <span>
                  {hasUnsavedChanges ? '有未保存更改' : '已保存'}
                </span>
                {lastSaved && (
                  <span className="text-xs">
                    {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Input
              placeholder="便签标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">内容</label>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={isMarkdownMode}
                  onCheckedChange={setIsMarkdownMode}
                  id="markdown-mode"
                />
                <Label htmlFor="markdown-mode" className="text-sm">
                  <Code className="h-4 w-4 inline mr-1" />
                  Markdown
                </Label>
              </div>
            </div>

            {isMarkdownMode ? (
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="使用 Markdown 语法编写你的便签..."
                height={250}
              />
            ) : (
              <Textarea
                placeholder="在这里写下你的想法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] sm:min-h-[200px] resize-none custom-scrollbar"
              />
            )}

            {/* 状态栏 - 显示在编辑器下方 */}
            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>字数: {content.length}</span>
                {title.trim() && (
                  <span>标题: {title.trim().length} 字符</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isMarkdownMode && (
                  <span className="flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    Markdown
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">颜色</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    color === colorOption ? 'border-gray-400 ring-2 ring-gray-300' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">标签</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="添加标签..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <Badge key={`editor-tag-${index}-${tag}`} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* 定时发布设置 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">发布设置</label>

            <div className="space-y-3">
              {/* 发布状态选择 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={status === 'published' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('published')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  立即发布
                </Button>
                <Button
                  type="button"
                  variant={status === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('draft')}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  保存草稿
                </Button>
                <Button
                  type="button"
                  variant={status === 'scheduled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('scheduled')}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  定时发布
                </Button>
              </div>

              {/* 定时发布日期选择 */}
              {status === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="publish-date" className="text-sm">
                    发布时间
                  </Label>
                  <DateTimePicker
                    date={publishAt || undefined}
                    onDateChange={(date) => setPublishAt(date || null)}
                    placeholder="选择发布时间"
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 最多一年后
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="order-2 sm:order-1">
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || (status === 'scheduled' && !publishAt)}
              className="order-1 sm:order-2"
            >
              {status === 'published' ? '发布' : status === 'draft' ? '保存草稿' : '定时发布'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
