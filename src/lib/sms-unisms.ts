import Unisms from "unisms"

const isDev = process.env.NODE_ENV !== "production"

const unisms = isDev
  ? null
  : new Unisms({
      accessKeyId: process.env.UNISMS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.UNISMS_ACCESS_KEY_SECRET!,
    })

export async function sendByUnisms(phone: string, code: string): Promise<string> {
  if (isDev) {
    console.log(`[DEV] 验证码已生成: ${phone} -> ${code}`)
    return code
  }

  await unisms!.send({
    to: phone,
    signature: process.env.UNISMS_SIGNATURE!,
    templateId: process.env.UNISMS_TEMPLATE_ID!,
    templateData: { code },
  })

  return code
}
