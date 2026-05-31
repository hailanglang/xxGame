import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { signJWT } from "@/lib/jwt"
import { DEV_CODE } from "@/lib/dev-code"
import type { VerifyCodeResponse, ApiError } from "@/types/api"


const isDev = process.env.NODE_ENV !== "production"

function generateNickname() {
  const rand = Math.floor(Math.random() * 1e10).toString().padStart(10, "0")
  return `用户_${rand}`
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code || !/^1\d{10}$/.test(phone)) {
      return Response.json({ error: "参数错误" } satisfies ApiError, { status: 400 })
    }

    if (!isDev || code !== DEV_CODE) {
      const record = await prisma.verificationCode.findFirst({
        where: {
          phone,
          used: false,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      })

      if (!record) {
        return Response.json({ error: "请先获取验证码" } satisfies ApiError, { status: 401 })
      }

      if (record.code !== code) {
        return Response.json({ error: "验证码错误" } satisfies ApiError, { status: 401 })
      }

      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        nickname: generateNickname(),
      },
    })

    if (user.status === "banned") {
      return Response.json({ error: "账号已被禁用" } satisfies ApiError, { status: 403 })
    }

    const token = await signJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })

    const body: VerifyCodeResponse = {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
      },
    }
    return Response.json(body)
  } catch (e) {
    console.error("verify-code error:", e)
    return Response.json({ error: "服务异常，请稍后再试" } satisfies ApiError, { status: 500 })
  }
}
