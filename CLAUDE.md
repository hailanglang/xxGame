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

## Commands

```bash
pnpm dev        # 启动开发服务器 (Next.js 16)
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

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript
- **样式**: TailwindCSS (待配置)
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma 7 + @prisma/adapter-pg
- **文件存储**: Supabase Storage
- **包管理**: pnpm

## Auth Architecture

- **前台用户**: 手机号 + 短信验证码登录 (自建，无第三方依赖)
  - `users` 表存储用户画像，`verification_codes` 表处理验证码
- **后台管理**: email + bcrypt 密码登录 (独立体系)
  - `admins` 表完全隔离，不与前台用户混用

## Database

11 张表 (PostgreSQL)，schema 定义在 `prisma/schema.prisma`。

核心表关系:
```
users ──1:N──→ posts / comments / likes
admins (独立) ──1:N──→ audit_logs
workspaces ──1:N──→ posts
posts ──M:N──→ tags (via post_tags)
```

Prisma 7 特殊配置:
- `prisma.config.ts` — 使用 dotenv 加载 `.env`，`datasource.url` 指向 `DIRECT_URL` (5432直连，用于 schema 变更)
- `src/lib/prisma.ts` — 应用运行时使用 `DATABASE_URL` (PgBouncer 连接池，6543端口)
- `.env` 和 `.env.local` 共存，`.env.local` 对 Next.js 优先级更高

## Project Structure

```
src/
├── app/              # Next.js App Router 页面
│   ├── layout.tsx    # 根布局
│   └── page.tsx      # 首页
└── lib/
    ├── prisma.ts     # Prisma 客户端 (Prisma 7 + adapter-pg)
    └── supabase.ts   # Supabase 客户端 (Storage & 备用)
prisma/
├── schema.prisma     # 数据模型 (11张表)
prisma.config.ts      # Prisma 7 配置
doc/
└── xxgame_outline.md # 项目大纲
```

## Development Notes

- 开发阶段用 `prisma db push` 同步 schema，不创建迁移文件
- MVP 节奏: 文章列表 + 详情 + 评论 → 后台审核 → 小程序/APP
- 代码路径使用 `@/` 别名 (tsconfig paths 配置)
- Figma 设计稿: XXGame-V1 (fileKey: z8ontv0eTqv8M1Yk6fKLUw)
