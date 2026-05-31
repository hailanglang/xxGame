import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { getUserFromHeaders } from "@/lib/auth"
import type { PostsResponse, CreatePostResponse, ApiError } from "@/types/api"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const cursor = searchParams.get("cursor")
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)

  try {
    const posts = await prisma.post.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        workspace: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 3 },
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts

    const body: PostsResponse = {
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        summary: p.summary,
        author: p.author,
        workspace: p.workspace,
        images: p.images.map((i) => i.imageUrl),
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        publishedAt: p.publishedAt,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }
    return Response.json(body)
  } catch (e) {
    return Response.json({ error: String(e) } satisfies ApiError, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromHeaders(request)
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const { title, content, images } = await request.json()

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

    return Response.json(post satisfies CreatePostResponse)
  } catch (e) {
    console.error("create post error:", e)
    return Response.json({ error: "发布失败" } satisfies ApiError, { status: 500 })
  }
}
