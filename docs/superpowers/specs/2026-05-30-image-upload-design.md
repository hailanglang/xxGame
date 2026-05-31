# 图片上传 — Supabase Storage 方案

## 概要

图片通过 `/api/upload` 统一上传到 Supabase Storage，返回图片地址。发布帖子时通过 `/api/posts` 创建文章，关联图片。

## API

### `POST /api/upload`
通用图片上传接口，接收文件，上传到 Supabase Storage，返回图片地址。

- 请求: `FormData { file: File }`
- 响应: `{ imageUrl: string }`
- 鉴权: Authorization header (JWT)

### `POST /api/posts`
创建文章接口。

- 请求: `{ title: string, content: string, category: string, images: string[] }`
- images: 图片 URL 数组，来自 `/api/upload` 的返回值
- 响应: `{ id: string, title: string, ... }`
- 鉴权: Authorization header (JWT)

## 前端上传流程

1. 用户在发布页面通过 `CoverImageUpload` 选择图片，展示本地预览
2. 点击"发布"时:
   1. 遍历图片文件，逐个调用 `POST /api/upload` → 拿到 `imageUrl[]`
   2. 调用 `POST /api/posts`，传入 title / content / category / images
3. 列表页直接通过 `post_images.imageUrl` 展示

## 存储结构

- Bucket: `post-images`（公开可读）
- 目录: `post-images/{uuid}.{ext}`

## 安全

- `/api/upload` 校验 JWT，文件大小限制 5MB，仅允许 image/*
- `/api/posts` 校验 JWT
