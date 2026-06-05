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
  const request = new $Dypnsapi20170525.SendSmsVerifyCodeRequest({
    schemeName: "xxGame",
    signName: "速通互联验证码",
    templateCode: "100001",
    templateParam: "{\"code\":\"##code##\",\"min\":\"5\"}",
    returnVerifyCode: true,
    phoneNumber: phone,
    codeLength: 6
  })

  const runtime = new $Util.RuntimeOptions({})
  const result = await getClient().sendSmsVerifyCodeWithOptions(request, runtime)
  if(result.body && result.body?.code == 'OK' && result.body.model){
      return result.body.model.verifyCode!
  }else{
    throw Error(JSON.stringify(result))
  }
}
