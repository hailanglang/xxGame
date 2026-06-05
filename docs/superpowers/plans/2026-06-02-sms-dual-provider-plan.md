# SMS Dual Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `sendSmsCode` 中新增阿里云 `SendSmsVerifyCode` 渠道，与现有 Unisms 并列，调用方通过 `provider` 参数选择。

**Architecture:** `src/lib/sms.ts` 作为公开入口负责路由分发，`src/lib/sms-unisms.ts` 和 `src/lib/sms-aliyun.ts` 各自封装渠道实现。接口从 `(phone, code)` 改为 options 对象，`provider` 默认 `"unisms"` 保持向后兼容。

**Tech Stack:** TypeScript, Next.js 16, unisms, @alicloud/dysmsapi20170525, @alicloud/openapi-client

---

### Task 1: Install Alibaba Cloud SMS SDK

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add @alicloud/dysmsapi20170525 @alicloud/openapi-client
```

- [ ] **Step 2: Verify install**

```bash
node -e "const Dysmsapi = require('@alicloud/dysmsapi20170525'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @alicloud/dysmsapi20170525 dependency"
```

---

### Task 2: Extract Unisms logic to sms-unisms.ts

**Files:**
- Create: `src/lib/sms-unisms.ts`
- Modify: `src/lib/sms.ts`

- [ ] **Step 1: Create `src/lib/sms-unisms.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sms-unisms.ts
git commit -m "feat: extract Unisms logic to sms-unisms.ts"
```

---

### Task 3: Create Aliyun SMS module

**Files:**
- Create: `src/lib/sms-aliyun.ts`

- [ ] **Step 1: Create `src/lib/sms-aliyun.ts`**

```ts
import Dysmsapi20170525, * as $Dysmsapi20170525 from "@alicloud/dysmsapi20170525"
import * as $OpenApi from "@alicloud/openapi-client"

const isDev = process.env.NODE_ENV !== "production"

let client: Dysmsapi20170525 | null = null

function getClient() {
  if (!client) {
    const config = new $OpenApi.Config({})
    config.endpoint = "dysmsapi.aliyuncs.com"
    client = new Dysmsapi20170525(config)
  }
  return client
}

export async function sendByAliyun(phone: string): Promise<string> {
  if (isDev) {
    const code = "123456"
    console.log(`[DEV] 验证码已生成: ${phone} -> ${code}`)
    return code
  }

  const request = new $Dysmsapi20170525.SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName: process.env.ALIBABA_CLOUD_SMS_SIGN_NAME!,
    templateCode: process.env.ALIBABA_CLOUD_SMS_TEMPLATE_CODE!,
  })

  const result = await getClient().sendSmsVerifyCode(request)
  return result.body.returnVerifyCode!
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sms-aliyun.ts
git commit -m "feat: add Aliyun SendSmsVerifyCode module"
```

---

### Task 4: Rewrite sms.ts with options interface and routing

**Files:**
- Modify: `src/lib/sms.ts` (full rewrite)

- [ ] **Step 1: Rewrite `src/lib/sms.ts`**

```ts
import { sendByUnisms } from "@/lib/sms-unisms"
import { sendByAliyun } from "@/lib/sms-aliyun"

type SmsProvider = "unisms" | "aliyun"

interface SendSmsCodeOptions {
  phone: string
  code?: string
  provider?: SmsProvider
}

export async function sendSmsCode(options: SendSmsCodeOptions): Promise<string> {
  const { phone, code, provider = "unisms" } = options

  if (provider === "aliyun") {
    return sendByAliyun(phone)
  }

  return sendByUnisms(phone, code!)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sms.ts
git commit -m "feat: add dual-provider routing to sendSmsCode"
```

---

### Task 5: Update route to use new options interface

**Files:**
- Modify: `src/app/api/sms/send-code/route.ts:39`

- [ ] **Step 1: Update call site**

Change line 39 from:
```ts
    await sendSmsCode(phone, code)
```
to:
```ts
    await sendSmsCode({ phone, code })
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/sms/send-code/route.ts
git commit -m "feat: update send-code route to new sendSmsCode options interface"
```

---

### Task 6: Add Aliyun env vars to .env

**Files:**
- Modify: `.env`

- [ ] **Step 1: Append env vars**

在 `.env` 末尾添加：

```env
ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
ALIBABA_CLOUD_SMS_SIGN_NAME="xxGame"
ALIBABA_CLOUD_SMS_TEMPLATE_CODE="SMS_XXXXXXX"
```

> 注意：`ALIBABA_CLOUD_ACCESS_KEY_ID` / `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 为阿里云默认凭据链环境变量名，SDK 自动读取。实际部署时替换为真实值。

- [ ] **Step 2: Commit**

```bash
git add .env
git commit -m "chore: add Aliyun SMS environment variables"
```

---

### Task 7: Verify build

- [ ] **Step 1: Type check**

```bash
pnpm dlx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: Build succeeds.
