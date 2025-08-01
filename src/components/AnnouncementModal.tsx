'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { MarkdownPreview } from './MarkdownPreview'

interface Announcement {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: number
  createdAt: string
}

interface AnnouncementModalProps {
  announcements: Announcement[]
  isOpen: boolean
  onClose: () => void
  onDismiss: (announcementId: number) => void
  initialAnnouncementId?: number
}

export function AnnouncementModal({ 
  announcements, 
  isOpen, 
  onClose, 
  onDismiss,
  initialAnnouncementId 
}: AnnouncementModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialAnnouncementId) {
      const index = announcements.findIndex(a => a.id === initialAnnouncementId)
      return index >= 0 ? index : 0
    }
    return 0
  })

  const currentAnnouncement = announcements[currentIndex]

  if (!currentAnnouncement) {
    return null
  }

  const handleDismiss = async (announcementId: number) => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        onDismiss(announcementId)
        
        // 如果当前公告被关闭，切换到下一个
        if (announcementId === currentAnnouncement.id) {
          if (announcements.length > 1) {
            const nextIndex = currentIndex < announcements.length - 1 ? currentIndex : currentIndex - 1
            setCurrentIndex(nextIndex)
          } else {
            onClose()
          }
        }
      }
    } catch (error) {
      console.error('关闭公告失败:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getIcon(currentAnnouncement.type)}
              <DialogTitle className="text-lg font-semibold">
                {currentAnnouncement.title}
              </DialogTitle>
            </div>
            <Badge className={getTypeColor(currentAnnouncement.type)}>
              {currentAnnouncement.type === 'info' && '信息'}
              {currentAnnouncement.type === 'warning' && '警告'}
              {currentAnnouncement.type === 'success' && '成功'}
              {currentAnnouncement.type === 'error' && '错误'}
            </Badge>
          </div>
          
          <DialogDescription className="text-sm text-muted-foreground">
            发布时间：{new Date(currentAnnouncement.createdAt).toLocaleString('zh-CN')}
            {announcements.length > 1 && (
              <span className="ml-4">
                {currentIndex + 1} / {announcements.length}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {isMarkdownContent(currentAnnouncement.content) ? (
              <div className="prose prose-sm max-w-none">
                <MarkdownPreview 
                  source={currentAnnouncement.content}
                  theme="light"
                />
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {currentAnnouncement.content}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {announcements.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  上一个
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(announcements.length - 1, currentIndex + 1))}
                  disabled={currentIndex === announcements.length - 1}
                >
                  下一个
                </Button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDismiss(currentAnnouncement.id)}
            >
              不再显示
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
            >
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
