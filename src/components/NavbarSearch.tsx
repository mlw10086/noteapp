'use client'

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Command } from "lucide-react"
import { useSearch } from "@/contexts/SearchContext"
import { cn } from "@/lib/utils"

export function NavbarSearch() {
  const { searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused } = useSearch()
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 处理搜索输入
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  // 展开搜索框
  const expandSearch = () => {
    setIsExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // 收起搜索框
  const collapseSearch = () => {
    if (!searchQuery) {
      setIsExpanded(false)
    }
  }

  // 处理焦点
  const handleFocus = () => {
    setIsSearchFocused(true)
    setIsExpanded(true)
  }

  const handleBlur = () => {
    setIsSearchFocused(false)
    if (!searchQuery) {
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K 或 Cmd+K 打开搜索
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        expandSearch()
      }
      // / 键打开搜索（当没有输入框聚焦时）
      if (event.key === '/' && !isSearchFocused && 
          !(event.target instanceof HTMLInputElement) && 
          !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault()
        expandSearch()
      }
      // Escape 键关闭搜索
      if (event.key === 'Escape' && isSearchFocused) {
        inputRef.current?.blur()
        if (!searchQuery) {
          setIsExpanded(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchFocused, searchQuery])

  return (
    <div className="flex items-center">
      {/* 桌面端搜索框 */}
      <div className="hidden md:flex items-center">
        <div className={cn(
          "relative transition-all duration-200 ease-in-out",
          isExpanded ? "w-64" : "w-48"
        )}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            placeholder="搜索便签..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "pl-10 pr-20 h-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors",
              isExpanded && "bg-background"
            )}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {!isSearchFocused && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端搜索按钮 */}
      <div className="md:hidden">
        {!isExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={expandSearch}
            className="h-9 w-9 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        ) : (
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="pl-10 pr-10 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
