import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { recordLoginHistory } from "@/lib/login-history"

export const authOptions: NextAuthOptions = {
  providers: [
    // 普通用户登录
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          // 记录失败的登录尝试（但没有用户ID，所以跳过）
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          // 记录失败的登录尝试
          setTimeout(async () => {
            try {
              await recordLoginHistory(user.id, false)
            } catch (error) {
              console.error('记录登录失败历史失败:', error)
            }
          }, 0)
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      }
    }),
    // 管理员登录
    CredentialsProvider({
      id: "admin-credentials",
      name: "admin-credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const admin = await prisma.admin.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!admin || !admin.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        )

        if (!isPasswordValid) {
          return null
        }

        // 记录管理员登录历史
        setTimeout(async () => {
          try {
            await prisma.adminLoginHistory.create({
              data: {
                adminId: admin.id,
                success: true
              }
            })
          } catch (error) {
            console.error('记录管理员登录历史失败:', error)
          }
        }, 0)

        return {
          id: admin.id.toString(),
          email: admin.email,
          name: admin.name,
          image: admin.avatar,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // 记录成功的登录历史
      if (user && user.id) {
        // 使用 setTimeout 异步记录，避免阻塞登录流程
        setTimeout(async () => {
          try {
            // 注意：在这个回调中我们无法直接获取请求对象
            // IP地址和用户代理将在中间件中处理
            await recordLoginHistory(parseInt(user.id), true)
          } catch (error) {
            console.error('记录登录历史失败:', error)
          }
        }, 0)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
