# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XXGame — 类似"小黑盒"的游戏社区中心。三个平台：PC端 (Next.js)、后台管理 (/admin)、小程序/APP (Uni-app)。

## Rules

- **禁止使用 `npx`**，所有 CLI 命令一律使用 `pnpm dlx`。
  - `npx prisma validate` → `pnpm dlx prisma validate`
  - `npx shadcn add button` → `pnpm dlx shadcn add button`
  - `npx tsx script.ts` → `pnpm dlx tsx script.ts`
- 包管理工具为 pnpm，禁止使用 npm / yarn。
- **图标 SVG 必须提取**: 页面绘制完成后，所有 inline `<svg>` 必须提取到 `src/components/icons.tsx`，封装为可复用组件（`stroke="currentColor"`，通过 `className` 控制颜色）。
- **React 按需引用**: 禁止 `import * as React from "react"`，统一使用命名导入 `import { useState, useEffect } from "react"`。
- **API 类型共享**: 每次接口完成（route.ts）后，必须将请求/响应的 interface 添加到 `src/types/api.ts`。前端页面使用 `api<T>()` 导入对应类型，禁止在页面中重复定义。

## Commands

```bash
pnpm dev        # 启动开发服务器 (Next.js 16 Turbo)
pnpm build      # 生产构建
pnpm start      # 启动生产服务器
pnpm lint       # ESLint 检查

# Prisma 命令 (Prisma 7)
pnpm dlx prisma db push      # 推送 schema 到数据库 (开发阶段用)
pnpm dlx prisma generate     # 生成 Prisma Client
pnpm dlx prisma studio       # 浏览器可视化数据库
pnpm dlx prisma validate     # 验证 schema 语法
pnpm dlx prisma format       # 格式化 schema
```

## Tech Stack

- **框架**: Next.js 16 (App Router + Turbopack) + React 19 + TypeScript 5.9
- **样式**: TailwindCSS v4 (`@import "tailwindcss"` 语法) + tw-animate-css
- **UI 组件**: shadcn/ui (基于 radix-ui) + lucide-react 图标
- **工具**: class-variance-authority (组件变体) + tailwind-merge + clsx → 封装为 `cn()`
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma 7 + @prisma/adapter-pg
- **文件存储**: Supabase Storage
- **包管理**: pnpm

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css               # TailwindCSS v4 入口
│   ├── layout.tsx                # 根布局 (NavBar + SEO metadata)
│   ├── page.tsx                  # 首页 (Hero + 特性简介，SEO 优化)
│   ├── interactions/
│   │   └── page.tsx              # 互动列表 (SSR, Prisma 查询)
│   └── api/posts/route.ts        # 文章 API (游标分页)
├── components/
│   ├── nav-bar.tsx               # 顶部导航 (client, sticky, 登录入口)
│   ├── login-dialog.tsx          # 登录弹窗 (client, 手机号+验证码)
│   └── ui/                       # shadcn/ui 组件
│       ├── button.tsx            # Button (支持 asChild + variants)
│       ├── dialog.tsx            # Dialog (radix-ui 封装)
│       ├── card.tsx
│       ├── avatar.tsx
│       ├── input.tsx
│       └── textarea.tsx
└── lib/
    ├── prisma.ts                 # Prisma 客户端 (Prisma 7 + adapter-pg, dev 阶段 global cache)
    ├── supabase.ts               # Supabase 客户端 (Storage & 备用)
    └── utils.ts                  # cn() = twMerge(clsx(...))
prisma/
├── schema.prisma                 # 数据模型 (11 张表)
prisma.config.ts                  # Prisma 7 配置
doc/
└── xxgame_outline.md             # 项目大纲
```

## Routes

| 路径 | 类型 | 说明 |
|------|------|------|
| `/` | Server | 首页，SEO 优化，Hero + 特性简介 |
| `/interactions` | Server (async) | 互动列表，Prisma 直查 posts |
| `/interactions/[id]` | 待实现 | 文章详情 + 评论 |
| `/interactions/new` | 待实现 | 发布互动帖 |
| `/api/posts?cursor=&limit=` | API Route | 游标分页接口 |

## Design System

- **CSS 变量主题**: shadcn/ui 使用 CSS 自定义属性 (`--primary`, `--background`, `--ring` 等)，通过 TailwindCSS v4 的 `@theme` 注入
- **Figma 驱动**: 组件尺寸和间距直接对照 Figma 设计稿 — XXGame-V1 (fileKey: `z8ontv0eTqv8M1Yk6fKLUw`)，代码注释中引用 Figma 节点 ID
- **移动端适配**: 小程序/APP 阶段用 Uni-app 重做 UI，PC 端不考虑移动端响应式
- **组件模式**: shadcn 组件使用 `data-slot` 属性 + `group-data-[*]/name` 选择器实现变体样式

## Auth Architecture

- **前台用户**: 手机号 + 短信验证码登录 (自建，无第三方依赖)
  - `users` 表存储用户画像，`verification_codes` 表处理验证码
  - `LoginDialog` 组件已实现 UI，验证码发送 API 待接入
- **后台管理**: email + bcrypt 密码登录 (独立体系)
  - `admins` 表完全隔离，不与前台用户混用

## Database

11 张表 (PostgreSQL)，schema 定义在 `prisma/schema.prisma`。

核心表关系:
```
users ──1:N──→ posts / comments / likes / verification_codes
admins (独立) ──1:N──→ audit_logs
workspaces ──1:N──→ posts
posts ──M:N──→ tags (via post_tags)
posts ──1:N──→ post_images / audit_logs
comments ──自引用──→ comments (二级嵌套回复)
```

Prisma 7 配置:
- `.env` — 基础环境变量，`prisma.config.ts` 通过 dotenv 加载
- `.env.local` — Next.js 运行时优先读取 (含 Supabase keys + DB URL)
- `DATABASE_URL` → PgBouncer 连接池 (6543 端口)，应用运行时 + prisma db push 共用
- `DIRECT_URL` → 直连 (5432 端口)，预留给 migration 场景
- `src/lib/prisma.ts` — 运行时使用 `DATABASE_URL`，dev 环境缓存 PrismaClient 到 globalThis

## Patterns

- **Server Component 优先**: 页面默认用 server component，需要 interactivity 时再 `"use client"`
- **Prisma 直查**: server component 直接 `import { prisma }` 查询，不走 API 层
- **API Route**: 面向无限滚动的游标分页接口 (`cursor` + `limit`，返回 `nextCursor`)
- **Figma 对齐**: UI 还原时直接对照 Figma 节点，尺寸用 px 写死而非 Tailwind 抽象类
- **登录状态**: 目前未实现 auth state，`LoginDialog` 中的 `handleSubmit` 为 TODO 占位

## Development Notes

- 开发阶段用 `prisma db push` 同步 schema，不创建迁移文件
- MVP 节奏: 文章列表 + 详情 + 评论 → 后台审核 → 小程序/APP
- 代码路径使用 `@/` 别名 (tsconfig paths 配置)
- 禁止引入第三方鉴权服务 (Auth0/Clerk)，自建 auth 体系
