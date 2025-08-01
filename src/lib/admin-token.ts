import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export interface AdminTokenPayload {
  adminId: number
  email: string
  role: string
}

export async function getAdminFromToken(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return null
    }

    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as AdminTokenPayload
    return payload
  } catch (error) {
    console.error('验证管理员token失败:', error)
    return null
  }
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as AdminTokenPayload
    return payload
  } catch (error) {
    return null
  }
}
