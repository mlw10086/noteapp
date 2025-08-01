'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Send, FileText } from "lucide-react"
import { DateTimePicker } from "@/components/ui/date-picker"

interface ScheduledNote {
  id: number
  title: string
  publishAt: string
  createdAt: string
}

interface ScheduledNoteEditDialogProps {
  note: ScheduledNote | null
  isOpen: boolean
  onClose: () => void
  onSave: (noteId: number, publishAt: Date | null, status: string) => void
}

export function ScheduledNoteEditDialog({ 
  note, 
  isOpen, 
  onClose, 
  onSave 
}: ScheduledNoteEditDialogProps) {
  const [publishAt, setPublishAt] = useState<Date | null>(null)
  const [status, setStatus] = useState<'scheduled' | 'published' | 'draft'>('scheduled')

  useEffect(() => {
    if (note) {
      setPublishAt(new Date(note.publishAt))
      setStatus('scheduled')
    }
  }, [note])

  const handleSave = () => {
    if (!note) return
    
    const finalPublishAt = status === 'scheduled' ? publishAt : null
    onSave(note.id, finalPublishAt, status)
    onClose()
  }



  if (!note) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            编辑定时便签
          </DialogTitle>
          <DialogDescription>
            修改便签的发布时间和内容
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">便签标题</Label>
            <p className="text-sm font-semibold mt-1">{note.title}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">发布设置</Label>
            
            {/* 状态选择按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={status === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('published')}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                立即发布
              </Button>
              <Button
                type="button"
                variant={status === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('draft')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                转为草稿
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

            {/* 定时发布设置 */}
            {status === 'scheduled' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">发布时间</Label>
                  <div className="mt-2">
                    <DateTimePicker
                      date={publishAt || undefined}
                      onDateChange={(date) => setPublishAt(date || null)}
                      placeholder="选择发布时间"
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={status === 'scheduled' && !publishAt}
            >
              保存设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
