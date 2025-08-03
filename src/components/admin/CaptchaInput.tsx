'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, AlertCircle } from "lucide-react"

interface CaptchaData {
  sessionId: string
  captcha: string
  expires: number
}

interface CaptchaInputProps {
  value: string
  onChange: (value: string) => void
  sessionId: string
  onSessionIdChange: (sessionId: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  apiEndpoint?: string
}

export function CaptchaInput({
  value,
  onChange,
  sessionId,
  onSessionIdChange,
  error,
  disabled = false,
  required = false,
  apiEndpoint = '/api/admin/captcha'
}: CaptchaInputProps) {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 生成验证码
  const generateCaptcha = async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('生成验证码失败')
      }

      const data: CaptchaData = await response.json()
      setCaptchaData(data)
      onSessionIdChange(data.sessionId)
      onChange('') // 清空输入框

    } catch (error) {
      console.error('生成验证码失败:', error)
      setLoadError('生成验证码失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时生成验证码
  useEffect(() => {
    if (!captchaData && !sessionId) {
      generateCaptcha()
    }
  }, [])

  // 检查验证码是否过期
  const isExpired = captchaData && Date.now() > captchaData.expires

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">
        验证码 {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="flex gap-2 items-start">
        {/* 验证码图片 */}
        <div className="flex-shrink-0">
          <div className="w-[120px] h-[40px] border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
            {isLoading ? (
              <div className="text-xs text-gray-500">加载中...</div>
            ) : loadError ? (
              <div className="text-xs text-red-500 text-center px-1">
                加载失败
              </div>
            ) : captchaData ? (
              <img
                src={captchaData.captcha}
                alt="验证码"
                className="w-full h-full object-contain"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            ) : (
              <div className="text-xs text-gray-500">验证码</div>
            )}
          </div>
        </div>

        {/* 刷新按钮 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateCaptcha}
          disabled={isLoading || disabled}
          className="h-[40px] px-3"
          title="刷新验证码"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>

        {/* 输入框 */}
        <div className="flex-1">
          <Input
            id="captcha"
            type="text"
            placeholder="请输入验证码"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || isLoading || !captchaData}
            required={required}
            maxLength={6}
            className={error ? 'border-red-500' : ''}
            autoComplete="off"
          />
        </div>
      </div>

      {/* 错误信息 */}
      {(error || loadError || isExpired) && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>
            {error || loadError || (isExpired ? '验证码已过期，请刷新' : '')}
          </span>
        </div>
      )}

      {/* 提示信息 */}
      {captchaData && !isExpired && !error && !loadError && (
        <div className="text-xs text-gray-500">
          验证码有效期5分钟，不区分大小写
        </div>
      )}
    </div>
  )
}
