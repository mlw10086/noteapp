import { NextRequest, NextResponse } from "next/server"
import { captchaStore } from "@/lib/captcha-store"

// GET - 生成验证码
export async function GET(request: NextRequest) {
  try {
    // 使用统一的验证码生成方法
    const { sessionId, captchaSvg } = captchaStore.generateCaptcha()

    // 返回验证码图片和会话ID（与用户端API格式一致）
    return NextResponse.json({
      sessionId,
      captcha: captchaSvg, // 统一字段名
      expires: Date.now() + 5 * 60 * 1000 // 过期时间戳
    })

  } catch (error) {
    console.error('生成验证码失败:', error)
    return NextResponse.json(
      { error: '生成验证码失败' },
      { status: 500 }
    )
  }
}

// POST - 验证验证码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, captcha } = body

    if (!sessionId || !captcha) {
      return NextResponse.json(
        { error: '会话ID和验证码不能为空' },
        { status: 400 }
      )
    }

    // 使用统一的验证方法
    const isValid = captchaStore.verifyCaptcha(sessionId, captcha)

    if (!isValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '验证码验证成功',
      valid: true
    })

  } catch (error) {
    console.error('验证验证码失败:', error)
    return NextResponse.json(
      { error: '验证验证码失败' },
      { status: 500 }
    )
  }
}

// DELETE - 清除验证码（可选，用于取消操作时清理）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: '会话ID不能为空' },
        { status: 400 }
      )
    }

    // 使用统一的删除方法
    captchaStore.deleteCaptcha(sessionId)

    return NextResponse.json({
      message: '验证码已清除'
    })

  } catch (error) {
    console.error('清除验证码失败:', error)
    return NextResponse.json(
      { error: '清除验证码失败' },
      { status: 500 }
    )
  }
}
