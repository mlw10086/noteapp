'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CaptchaInput } from "@/components/admin/CaptchaInput"
import { Eye, EyeOff, Key } from "lucide-react"

interface ChangePasswordDialogProps {
  onError: (error: string) => void
  onSuccess: (message: string) => void
}

export function ChangePasswordDialog({ onError, onSuccess }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaSessionId, setCaptchaSessionId] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证新密码匹配
    if (newPassword !== confirmPassword) {
      onError("两次输入的新密码不一致")
      return
    }

    // 验证验证码
    if (!captcha) {
      onError("请输入验证码")
      return
    }

    if (!captchaSessionId) {
      onError("验证码会话无效，请刷新验证码")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          captcha,
          captchaSessionId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess("密码修改成功")
        setOpen(false)
        // 重置表单
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setCaptcha("")
        setCaptchaSessionId("")
      } else {
        onError(data.error || "修改密码失败")
      }
    } catch (error) {
      console.error("修改密码失败:", error)
      onError("网络连接失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 重置表单
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setCaptcha("")
      setCaptchaSessionId("")
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
    setOpen(newOpen)
  }

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 0, text: "太短" }
    if (password.length < 8) return { strength: 1, text: "弱" }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) return { strength: 1, text: "弱" }
    if (!/(?=.*\d)/.test(password)) return { strength: 2, text: "中等" }
    return { strength: 3, text: "强" }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4 mr-2" />
          修改密码
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>
            为了账户安全，请输入当前密码、新密码和验证码。新密码长度至少为6位。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 当前密码 */}
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="请输入当前密码"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isLoading}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* 新密码 */}
            <div className="grid gap-2">
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* 密码强度指示器 */}
              {newPassword && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-6 rounded ${
                          level <= passwordStrength.strength
                            ? level === 0
                              ? "bg-red-500"
                              : level === 1
                              ? "bg-yellow-500"
                              : level === 2
                              ? "bg-blue-500"
                              : "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    密码强度：{passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            {/* 确认新密码 */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* 密码匹配提示 */}
              {confirmPassword && (
                <div className="text-xs">
                  {newPassword === confirmPassword ? (
                    <span className="text-green-600">✓ 密码匹配</span>
                  ) : (
                    <span className="text-red-600">✗ 密码不匹配</span>
                  )}
                </div>
              )}
            </div>

            {/* 验证码 */}
            <div className="grid gap-2">
              <CaptchaInput
                value={captcha}
                onChange={setCaptcha}
                sessionId={captchaSessionId}
                onSessionIdChange={setCaptchaSessionId}
                disabled={isLoading}
                required
                apiEndpoint="/api/user/captcha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                !captcha ||
                newPassword !== confirmPassword
              }
            >
              {isLoading ? "修改中..." : "修改密码"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
