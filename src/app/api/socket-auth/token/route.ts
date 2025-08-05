import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('Socket token API被调用')
    
    // 获取用户session
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id ? `用户ID: ${session.user.id}` : '无session')
    
    if (!session?.user?.id) {
      console.log('用户未认证，返回401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 生成Socket认证用的JWT token
    const token = jwt.sign(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      process.env.NEXTAUTH_SECRET!,
      {
        expiresIn: '24h', // token有效期24小时
      }
    )

    console.log('成功生成Socket token')
    return NextResponse.json({ token })
  } catch (error) {
    console.error('生成Socket token失败:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
