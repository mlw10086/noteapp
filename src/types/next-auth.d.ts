import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      isAdmin?: boolean
      adminRole?: string | null
      adminId?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isAdmin?: boolean
    adminRole?: string | null
    adminId?: string | null
  }
}
