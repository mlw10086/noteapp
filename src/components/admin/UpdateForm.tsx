'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import { Save } from "lucide-react"

interface SystemUpdate {
  id: number
  version: string
  title: string
  content: string
  type: string
  priority: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  admin: {
    id: number
    name: string
    email: string
  }
}

interface UpdateFormProps {
  update?: SystemUpdate
  onSuccess: () => void
}

export function UpdateForm({ update, onSuccess }: UpdateFormProps) {
  const [formData, setFormData] = useState({
    version: update?.version || '',
    title: update?.title || '',
    content: update?.content || '',
    type: update?.type || 'feature',
    priority: update?.priority || 'normal',
    isPublished: update?.isPublished || false
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.version || !formData.title || !formData.content) {
      alert('请填写所有必填字段')
      return
    }

    setIsLoading(true)

    try {
      const url = update 
        ? `/api/admin/updates/${update.id}`
        : '/api/admin/updates'
      
      const method = update ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        alert(data.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      alert('网络连接失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version">版本号 *</Label>
          <Input
            id="version"
            placeholder="例如: 1.2.0"
            value={formData.version}
            onChange={(e) => handleInputChange('version', e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">更新类型</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature">新功能</SelectItem>
              <SelectItem value="bugfix">修复</SelectItem>
              <SelectItem value="improvement">改进</SelectItem>
              <SelectItem value="security">安全</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">更新标题 *</Label>
          <Input
            id="title"
            placeholder="例如: 新增便签协作功能"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">优先级</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="normal">普通</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="critical">紧急</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 更新内容 */}
      <div className="space-y-2">
        <Label htmlFor="content">更新内容 * (支持 Markdown)</Label>
        <MarkdownEditor
          value={formData.content}
          onChange={(value) => handleInputChange('content', value)}
          placeholder="请输入更新内容，支持 Markdown 格式..."
          height={400}
        />
      </div>

      {/* 发布设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">发布设置</CardTitle>
          <CardDescription>
            控制更新记录的发布状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="isPublished">
              {formData.isPublished ? '立即发布' : '保存为草稿'}
            </Label>
          </div>
          {formData.isPublished && (
            <p className="text-sm text-muted-foreground mt-2">
              发布后，用户将能够看到此更新记录
            </p>
          )}
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? '保存中...' : (update ? '更新' : '创建')}
        </Button>
      </div>
    </form>
  )
}
