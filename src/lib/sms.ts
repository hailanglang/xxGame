// import { sendByUnisms } from "@/lib/sms-unisms"
import { sendByAliyun } from "@/lib/sms-aliyun"

type SmsProvider = "unisms" | "aliyun"

interface SendSmsCodeOptions {
  phone: string
  code?: string
  provider?: SmsProvider
}

export async function sendSmsCode(options: SendSmsCodeOptions): Promise<string> {
  const { phone, code, provider = "aliyun" } = options

  return sendByAliyun(phone)

  // return sendByUnisms(phone, code!)
}
