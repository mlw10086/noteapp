'use client'

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Sun, Moon, Monitor, Globe, Clock, Calendar } from "lucide-react"
import { useLanguage, type Locale } from "@/hooks/useLanguage"

interface PersonalPreferencesProps {
  toast: any
}

export function PersonalPreferences({ toast }: PersonalPreferencesProps) {
  const { theme, setTheme } = useTheme()
  const { changeLanguage, getCurrentLanguage, isPending } = useLanguage()
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)
  const [language, setLanguage] = useState<Locale>("zh")
  const [timezone, setTimezone] = useState("Asia/Shanghai")
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD")
  const [autoSave, setAutoSave] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLanguage(getCurrentLanguage())
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/user/privacy-settings')
      if (response.ok) {
        const settings = await response.json()
        if (settings.theme) setTheme(settings.theme)
        if (settings.language) setLanguage(settings.language)
        if (settings.timezone) setTimezone(settings.timezone)
        if (settings.dateFormat) setDateFormat(settings.dateFormat)
        if (typeof settings.autoSave === 'boolean') setAutoSave(settings.autoSave)
        if (typeof settings.autoSaveInterval === 'number') setAutoSaveInterval(settings.autoSaveInterval)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const saveSettings = async (key: string, value: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        toast.success(t('settings.saveSuccess'), t('settings.saveSuccess'))
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error(t('settings.saveFailed'), t('settings.saveFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    saveSettings('theme', newTheme)
  }

  const handleLanguageChange = (newLanguage: Locale) => {
    setLanguage(newLanguage)
    changeLanguage(newLanguage)
    saveSettings('language', newLanguage)
  }

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone)
    saveSettings('timezone', newTimezone)
  }

  const handleDateFormatChange = (newFormat: string) => {
    setDateFormat(newFormat)
    saveSettings('dateFormat', newFormat)
  }

  const handleAutoSaveChange = (enabled: boolean) => {
    setAutoSave(enabled)
    saveSettings('autoSave', enabled)
  }

  const handleAutoSaveIntervalChange = (interval: number) => {
    setAutoSaveInterval(interval)
    saveSettings('autoSaveInterval', interval)
  }

  if (!mounted) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6">
      {/* 主题设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {t('settings.theme')}
          </CardTitle>
          <CardDescription>
            选择您喜欢的界面主题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.theme')}</Label>
            <Select value={theme} onValueChange={handleThemeChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={t('settings.theme')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {t('settings.lightMode')}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {t('settings.darkMode')}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t('settings.systemMode')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 语言和地区设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings.language')}和地区
          </CardTitle>
          <CardDescription>
            设置您的语言和地区偏好
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.language')}</Label>
            <Select value={language} onValueChange={handleLanguageChange} disabled={isLoading || isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">{t('languages.zh')}</SelectItem>
                <SelectItem value="en">{t('languages.en')}</SelectItem>
                <SelectItem value="ja">{t('languages.ja')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.timezone')}</Label>
            <Select value={timezone} onValueChange={handleTimezoneChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Shanghai">{t('timezones.Asia/Shanghai')}</SelectItem>
                <SelectItem value="America/New_York">{t('timezones.America/New_York')}</SelectItem>
                <SelectItem value="Europe/London">{t('timezones.Europe/London')}</SelectItem>
                <SelectItem value="Asia/Tokyo">{t('timezones.Asia/Tokyo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.dateFormat')}</Label>
            <Select value={dateFormat} onValueChange={handleDateFormatChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">{t('dateFormats.YYYY-MM-DD')}</SelectItem>
                <SelectItem value="MM/DD/YYYY">{t('dateFormats.MM/DD/YYYY')}</SelectItem>
                <SelectItem value="DD/MM/YYYY">{t('dateFormats.DD/MM/YYYY')}</SelectItem>
                <SelectItem value="YYYY年MM月DD日">{t('dateFormats.YYYY年MM月DD日')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 系统行为设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            系统行为
          </CardTitle>
          <CardDescription>
            自定义系统的行为方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.autoSave')}</Label>
              <p className="text-sm text-muted-foreground">
                编辑便签时自动保存更改
              </p>
            </div>
            <Switch
              checked={autoSave}
              onCheckedChange={handleAutoSaveChange}
              disabled={isLoading}
            />
          </div>

          {autoSave && (
            <div className="space-y-2">
              <Label>自动保存间隔</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[autoSaveInterval]}
                  onValueChange={(value) => handleAutoSaveIntervalChange(value[0])}
                  min={1}
                  max={20}
                  step={2}
                  className="flex-1"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">
                  {autoSaveInterval}秒
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                设置自动保存的时间间隔（1-20秒）
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
