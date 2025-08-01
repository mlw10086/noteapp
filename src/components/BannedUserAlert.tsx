'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, Ban, Clock, Mail, Phone } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface BannedUserAlertProps {
  bannedMessage: string
  bannedUntil?: string | null
  bannedReason?: string | null
  variant?: 'alert' | 'card'
}

export function BannedUserAlert({ 
  bannedMessage, 
  bannedUntil, 
  bannedReason,
  variant = 'alert' 
}: BannedUserAlertProps) {
  const isPermanent = !bannedUntil
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (variant === 'card') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Ban className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">账户已被封禁</CardTitle>
            <CardDescription>
              您的账户目前无法正常使用，请查看详细信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 封禁状态 */}
            <div className="flex items-center justify-center">
              <Badge variant="destructive" className="text-sm px-3 py-1">
                <Ban className="h-3 w-3 mr-1" />
                {isPermanent ? '永久封禁' : '临时封禁'}
              </Badge>
            </div>

            {/* 封禁信息 */}
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">封禁详情</h4>
                <div className="space-y-2 text-sm text-red-700">
                  <p>
                    <strong>封禁原因：</strong>
                    {bannedReason || '违反平台规定'}
                  </p>
                  {bannedUntil && (
                    <p className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <strong>封禁到期：</strong>
                      {new Date(bannedUntil).toLocaleString('zh-CN')}
                    </p>
                  )}
                  {isPermanent && (
                    <p className="flex items-center">
                      <ShieldAlert className="h-4 w-4 mr-1" />
                      <strong>封禁类型：</strong>
                      永久封禁
                    </p>
                  )}
                </div>
              </div>

              {/* 联系信息 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">需要帮助？</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>如果您认为这是一个错误，或者想要申诉，请联系我们：</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>邮箱：support@example.com</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>客服：400-123-4567</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex-1"
              >
                退出登录
              </Button>
              <Button 
                variant="default"
                onClick={() => window.location.href = 'mailto:support@example.com'}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                联系客服
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>账户已被封禁</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{bannedMessage}</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
            >
              退出登录
            </Button>
            <Button 
              variant="default"
              size="sm"
              onClick={() => window.location.href = 'mailto:support@example.com'}
            >
              <Mail className="h-4 w-4 mr-1" />
              联系客服
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
