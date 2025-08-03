'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { User, Mail, Shield, Calendar, Edit, Lock, Eye, EyeOff, Save, X } from "lucide-react"
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface AdminProfile {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminProfilePage() {
  const { admin } = useAdminAuth()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 编辑姓名状态
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  // 修改密码状态
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    captcha: ''
  })
  const [captchaSessionId, setCaptchaSessionId] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // 成功提示
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setNewName(data.name)
      } else {
        console.error('获取管理员信息失败')
      }
    } catch (error) {
      console.error('获取管理员信息错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNameEdit = () => {
    setIsEditingName(true)
    setNewName(profile?.name || '')
  }

  const handleNameSave = async () => {
    if (!newName.trim()) {
      alert('姓名不能为空')
      return
    }

    setNameLoading(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, name: newName.trim() } : null)
        setIsEditingName(false)
        setSuccessMessage('姓名修改成功')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        alert(data.error || '修改姓名失败')
      }
    } catch (error) {
      console.error('修改姓名错误:', error)
      alert('网络连接失败，请重试')
    } finally {
      setNameLoading(false)
    }
  }

  const handleNameCancel = () => {
    setIsEditingName(false)
    setNewName(profile?.name || '')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码长度至少为6位')
      return
    }

    if (!passwordForm.captcha) {
      setPasswordError('请输入验证码')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')

    try {
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          captcha: passwordForm.captcha,
          captchaSessionId: captchaSessionId
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsPasswordDialogOpen(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          captcha: ''
        })
        setCaptchaSessionId('')
        setSuccessMessage('密码修改成功，请重新登录')
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
      } else {
        setPasswordError(data.error || '修改密码失败')
      }
    } catch (error) {
      console.error('修改密码错误:', error)
      setPasswordError('网络连接失败，请重试')
    } finally {
      setPasswordLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: '超级管理员',
      admin: '管理员',
      moderator: '版主'
    }
    return roles[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      moderator: 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AdminLayout title="个人设置" description="管理您的账户信息和安全设置">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!profile) {
    return (
      <AdminLayout title="个人设置" description="管理您的账户信息和安全设置">
        <div className="text-center py-8">
          <p className="text-muted-foreground">无法加载管理员信息</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="个人设置"
      description="管理您的账户信息和安全设置"
    >
      <div className="space-y-6">
        {/* 成功提示 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本信息
              </CardTitle>
              <CardDescription>
                您的账户基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 姓名 */}
              <div className="space-y-2">
                <Label>姓名</Label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={nameLoading}
                      placeholder="请输入姓名"
                    />
                    <Button
                      size="sm"
                      onClick={handleNameSave}
                      disabled={nameLoading}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNameCancel}
                      disabled={nameLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{profile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleNameEdit}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label>邮箱</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
              </div>

              {/* 角色 */}
              <div className="space-y-2">
                <Label>角色</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge className={getRoleColor(profile.role)}>
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              </div>

              {/* 状态 */}
              <div className="space-y-2">
                <Label>账户状态</Label>
                <Badge variant={profile.isActive ? "default" : "secondary"}>
                  {profile.isActive ? '活跃' : '已禁用'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 安全设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                安全设置
              </CardTitle>
              <CardDescription>
                管理您的账户安全
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 修改密码 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">登录密码</p>
                  <p className="text-sm text-muted-foreground">定期修改密码以保护账户安全</p>
                </div>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      修改密码
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>修改密码</DialogTitle>
                      <DialogDescription>
                        为了账户安全，请输入当前密码和验证码
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      {/* 当前密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">当前密码 *</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({
                              ...prev,
                              currentPassword: e.target.value
                            }))}
                            required
                            disabled={passwordLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              current: !prev.current
                            }))}
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* 新密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">新密码 *</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({
                              ...prev,
                              newPassword: e.target.value
                            }))}
                            required
                            minLength={6}
                            disabled={passwordLoading}
                            placeholder="至少6位字符"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              new: !prev.new
                            }))}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* 确认密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">确认新密码 *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))}
                            required
                            disabled={passwordLoading}
                            placeholder="再次输入新密码"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              confirm: !prev.confirm
                            }))}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* 验证码 */}
                      <CaptchaInput
                        value={passwordForm.captcha}
                        onChange={(value) => setPasswordForm(prev => ({
                          ...prev,
                          captcha: value
                        }))}
                        sessionId={captchaSessionId}
                        onSessionIdChange={setCaptchaSessionId}
                        disabled={passwordLoading}
                        required
                      />

                      {/* 错误信息 */}
                      {passwordError && (
                        <div className="text-sm text-red-600">
                          {passwordError}
                        </div>
                      )}

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsPasswordDialogOpen(false)}
                          disabled={passwordLoading}
                        >
                          取消
                        </Button>
                        <Button type="submit" disabled={passwordLoading}>
                          {passwordLoading ? '修改中...' : '确认修改'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 登录信息 */}
              <div className="space-y-2">
                <Label>最后登录</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {profile.lastLogin
                      ? format(new Date(profile.lastLogin), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
                      : '从未登录'
                    }
                  </span>
                </div>
              </div>

              {/* 创建时间 */}
              <div className="space-y-2">
                <Label>创建时间</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(profile.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}