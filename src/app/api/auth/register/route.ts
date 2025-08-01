import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { isRegistrationEnabled } from "@/lib/maintenance-check"

export async function POST(request: NextRequest) {
  try {
    // 检查注册是否开启
    const registrationEnabled = await isRegistrationEnabled()
    if (!registrationEnabled) {
      return NextResponse.json(
        { error: "注册功能已关闭，请联系管理员" },
        { status: 403 }
      )
    }

    const { email, password, name } = await request.json()

    // 验证输入
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "邮箱、密码和姓名都是必填项" },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      )
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为6位" },
        { status: 400 }
      )
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { 
        message: "注册成功",
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("注册失败:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
