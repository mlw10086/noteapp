'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export function BeijingTime() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    // 立即设置当前时间
    setCurrentTime(new Date())

    // 设置定时器每秒更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // 清理定时器
    return () => clearInterval(timer)
  }, [])

  // 格式化北京时间
  const formatBeijingTime = (date: Date) => {
    // 使用 Intl.DateTimeFormat 获取准确的北京时间
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })

    const parts = formatter.formatToParts(date)
    const year = parts.find(part => part.type === 'year')?.value
    const month = parts.find(part => part.type === 'month')?.value
    const day = parts.find(part => part.type === 'day')?.value
    const hour = parts.find(part => part.type === 'hour')?.value
    const minute = parts.find(part => part.type === 'minute')?.value
    const second = parts.find(part => part.type === 'second')?.value

    return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
  }

  return (
    <div className="flex flex-col items-center space-y-1 text-sm text-gray-600 dark:text-gray-300">
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium whitespace-nowrap">
          {formatBeijingTime(currentTime)}
        </span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        北京时间
      </span>
    </div>
  )
}
