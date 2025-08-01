'use client'

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast, ToastContainer } from "@/components/Toast"
import { UserAvatar } from "@/components/UserAvatar"
import { EditNameDialog } from "@/components/EditNameDialog"
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog"
import { PageAccessControl } from "@/components/PageAccessControl"
import { useUserStatus } from "@/hooks/useUserStatus"
import { User, Mail, Calendar, LogOut, Settings } from "lucide-react"

interface UserStats {
  totalNotes: number
  scheduledNotes: number
  draftNotes: number
  usageDays: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toasts, toast, removeToast } = useToast()
  const { isBanned, isUnderObservation } = useUserStatus()
  const [userName, setUserName] = useState("")
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
    }

    // 加载用户统计数据
    if (session?.user) {
      loadUserStats()
    }
  }, [session?.user?.name])

  const loadUserStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const stats = await response.json()
        setUserStats(stats)
      } else {
        console.error('获取统计数据失败')
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      toast.success(t('common.success'), t('auth.logoutSuccess'))
      router.push("/auth/signin")
    } catch (error) {
      console.error("退出登录失败:", error)
      toast.error(t('common.error'), "退出登录时出现错误")
    }
  }

  const handleNameUpdate = (newName: string) => {
    setUserName(newName)
  }

  const handleError = (error: string) => {
    toast.error("操作失败", error)
  }

  const handleSuccess = (message: string) => {
    toast.success("操作成功", message)
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <PageAccessControl allowedForBanned={true} showBannedAlert={true}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {t('profile.title')}
              </h1>
              <p className="text-muted-foreground">
                管理您的账户信息和偏好设置
              </p>
            </div>
            <Button
              onClick={() => router.push('/settings')}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isBanned}
            >
              <Settings className="h-4 w-4 mr-2" />
              个人设置
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 用户信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.userInfo')}
              </CardTitle>
              <CardDescription>
                您的基本账户信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={{ ...session.user, name: userName }}
                  size="lg"
                  className="shadow-md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{userName}</p>
                    <EditNameDialog
                      currentName={userName}
                      onNameUpdate={handleNameUpdate}
                      onError={handleError}
                      onSuccess={handleSuccess}
                      disabled={isBanned}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">用户名</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{session.user.email}</p>
                  <p className="text-sm text-muted-foreground">邮箱地址</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">会员</p>
                  <p className="text-sm text-muted-foreground">账户类型</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 账户操作卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('profile.accountActions')}
              </CardTitle>
              <CardDescription>
                管理您的账户设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">账户状态</p>
                    <p className="text-sm text-muted-foreground">当前账户状态</p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    活跃
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">登录状态</p>
                    <p className="text-sm text-muted-foreground">当前登录状态</p>
                  </div>
                  <Badge variant="default">
                    已登录
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <ChangePasswordDialog
                  onError={handleError}
                  onSuccess={handleSuccess}
                  disabled={isBanned}
                />
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.signOut')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 使用统计 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>使用统计</CardTitle>
            <CardDescription>
              您在便签系统中的活动概览
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">{t('common.loading')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {userStats?.totalNotes ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">总便签数</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {userStats?.scheduledNotes ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">定时便签</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {userStats?.draftNotes ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">草稿便签</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {userStats?.usageDays ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">使用天数</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </PageAccessControl>
  )
}
