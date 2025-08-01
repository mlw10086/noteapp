'use client'

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TagManagerProps {
  allTags: string[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  onClearFilters: () => void
}

export function TagManager({ allTags, selectedTags, onTagToggle, onClearFilters }: TagManagerProps) {
  if (allTags.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">标签筛选</h3>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            清除筛选
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag, index) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <Badge
              key={`tag-manager-${index}-${tag}`}
              variant={isSelected ? "default" : "secondary"}
              className={`cursor-pointer transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/80'
              }`}
              onClick={() => onTagToggle(tag)}
            >
              {tag}
              {isSelected && <X className="ml-1 h-3 w-3" />}
            </Badge>
          )
        })}
      </div>
      
      {selectedTags.length > 0 && (
        <div className="text-xs text-muted-foreground">
          已选择 {selectedTags.length} 个标签
        </div>
      )}
    </div>
  )
}
