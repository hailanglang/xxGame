import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyJWT } from "@/lib/jwt"
import bcrypt from "bcryptjs"
import type { ChangePasswordBody, ChangePasswordResponse, ApiError } from "@/types/api"

export async function PUT(request: NextRequest) {
  try {
    const auth = request.headers.get("Authorization")
    if (!auth?.startsWith("Bearer ")) {
      return Response.json({ error: "未登录" } satisfies ApiError, { status: 401 })
    }

    let payload: Record<string, unknown>
    try {
      payload = await verifyJWT(auth.slice(7))
    } catch {
      return Response.json({ error: "登录已过期，请重新登录" } satisfies ApiError, { status: 401 })
    }

    const userId = payload.userId as string
    const body: ChangePasswordBody = await request.json()

    if (!body.newPassword || body.newPassword.length < 6) {
      return Response.json({ error: "新密码长度不能少于6位" } satisfies ApiError, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return Response.json({ error: "用户不存在" } satisfies ApiError, { status: 404 })
    }

    // 如果已有密码，验证原密码
    if (user.passwordHash) {
      if (!body.oldPassword) {
        return Response.json({ error: "请输入原密码" } satisfies ApiError, { status: 400 })
      }
      const valid = await bcrypt.compare(body.oldPassword, user.passwordHash)
      if (!valid) {
        return Response.json({ error: "原密码错误" } satisfies ApiError, { status: 401 })
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(body.newPassword, 10) },
    })

    const res: ChangePasswordResponse = { success: true }
    return Response.json(res)
  } catch (e) {
    console.error("change-password error:", e)
    return Response.json({ error: "服务异常，请稍后再试" } satisfies ApiError, { status: 500 })
  }
}
