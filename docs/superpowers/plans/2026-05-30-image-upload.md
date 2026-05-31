# 图片上传 — Supabase Storage 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `/api/upload` 通用图片上传接口 + `/api/posts` 文章创建接口 + 发布页面串联。

**Architecture:** `/api/upload` 接收 FormData，服务端上传到 Supabase Storage 并返回 URL。`/api/posts` 接收标题/内容/分类/图片URL数组，创建文章并关联图片。发布页 handleSubmit 先逐张上传图片，再创建文章。

**Tech Stack:** @supabase/supabase-js (Storage), Prisma, Next.js API Route, FormData

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/app/api/upload/route.ts` | 新建 | 接收文件 → Supabase Storage → 返回 imageUrl |
| `src/app/api/posts/route.ts` | 新建 | POST 创建文章，关联 images[] |
| `src/app/interactions/new/page.tsx` | 修改 | handleSubmit 串联上传→创建文章 |

---

### Task 1: 创建 /api/upload 通用图片上传接口

**文件:** 新建 `src/app/api/upload/route.ts`

- [ ] **Step 1: 创建文件**

```typescript
import { NextRequest } from "next/server"
import { getUserFromHeaders } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  const user = await getUserFromHeaders(request)
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return Response.json({ error: "请选择文件" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "仅支持图片文件" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "文件不能超过 5MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const path = `${crypto.randomUUID()}.${ext}`

    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(data.path)

    return Response.json({ imageUrl: urlData.publicUrl })
  } catch (e) {
    console.error("upload error:", e)
    return Response.json({ error: "上传失败" }, { status: 500 })
  }
}
```

- [ ] **Step 2: 配置环境变量**

在 `.env.local` 添加 Supabase Service Key（服务端用，绕过 RLS）：

```
SUPABASE_SERVICE_KEY="your-service-role-key"
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: /api/upload 通用图片上传接口"
```

---

### Task 2: 创建 /api/posts POST 端点

**文件:** 新建 `src/app/api/posts/route.ts`（追加 POST 到已有 GET 端点）

- [ ] **Step 1: 追加 POST 方法**

在 `src/app/api/posts/route.ts` 末尾添加：

```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromHeaders(request)
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const { title, content, category, images } = await request.json()

    if (!title || !content) {
      return Response.json({ error: "标题和内容不能为空" }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        summary: content.slice(0, 200),
        authorId: user.userId,
        images: {
          create: (images || []).map((url: string) => ({
            imageUrl: url,
          })),
        },
      },
      include: {
        images: true,
        author: { select: { id: true, nickname: true } },
      },
    })

    return Response.json(post)
  } catch (e) {
    console.error("create post error:", e)
    return Response.json({ error: "发布失败" }, { status: 500 })
  }
}
```

头部 import 添加 `getUserFromHeaders`：

```typescript
import { getUserFromHeaders } from "@/lib/auth"
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/posts/route.ts
git commit -m "feat: /api/posts POST 创建文章接口"
```

---

### Task 3: 更新发布页面 handleSubmit

**文件:** 修改 `src/app/interactions/new/page.tsx`

- [ ] **Step 1: 重写 handleSubmit**

添加 imports：

```typescript
import { useUserStore } from "@/stores/user-store"
```

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!title || !content) return
  setLoading(true)
  try {
    // 1. 逐张上传图片
    const imageUrls: string[] = []
    for (const file of coverFiles) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) imageUrls.push(data.imageUrl)
    }

    // 2. 创建文章
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, category, images: imageUrls }),
    })
    if (res.ok) {
      router.push("/interactions")
    } else {
      const data = await res.json()
      alert(data.error || "发布失败")
    }
  } catch {
    alert("发布失败，请稍后再试")
  } finally {
    setLoading(false)
  }
}
```

组件中获取 token：

```typescript
const token = useUserStore((s) => s.token)
```

- [ ] **Step 2: 提交**

```bash
git add src/app/interactions/new/page.tsx
git commit -m "feat: 发布页面串联图片上传+文章创建"
```
