# XXGame — 游戏玩家社区

类似「小黑盒」的游戏社区中心，为玩家提供内容发布、互动交流、游戏讨论的一站式平台。

## 平台规划

| 平台 | 技术 | 状态 |
|------|------|------|
| PC 端 | Next.js 16 (App Router) | MVP 开发中 |
| 后台管理 | Next.js `/admin` 路由 | 待开发 |

## 技术栈

- **框架**: Next.js 16 (App Router + Turbopack) + React 19 + TypeScript 5.9
- **样式**: TailwindCSS v4 + tw-animate-css + shadcn/ui (Radix UI)
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma 7 + @prisma/adapter-pg
- **文件存储**: Supabase Storage
- **包管理**: pnpm

## 功能模块

### PC 端
- **首页** — SEO 优化，Hero 介绍 + 特性展示（Google 可搜索）
- **社区中心** — 无限滚动文章列表，文章详情 + 二级评论 + 点赞
- **个人中心** — 手机号验证码登录，文章发布与管理

### 后台管理 (`/admin`)
- 文章审核（通过 / 驳回 / 隐藏）
- 文章管理、话题模块
- 审核操作日志

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+
- PostgreSQL 数据库（推荐 Supabase 免费版）

### 环境变量

创建 `.env.local` 文件：

```bash
# 数据库（Supabase 直连 5432 端口）
DATABASE_URL="postgresql://..."
# PgBouncer 连接池（6543 端口）
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### 安装与运行

```bash
# 安装依赖
pnpm install

# 同步数据库 Schema（开发阶段）
pnpm dlx prisma db push

# 生成 Prisma Client
pnpm dlx prisma generate

# 启动开发服务器
pnpm dev          # http://localhost:3000

# 生产构建
pnpm build

# 启动生产服务
pnpm start
```

## 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css               # TailwindCSS v4 入口
│   ├── layout.tsx                # 根布局 (NavBar + SEO metadata)
│   ├── page.tsx                  # 首页 (Hero + 特性简介)
│   ├── interactions/
│   │   └── page.tsx              # 互动列表 (SSR, Prisma 直查)
│   ├── interactions/[id]/        # 文章详情 + 评论（待实现）
│   ├── interactions/new/         # 发布互动帖（待实现）
│   ├── api/posts/route.ts        # 文章 API (游标分页)
│   └── robots.ts / sitemap.ts    # SEO
├── components/
│   ├── nav-bar.tsx               # 顶部导航 (sticky, 登录入口)
│   ├── login-dialog.tsx          # 登录弹窗 (手机号+验证码)
│   ├── icons.tsx                 # SVG 图标组件库
│   └── ui/                       # shadcn/ui 组件
│       ├── button.tsx            # Button (asChild + variants)
│       ├── dialog.tsx            # Dialog (Radix UI 封装)
│       ├── card.tsx / avatar.tsx
│       └── input.tsx / textarea.tsx
├── lib/
│   ├── prisma.ts                 # Prisma Client (dev 环境 global 缓存)
│   ├── supabase.ts               # Supabase Client (Storage)
│   └── utils.ts                  # cn() = twMerge(clsx(...))
└── types/
    └── api.ts                    # API 请求/响应类型定义
prisma/
├── schema.prisma                 # 数据模型 (11 张表)
└── prisma.config.ts              # Prisma 7 配置
```

## 路由

| 路径 | 类型 | 说明 |
|------|------|------|
| `/` | Server | 首页，SEO 优化 |
| `/interactions` | Server | 互动列表，Prisma 直查 |
| `/interactions/[id]` | 待实现 | 文章详情 + 评论 |
| `/interactions/new` | 待实现 | 发布互动帖 |
| `/api/posts?cursor=&limit=` | API | 游标分页接口 |

## 数据库

11 张表，PostgreSQL + Prisma 7：

```
users ──1:N──→ posts / comments / likes / verification_codes
admins (独立) ──1:N──→ audit_logs
workspaces ──1:N──→ posts
posts ──M:N──→ tags (via post_tags)
posts ──1:N──→ post_images / audit_logs
comments ──自引用──→ comments (二级嵌套回复)
```

**鉴权架构**:
- 前台用户 — 手机号 + 短信验证码登录（自建，无第三方依赖）
- 后台管理 — 邮箱 + bcrypt 密码登录（独立体系，与前台完全隔离）

可视化管理：`pnpm dlx prisma studio`

## 开发约定

- **React 按需引用**: `import { useState } from "react"`，禁止 `import * as React`
- **图标管理**: 页面 inline SVG 必须提取到 `src/components/icons.tsx`
- **API 类型共享**: 接口完成后将 Request/Response interface 添加到 `src/types/api.ts`
- **Server Component 优先**: 默认用 server component，需要交互时再 `"use client"`
- **Prisma 直查**: Server Component 直接查询，API Route 仅用于游标分页等场景
- **包管理**: 统一使用 pnpm，禁止 npm / yarn；`npx` 命令改用 `pnpm dlx`
- **代码标签**: 使用 `@/` 路径别名

## 开发路线

1. PC 端文章列表 + 详情 + 评论（MVP — 进行中）
2. 后台管理基础审核功能