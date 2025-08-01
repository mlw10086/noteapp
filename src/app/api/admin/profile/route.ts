import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth-middleware'
import { prisma } from '@/lib/prisma'

// PUT - 更新管理员个人信息
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (request, adminId, adminRole) => {
    try {
      const { name } = await request.json()

      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: '姓名不能为空' },
          { status: 400 }
        )
      }

      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: {
          name: name.trim(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
        }
      })

      return NextResponse.json({
        success: true,
        admin: updatedAdmin
      })

    } catch (error) {
      console.error('更新管理员信息失败:', error)
      return NextResponse.json(
        { error: '更新管理员信息失败' },
        { status: 500 }
      )
    }
  })
}
