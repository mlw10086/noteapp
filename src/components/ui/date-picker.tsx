"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "选择日期和时间",
  disabled = false,
  className,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const currentDate = new Date()
  const [year, setYear] = React.useState<string>(
    date ? date.getFullYear().toString() : currentDate.getFullYear().toString()
  )
  const [month, setMonth] = React.useState<string>(
    date ? (date.getMonth() + 1).toString() : (currentDate.getMonth() + 1).toString()
  )
  const [day, setDay] = React.useState<string>(
    date ? date.getDate().toString() : currentDate.getDate().toString()
  )
  const [hour, setHour] = React.useState<string>(
    date ? date.getHours().toString().padStart(2, '0') : "09"
  )
  const [minute, setMinute] = React.useState<string>(
    date ? date.getMinutes().toString().padStart(2, '0') : "00"
  )

  React.useEffect(() => {
    if (date) {
      setYear(date.getFullYear().toString())
      setMonth((date.getMonth() + 1).toString())
      setDay(date.getDate().toString())
      setHour(date.getHours().toString().padStart(2, '0'))
      setMinute(date.getMinutes().toString().padStart(2, '0'))
    }
  }, [date])

  const updateDateTime = React.useCallback((newYear: string, newMonth: string, newDay: string, newHour: string, newMinute: string) => {
    if (newYear && newMonth && newDay && newHour && newMinute) {
      const newDate = new Date(parseInt(newYear), parseInt(newMonth) - 1, parseInt(newDay), parseInt(newHour), parseInt(newMinute))
      onDateChange?.(newDate)
    }
  }, [onDateChange])

  const handleYearChange = (value: string) => {
    setYear(value)
    updateDateTime(value, month, day, hour, minute)
  }

  const handleMonthChange = (value: string) => {
    setMonth(value)
    updateDateTime(year, value, day, hour, minute)
  }

  const handleDayChange = (value: string) => {
    setDay(value)
    updateDateTime(year, month, value, hour, minute)
  }

  const handleHourChange = (value: string) => {
    setHour(value)
    updateDateTime(year, month, day, value, minute)
  }

  const handleMinuteChange = (value: string) => {
    setMinute(value)
    updateDateTime(year, month, day, hour, value)
  }

  const handleCurrentTime = () => {
    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0')
    const currentMinute = Math.floor(now.getMinutes() / 5) * 5 // 取最接近的5分钟倍数
    const currentMinuteStr = currentMinute.toString().padStart(2, '0')

    setHour(currentHour)
    setMinute(currentMinuteStr)
    updateDateTime(year, month, day, currentHour, currentMinuteStr)
  }

  // 生成年份选项（当前年份前后10年）
  const generateYearOptions = () => {
    const currentYear = currentDate.getFullYear()
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i.toString())
    }
    return years
  }

  // 生成月份选项
  const generateMonthOptions = () => {
    const months = []
    for (let i = 1; i <= 12; i++) {
      months.push({ value: i.toString(), label: `${i}月` })
    }
    return months
  }

  // 生成日期选项（根据年月计算天数）
  const generateDayOptions = () => {
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i.toString())
    }
    return days
  }

  // 生成小时选项
  const generateHourOptions = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      const hourStr = i.toString().padStart(2, '0')
      hours.push({ value: hourStr, label: `${hourStr}时` })
    }
    return hours
  }

  // 生成分钟选项
  const generateMinuteOptions = () => {
    const minutes = []
    for (let i = 0; i < 60; i += 5) { // 每5分钟一个选项
      const minuteStr = i.toString().padStart(2, '0')
      minutes.push({ value: minuteStr, label: `${minuteStr}分` })
    }
    return minutes
  }



  return (
    <div className={cn("space-y-4", className)}>
      {/* 日期时间选择器标题 */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">选择日期和时间</Label>
      </div>

      {/* 日期选择器 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 年份选择 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">年份</Label>
          <Select value={year} onValueChange={handleYearChange} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent>
              {generateYearOptions().map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption}>
                  {yearOption}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 月份选择 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">月份</Label>
          <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((monthOption) => (
                <SelectItem key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 日期选择 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">日期</Label>
          <Select value={day} onValueChange={handleDayChange} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="日" />
            </SelectTrigger>
            <SelectContent>
              {generateDayOptions().map((dayOption) => (
                <SelectItem key={dayOption} value={dayOption}>
                  {dayOption}日
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 时间选择器 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">选择时间</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCurrentTime}
            disabled={disabled}
            className="text-xs h-7 px-2 flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            当前时间
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* 小时选择 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">小时</Label>
            <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="时" />
              </SelectTrigger>
              <SelectContent>
                {generateHourOptions().map((hourOption) => (
                  <SelectItem key={hourOption.value} value={hourOption.value}>
                    {hourOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 分钟选择 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">分钟</Label>
            <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="分" />
              </SelectTrigger>
              <SelectContent>
                {generateMinuteOptions().map((minuteOption) => (
                  <SelectItem key={minuteOption.value} value={minuteOption.value}>
                    {minuteOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 预览显示 */}
      {year && month && day && hour && minute && (
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            <span>
              将在 {year}年{month}月{day}日 {hour}:{minute} 发布
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
