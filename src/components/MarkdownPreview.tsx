'use client'

import { useEffect, useState } from "react"

interface MarkdownPreviewProps {
  source: string
  className?: string
  theme?: 'light' | 'dark'
}

export function MarkdownPreview({ source, className = "", theme = 'light' }: MarkdownPreviewProps) {
  const [MDEditor, setMDEditor] = useState<any>(null)

  useEffect(() => {
    const loadMDEditor = async () => {
      try {
        const module = await import("@uiw/react-md-editor")
        setMDEditor(module.default)
      } catch (error) {
        console.error("Failed to load MDEditor:", error)
      }
    }

    loadMDEditor()
  }, [])

  if (!MDEditor) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        加载中...
      </div>
    )
  }

  return (
    <div className={className} data-color-mode={theme}>
      <MDEditor.Markdown source={source} />
    </div>
  )
}
