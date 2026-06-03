import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { signJWT } from "@/lib/jwt"
import bcrypt from "bcryptjs"
import type { PasswordLoginResponse, ApiError } from "@/types/api"

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password || !/^1\d{10}$/.test(phone)) {
      return Response.json({ error: "参数错误" } satisfies ApiError, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: "密码长度不能少于6位" } satisfies ApiError, { status: 400 })
    }

    let user = await prisma.user.findUnique({ where: { phone } })

    if (user) {
      if (!user.passwordHash) {
        return Response.json({ error: "该账号未设置密码，请使用验证码登录" } satisfies ApiError, { status: 401 })
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return Response.json({ error: "密码错误" } satisfies ApiError, { status: 401 })
      }
    } else {
      return Response.json(
        { error: "该手机号尚未注册，请选择验证码登录/注册" } satisfies ApiError,
        { status: 404 },
      )
    }

    if (user.status === "banned") {
      return Response.json({ error: "账号已被禁用" } satisfies ApiError, { status: 403 })
    }

    const token = await signJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })

    const body: PasswordLoginResponse = {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
        hasPassword: !!user.passwordHash,
      },
    }
    return Response.json(body)
  } catch (e) {
    console.error("password-login error:", e)
    return Response.json({ error: "服务异常，请稍后再试" } satisfies ApiError, { status: 500 })
  }
}
