'use client'

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit, FileText } from "lucide-react"
import { MarkdownPreview } from "./MarkdownPreview"

// 动态导入 MDEditor 以避免 SSR 问题
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "开始编写你的便签...",
  height = 300 
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("edit")

  const handleChange = (val?: string) => {
    onChange(val || "")
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            编辑
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            预览
          </TabsTrigger>
          <TabsTrigger value="split" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            分屏
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <div data-color-mode="light" className="markdown-editor-container">
            <MDEditor
              value={value}
              onChange={handleChange}
              preview="edit"
              hideToolbar={false}
              height={height}
              data-color-mode="light"
              textareaProps={{
                placeholder,
                style: {
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  color: 'hsl(var(--foreground))',
                  backgroundColor: 'hsl(var(--background))',
                },
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div
            className="prose prose-sm max-w-none border rounded-md p-4 min-h-[300px] bg-background custom-scrollbar"
            style={{ height: `${height}px`, overflow: 'auto' }}
          >
            <MarkdownPreview
              source={value || "暂无内容"}
              className="prose prose-sm max-w-none"
              theme="light"
            />
          </div>
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          <div data-color-mode="light" className="markdown-editor-container">
            <MDEditor
              value={value}
              onChange={handleChange}
              preview="live"
              hideToolbar={false}
              height={height}
              data-color-mode="light"
              textareaProps={{
                placeholder,
                style: {
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  color: 'hsl(var(--foreground))',
                  backgroundColor: 'hsl(var(--background))',
                },
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
