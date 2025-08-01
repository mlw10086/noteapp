'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, ArrowRight } from 'lucide-react'

export default function AccountSettingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // 3秒后自动重定向到管理员个人资料页面
    const timer = setTimeout(() => {
      router.replace('/admin/profile')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <AdminLayout
      title="账户设置"
      description="管理员账户设置已移至个人资料页面"
    >
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>账户设置已移动</CardTitle>
            <CardDescription>
              管理员账户设置功能现在位于个人资料页面
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              您将在 3 秒后自动跳转，或点击下方按钮立即前往
            </p>
            <Link href="/admin/profile">
              <Button className="w-full">
                前往个人资料页面
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
