'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast, ToastContainer } from "@/components/Toast"
import { Eye, EyeOff, UserPlus, LogIn } from "lucide-react"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)
  const router = useRouter()
  const { toasts, toast, removeToast } = useToast()
  const { data: session, status } = useSession()

  // 获取公开设置
  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const response = await fetch('/api/settings/public')
        if (response.ok) {
          const settings = await response.json()
          setRegistrationEnabled(settings.site_registration_enabled !== false)
        } else {
          setRegistrationEnabled(true) // 默认允许注册
        }
      } catch (error) {
        console.error('获取公开设置失败:', error)
        setRegistrationEnabled(true) // 默认允许注册
      }
    }
    fetchPublicSettings()
  }, [])

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 验证密码匹配
    if (password !== confirmPassword) {
      toast.error("注册失败", "两次输入的密码不一致")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("注册成功", "正在为您自动登录...")

        // 自动登录
        try {
          const signInResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          })

          if (signInResult?.ok) {
            toast.success("登录成功", "欢迎使用便签系统！")
            router.push("/")
          } else {
            toast.error("自动登录失败", "请手动登录")
            router.push("/auth/signin")
          }
        } catch (loginError) {
          console.error('自动登录错误:', loginError)
          toast.error("自动登录失败", "请手动登录")
          router.push("/auth/signin")
        }
      } else {
        toast.error("注册失败", data.error || "注册时出现错误")
      }
    } catch (error) {
      console.error("注册错误:", error)
      toast.error("注册失败", "网络连接失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 如果正在加载认证状态或设置，显示加载提示
  if (status === "loading" || registrationEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  // 如果已认证，不渲染页面内容（将被重定向）
  if (status === "authenticated") {
    return null
  }

  // 如果注册功能已关闭，显示提示信息
  if (registrationEnabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">注册暂时关闭</CardTitle>
            <CardDescription className="text-center">
              系统管理员已暂时关闭用户注册功能
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              如需注册账户，请联系系统管理员
            </p>
            <div className="flex justify-center">
              <Link href="/auth/signin">
                <Button variant="outline">
                  <LogIn className="h-4 w-4 mr-2" />
                  返回登录
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">
            创建一个新账户来开始使用便签系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                type="text"
                placeholder="请输入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !registrationEnabled}>
              {isLoading ? (
                "注册中..."
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  注册
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            已有账户？{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
