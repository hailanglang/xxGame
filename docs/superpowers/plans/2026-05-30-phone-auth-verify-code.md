# 手机号验证码登录/注册 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 POST /api/auth/verify-code，校验验证码后 upsert 用户并返回 JWT token。

**Architecture:** `jose` 库处理 JWT 签发，Prisma upsert 自动处理注册/登录合一，token 通过 Authorization header 传递。`src/lib/jwt.ts` 封装 sign/verify，`src/lib/auth.ts` 封装从 header 提取用户的逻辑。

**Tech Stack:** jose (JWT), Prisma (DB), Next.js API Route

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lib/jwt.ts` | 新建 | `sign(payload)` / `verify(token)` 封装 |
| `src/lib/auth.ts` | 新建 | `getUserFromHeaders(request)` 从 Authorization header 解析用户 |
| `src/app/api/auth/verify-code/route.ts` | 新建 | POST 端点，校验验证码 + upsert 用户 + 返回 JWT |
| `src/components/login-dialog.tsx` | 修改 | `handleSubmit` 接入真实 API，存储 token |
| `.env.local` | 修改 | 添加 `JWT_SECRET` |

---

### Task 1: 安装 jose 依赖

- [ ] **Step 1: 安装 jose**

```bash
pnpm add jose
```

---

### Task 2: 创建 JWT 工具函数

**文件:** 新建 `src/lib/jwt.ts`

- [ ] **Step 1: 创建文件**

```typescript
import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const issuer = "xxgame"
const audience = "xxgame"

export async function signJWT(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer,
    audience,
  })
  return payload
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/jwt.ts
git commit -m "feat: jwt sign/verify 工具函数"
```

---

### Task 3: 创建 /api/auth/verify-code 端点

**文件:** 新建 `src/app/api/auth/verify-code/route.ts`

- [ ] **Step 1: 创建 API 端点**

```typescript
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { signJWT } from "@/lib/jwt"

function generateNickname() {
  const rand = Math.floor(Math.random() * 1e10).toString().padStart(10, "0")
  return `用户_${rand}`
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code || !/^1\d{10}$/.test(phone)) {
      return Response.json({ error: "参数错误" }, { status: 400 })
    }

    // 查验证码
    const record = await prisma.verificationCode.findFirst({
      where: {
        phone,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return Response.json({ error: "请先获取验证码" }, { status: 401 })
    }

    if (record.code !== code) {
      return Response.json({ error: "验证码错误" }, { status: 401 })
    }

    // 标记已使用
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // upsert 用户
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        nickname: generateNickname(),
      },
    })

    if (user.status === "banned") {
      return Response.json({ error: "账号已被禁用" }, { status: 403 })
    }

    // 签发 JWT
    const token = await signJWT({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })

    return Response.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
      },
    })
  } catch (e) {
    console.error("verify-code error:", e)
    return Response.json({ error: "服务异常，请稍后再试" }, { status: 500 })
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/auth/verify-code/route.ts
git commit -m "feat: /api/auth/verify-code 验证码登录/注册接口"
```

---

### Task 4: 创建 auth 工具函数

**文件:** 新建 `src/lib/auth.ts`

- [ ] **Step 1: 创建文件**

```typescript
import { verifyJWT } from "@/lib/jwt"

export interface AuthUser {
  userId: string
  phone: string
  role: string
}

export async function getUserFromHeaders(request: Request): Promise<AuthUser | null> {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null

  try {
    const payload = await verifyJWT(auth.slice(7))
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/auth.ts
git commit -m "feat: auth 工具函数，从 Authorization header 解析用户"
```

---

### Task 5: 更新 LoginDialog handleSubmit

**文件:** 修改 `src/components/login-dialog.tsx`

- [ ] **Step 1: 更新 handleSubmit 函数**

将现有 `handleSubmit` 替换为：

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!phone || !code) return
  setLoading(true)
  try {
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      onOpenChange(false)
    } else {
      alert(data.error || "登录失败")
    }
  } catch {
    alert("登录失败，请稍后再试")
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/login-dialog.tsx
git commit -m "feat: 登录弹窗接入 verify-code API"
```

---

### Task 6: 配置 JWT_SECRET

- [ ] **Step 1: 添加环境变量**

在 `.env.local` 追加一行（已有的 `.env` 同步添加）：

```
JWT_SECRET="your-256-bit-secret-here-change-in-production"
```

- [ ] **Step 2: 提交**

```bash
# .env.local 通常不提交，仅提醒手动添加
echo "请手动在 .env.local 中添加 JWT_SECRET"
```
