'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Type, Save, Tag, Plus, X } from "lucide-react"

interface NoteSettingsProps {
  toast: any
}

const NOTE_COLORS = [
  { name: "默认", value: "#ffffff", class: "bg-white" },
  { name: "黄色", value: "#fef3c7", class: "bg-yellow-100" },
  { name: "绿色", value: "#d1fae5", class: "bg-green-100" },
  { name: "蓝色", value: "#dbeafe", class: "bg-blue-100" },
  { name: "紫色", value: "#e9d5ff", class: "bg-purple-100" },
  { name: "粉色", value: "#fce7f3", class: "bg-pink-100" },
  { name: "橙色", value: "#fed7aa", class: "bg-orange-100" },
]

export function NoteSettings({ toast }: NoteSettingsProps) {
  const [defaultColor, setDefaultColor] = useState("#ffffff")
  const [fontSize, setFontSize] = useState([14])
  const [autoSaveInterval, setAutoSaveInterval] = useState([30])
  const [defaultTags, setDefaultTags] = useState<string[]>(["工作", "个人"])
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    loadNoteSettings()
  }, [])

  const loadNoteSettings = async () => {
    try {
      // TODO: 从 API 加载便签设置
      // const response = await fetch('/api/user/note-settings')
      // const settings = await response.json()
      // 暂时使用默认值
    } catch (error) {
      console.error('加载便签设置失败:', error)
    }
  }

  const saveSettings = async (key: string, value: any) => {
    try {
      // TODO: 保存设置到 API
      toast.success("设置已保存", "便签设置已更新")
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error("保存失败", "设置保存时出现错误")
    }
  }

  const handleColorChange = (color: string) => {
    setDefaultColor(color)
    saveSettings('defaultColor', color)
  }

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value)
    saveSettings('fontSize', value[0])
  }

  const handleAutoSaveIntervalChange = (value: number[]) => {
    setAutoSaveInterval(value)
    saveSettings('autoSaveInterval', value[0])
  }

  const handleAddTag = () => {
    if (newTag.trim() && !defaultTags.includes(newTag.trim())) {
      const updatedTags = [...defaultTags, newTag.trim()]
      setDefaultTags(updatedTags)
      setNewTag("")
      saveSettings('defaultTags', updatedTags)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = defaultTags.filter(tag => tag !== tagToRemove)
    setDefaultTags(updatedTags)
    saveSettings('defaultTags', updatedTags)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
    }
  }

  return (
    <div className="space-y-6">
      {/* 默认外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            默认外观
          </CardTitle>
          <CardDescription>
            设置新建便签的默认外观
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>默认便签颜色</Label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all hover:scale-105
                    ${color.class}
                    ${defaultColor === color.value 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              当前选择：{NOTE_COLORS.find(c => c.value === defaultColor)?.name}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 编辑器设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            编辑器设置
          </CardTitle>
          <CardDescription>
            自定义便签编辑器的行为
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>默认字体大小: {fontSize[0]}px</Label>
            <Slider
              value={fontSize}
              onValueChange={handleFontSizeChange}
              max={24}
              min={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 自动保存设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            自动保存
          </CardTitle>
          <CardDescription>
            设置自动保存的频率
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>自动保存间隔: {autoSaveInterval[0]}秒</Label>
            <Slider
              value={autoSaveInterval}
              onValueChange={handleAutoSaveIntervalChange}
              max={300}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>10秒</span>
              <span>5分钟</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 默认标签设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            默认标签
          </CardTitle>
          <CardDescription>
            管理您的常用标签
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>当前默认标签</Label>
            <div className="flex flex-wrap gap-2">
              {defaultTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>添加新标签</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签名称"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
