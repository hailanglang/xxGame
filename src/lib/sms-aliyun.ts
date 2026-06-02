import Dypnsapi20170525, * as $Dypnsapi20170525 from "@alicloud/dypnsapi20170525"
import * as $OpenApi from "@alicloud/openapi-client"
import * as $Util from "@alicloud/tea-util"
import Credential from "@alicloud/credentials"

const isDev = process.env.NODE_ENV !== "production"

let client: Dypnsapi20170525 | null = null

function getClient(): Dypnsapi20170525 {
  if (!client) {
    const credential = new Credential()
    const config = new $OpenApi.Config({ credential })
    config.endpoint = "dypnsapi.aliyuncs.com"
    client = new Dypnsapi20170525(config)
  }
  return client
}

export async function sendByAliyun(phone: string): Promise<string> {
  if (isDev) {
    const code = "123456"
    console.log(`[DEV] 验证码已生成: ${phone} -> ${code}`)
    return code
  }

  const request = new $Dypnsapi20170525.SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName: process.env.ALIBABA_CLOUD_SMS_SIGN_NAME!,
    templateCode: process.env.ALIBABA_CLOUD_SMS_TEMPLATE_CODE!,
  })

  const runtime = new $Util.RuntimeOptions({})
  const result = await getClient().sendSmsVerifyCodeWithOptions(request, runtime)
  return result.body.returnVerifyCode!
}
