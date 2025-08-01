'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Mail, Clock, MessageSquare } from "lucide-react"

interface NotificationSettingsProps {
  toast: any
}

export function NotificationSettings({ toast }: NotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [scheduledReminders, setScheduledReminders] = useState(true)
  const [systemMessages, setSystemMessages] = useState(true)
  const [reminderFrequency, setReminderFrequency] = useState("daily")
  const [reminderTime, setReminderTime] = useState("09:00")

  useEffect(() => {
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      // TODO: 从 API 加载通知设置
      // const response = await fetch('/api/user/notification-settings')
      // const settings = await response.json()
      // 暂时使用默认值
    } catch (error) {
      console.error('加载通知设置失败:', error)
    }
  }

  const saveSettings = async (key: string, value: any) => {
    try {
      // TODO: 保存设置到 API
      toast.success("设置已保存", "通知设置已更新")
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error("保存失败", "设置保存时出现错误")
    }
  }

  const handleEmailNotificationsChange = (enabled: boolean) => {
    setEmailNotifications(enabled)
    saveSettings('emailNotifications', enabled)
  }

  const handleScheduledRemindersChange = (enabled: boolean) => {
    setScheduledReminders(enabled)
    saveSettings('scheduledReminders', enabled)
  }

  const handleSystemMessagesChange = (enabled: boolean) => {
    setSystemMessages(enabled)
    saveSettings('systemMessages', enabled)
  }

  const handleReminderFrequencyChange = (frequency: string) => {
    setReminderFrequency(frequency)
    saveSettings('reminderFrequency', frequency)
  }

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time)
    saveSettings('reminderTime', time)
  }

  return (
    <div className="space-y-6">
      {/* 邮件通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            邮件通知
          </CardTitle>
          <CardDescription>
            管理邮件通知的发送设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用邮件通知</Label>
              <p className="text-sm text-muted-foreground">
                接收重要更新和提醒的邮件通知
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleEmailNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* 定时提醒设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            定时提醒
          </CardTitle>
          <CardDescription>
            设置定时便签的提醒方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用定时提醒</Label>
              <p className="text-sm text-muted-foreground">
                在定时便签发布前收到提醒
              </p>
            </div>
            <Switch
              checked={scheduledReminders}
              onCheckedChange={handleScheduledRemindersChange}
            />
          </div>

          {scheduledReminders && (
            <>
              <div className="space-y-2">
                <Label>提醒频率</Label>
                <Select value={reminderFrequency} onValueChange={handleReminderFrequencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">立即提醒</SelectItem>
                    <SelectItem value="hourly">每小时</SelectItem>
                    <SelectItem value="daily">每日</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>提醒时间</Label>
                <Select value={reminderTime} onValueChange={handleReminderTimeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">上午 8:00</SelectItem>
                    <SelectItem value="09:00">上午 9:00</SelectItem>
                    <SelectItem value="10:00">上午 10:00</SelectItem>
                    <SelectItem value="12:00">中午 12:00</SelectItem>
                    <SelectItem value="14:00">下午 2:00</SelectItem>
                    <SelectItem value="18:00">下午 6:00</SelectItem>
                    <SelectItem value="20:00">晚上 8:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 系统消息设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            系统消息
          </CardTitle>
          <CardDescription>
            管理系统消息和更新通知
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>系统消息通知</Label>
              <p className="text-sm text-muted-foreground">
                接收系统更新、维护通知等消息
              </p>
            </div>
            <Switch
              checked={systemMessages}
              onCheckedChange={handleSystemMessagesChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* 通知摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知摘要
          </CardTitle>
          <CardDescription>
            当前通知设置概览
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>邮件通知</span>
              <span className={emailNotifications ? "text-green-600" : "text-muted-foreground"}>
                {emailNotifications ? "已启用" : "已禁用"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>定时提醒</span>
              <span className={scheduledReminders ? "text-green-600" : "text-muted-foreground"}>
                {scheduledReminders ? "已启用" : "已禁用"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>系统消息</span>
              <span className={systemMessages ? "text-green-600" : "text-muted-foreground"}>
                {systemMessages ? "已启用" : "已禁用"}
              </span>
            </div>
            {scheduledReminders && (
              <>
                <div className="flex justify-between">
                  <span>提醒频率</span>
                  <span className="text-muted-foreground">
                    {reminderFrequency === "immediate" && "立即提醒"}
                    {reminderFrequency === "hourly" && "每小时"}
                    {reminderFrequency === "daily" && "每日"}
                    {reminderFrequency === "weekly" && "每周"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>提醒时间</span>
                  <span className="text-muted-foreground">{reminderTime}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
