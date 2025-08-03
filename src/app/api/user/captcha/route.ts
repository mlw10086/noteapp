import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { captchaStore } from "@/lib/captcha-store"

// GET - 生成验证码
export async function GET(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const { sessionId, captchaSvg } = captchaStore.generateCaptcha()
      
      return NextResponse.json({
        sessionId,
        captcha: captchaSvg, // 统一字段名
        expires: Date.now() + 5 * 60 * 1000 // 过期时间戳
      })
    } catch (error) {
      console.error("生成验证码失败:", error)
      return NextResponse.json(
        { error: "生成验证码失败" },
        { status: 500 }
      )
    }
  })
}

// POST - 验证验证码
export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const body = await request.json()
      const { sessionId, captcha } = body

      if (!sessionId || !captcha) {
        return NextResponse.json(
          { error: "会话ID和验证码都是必填项" },
          { status: 400 }
        )
      }

      const isValid = captchaStore.verifyCaptcha(sessionId, captcha)

      if (!isValid) {
        return NextResponse.json(
          { error: "验证码错误或已过期" },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: "验证码验证成功"
      })
    } catch (error) {
      console.error("验证验证码失败:", error)
      return NextResponse.json(
        { error: "验证验证码失败" },
        { status: 500 }
      )
    }
  })
}

// DELETE - 删除验证码会话
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const sessionId = searchParams.get('sessionId')

      if (!sessionId) {
        return NextResponse.json(
          { error: "会话ID是必填项" },
          { status: 400 }
        )
      }

      captchaStore.deleteCaptcha(sessionId)

      return NextResponse.json({
        message: "验证码会话已删除"
      })
    } catch (error) {
      console.error("删除验证码会话失败:", error)
      return NextResponse.json(
        { error: "删除验证码会话失败" },
        { status: 500 }
      )
    }
  })
}
