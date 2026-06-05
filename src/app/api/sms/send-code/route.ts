import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSmsCode } from "@/lib/sms"
import type { SendCodeResponse, ApiError } from "@/types/api"

const isDev = process.env.NODE_ENV !== "production"

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return Response.json({ error: "请输入正确的手机号码" } satisfies ApiError, { status: 400 })
    }

    // 60 秒内不允许重复发送
    const recent = await prisma.verificationCode.findFirst({
      where: { phone, createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    })
    if (recent) {
      return Response.json({ error: "验证码已发送，请60秒后再试" } satisfies ApiError, { status: 429 })
    }

    // 发送短信并获取验证码
    const code = await sendSmsCode({ phone })

    // 存数据库
    await prisma.verificationCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    return Response.json({ success: true } satisfies SendCodeResponse)
  } catch (e) {
    console.error("发送验证码失败:", e)
    return Response.json({ error: "发送失败，请稍后再试" } satisfies ApiError, { status: 500 })
  }
}
