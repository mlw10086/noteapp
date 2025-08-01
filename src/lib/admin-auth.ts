import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// 管理员认证配置
export const adminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "admin-credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // 查找管理员账户
          const admin = await prisma.admin.findUnique({
            where: {
              email: credentials.email,
              isActive: true, // 只允许激活的管理员登录
            }
          })

          if (!admin) {
            return null
          }

          // 验证密码
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            admin.password
          )

          if (!isPasswordValid) {
            return null
          }

          // 更新最后登录时间
          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() }
          })

          // 记录登录历史
          await prisma.adminLoginHistory.create({
            data: {
              adminId: admin.id,
              success: true,
              // 这些信息在实际应用中可以从请求头获取
              ipAddress: '127.0.0.1',
              userAgent: 'Admin Panel',
            }
          })

          return {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.name,
            image: admin.avatar,
            role: admin.role,
          }
        } catch (error) {
          console.error("管理员认证错误:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8小时会话
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token.admin'
        : 'next-auth.session-token.admin',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
