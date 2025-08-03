import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/admin-auth-middleware"

// GET - 获取单个更新记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const { id: idParam } = await params
      const id = parseInt(idParam)

      if (isNaN(id)) {
        return NextResponse.json(
          { error: '无效的更新记录ID' },
          { status: 400 }
        )
      }

      const update = await prisma.systemUpdate.findUnique({
        where: { id },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!update) {
        return NextResponse.json(
          { error: '更新记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json(update)
    } catch (error) {
      console.error('获取更新记录失败:', error)
      return NextResponse.json(
        { error: '获取更新记录失败' },
        { status: 500 }
      )
    }
  })
}

// PUT - 更新记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const { id: idParam } = await params
      const id = parseInt(idParam)

      if (isNaN(id)) {
        return NextResponse.json(
          { error: '无效的更新记录ID' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const { version, title, content, type, priority, isPublished } = body

      // 验证必填字段
      if (!version || !title || !content) {
        return NextResponse.json(
          { error: '版本号、标题和内容为必填项' },
          { status: 400 }
        )
      }

      // 检查更新记录是否存在
      const existingUpdate = await prisma.systemUpdate.findUnique({
        where: { id }
      })

      if (!existingUpdate) {
        return NextResponse.json(
          { error: '更新记录不存在' },
          { status: 404 }
        )
      }

      // 如果版本号发生变化，检查新版本号是否已存在
      if (version !== existingUpdate.version) {
        const versionExists = await prisma.systemUpdate.findUnique({
          where: { version }
        })

        if (versionExists) {
          return NextResponse.json(
            { error: '该版本号已存在' },
            { status: 400 }
          )
        }
      }

      // 更新记录
      const updateData: any = {
        version,
        title,
        content,
        type: type || 'feature',
        priority: priority || 'normal',
        isPublished: isPublished || false
      }

      // 如果发布状态从未发布变为发布，设置发布时间
      if (!existingUpdate.isPublished && isPublished) {
        updateData.publishedAt = new Date()
      }

      const updatedRecord = await prisma.systemUpdate.update({
        where: { id },
        data: updateData,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({
        message: '更新记录修改成功',
        update: updatedRecord
      })
    } catch (error) {
      console.error('更新记录失败:', error)
      return NextResponse.json(
        { error: '更新记录失败' },
        { status: 500 }
      )
    }
  })
}

// DELETE - 删除更新记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (request, adminId) => {
    try {
      const { id: idParam } = await params
      const id = parseInt(idParam)

      if (isNaN(id)) {
        return NextResponse.json(
          { error: '无效的更新记录ID' },
          { status: 400 }
        )
      }

      // 检查更新记录是否存在
      const existingUpdate = await prisma.systemUpdate.findUnique({
        where: { id }
      })

      if (!existingUpdate) {
        return NextResponse.json(
          { error: '更新记录不存在' },
          { status: 404 }
        )
      }

      // 删除更新记录
      await prisma.systemUpdate.delete({
        where: { id }
      })

      return NextResponse.json({
        message: '更新记录删除成功'
      })
    } catch (error) {
      console.error('删除更新记录失败:', error)
      return NextResponse.json(
        { error: '删除更新记录失败' },
        { status: 500 }
      )
    }
  })
}
