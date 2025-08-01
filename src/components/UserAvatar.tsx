'use client'

import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-6 w-6"
  }

  // 获取用户名首字母
  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // 生成基于用户名的背景颜色
  const getAvatarColor = (name?: string | null) => {
    if (!name) return "bg-primary/10 text-primary"
    
    const colors = [
      "bg-red-100 text-red-700",
      "bg-blue-100 text-blue-700", 
      "bg-green-100 text-green-700",
      "bg-yellow-100 text-yellow-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
      "bg-orange-100 text-orange-700"
    ]
    
    const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  if (user.image) {
    return (
      <div className={cn(
        "rounded-full overflow-hidden border-2 border-background shadow-sm",
        sizeClasses[size],
        className
      )}>
        <img
          src={user.image}
          alt={user.name || "用户头像"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 如果图片加载失败，隐藏图片元素，显示后备内容
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  const initials = getInitials(user.name)
  const colorClass = getAvatarColor(user.name)

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-medium border shadow-sm",
      sizeClasses[size],
      colorClass,
      className
    )}>
      {initials.length > 0 ? (
        <span className="select-none">{initials}</span>
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  )
}
