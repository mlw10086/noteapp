'use client'

import { useState } from 'react'
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Announcement {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: number
  createdAt: string
}

interface AnnouncementBannerProps {
  announcements: Announcement[]
  onDismiss: (announcementId: number) => void
  onViewDetails: (announcement: Announcement) => void
}

export function AnnouncementBanner({ announcements, onDismiss, onViewDetails }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())

  // 过滤掉已关闭的公告
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedIds.has(announcement.id)
  )

  // 按优先级排序，只显示最高优先级的公告
  const topAnnouncement = visibleAnnouncements.sort((a, b) => b.priority - a.priority)[0]

  if (!topAnnouncement) {
    return null
  }

  const handleDismiss = async (announcementId: number) => {
    try {
      // 调用API关闭公告
      const response = await fetch(`/api/announcements/${announcementId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setDismissedIds(prev => new Set([...prev, announcementId]))
        onDismiss(announcementId)
      }
    } catch (error) {
      console.error('关闭公告失败:', error)
    }
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 mb-6 transition-all duration-300',
      getTypeStyles(topAnnouncement.type)
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(topAnnouncement.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">
              {topAnnouncement.title}
            </h3>
            {visibleAnnouncements.length > 1 && (
              <span className="text-xs opacity-70">
                +{visibleAnnouncements.length - 1} 更多
              </span>
            )}
          </div>
          
          <p className="text-sm opacity-90 line-clamp-2 mb-2">
            {topAnnouncement.content}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(topAnnouncement)}
              className="h-7 px-2 text-xs hover:bg-black/10"
            >
              查看详情
            </Button>
            <span className="text-xs opacity-60">
              {new Date(topAnnouncement.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDismiss(topAnnouncement.id)}
          className="flex-shrink-0 h-8 w-8 p-0 hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
