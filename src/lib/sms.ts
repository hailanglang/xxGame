import Unisms from "unisms"

const isDev = process.env.NODE_ENV !== "production"

const unisms = isDev
  ? null
  : new Unisms({
      accessKeyId: process.env.UNISMS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.UNISMS_ACCESS_KEY_SECRET!,
    })

/** 发送短信验证码。开发环境跳过实际发送，仅打印日志。 */
export async function sendSmsCode(phone: string, code: string) {
  if (isDev) {
    console.log(`[DEV] 验证码已生成: ${phone} -> ${code}`)
    return
  }

  await unisms!.send({
    to: phone,
    signature: process.env.UNISMS_SIGNATURE!,
    templateId: process.env.UNISMS_TEMPLATE_ID!,
    templateData: { code },
  })
}
