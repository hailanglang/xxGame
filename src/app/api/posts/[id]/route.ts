import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import type { PostDetail, ApiError } from "@/types/api"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        workspace: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    })

    if (!post || post.status !== "published") {
      return Response.json({ error: "文章不存在" } satisfies ApiError, { status: 404 })
    }

    const body: PostDetail = {
      id: post.id,
      title: post.title,
      content: post.content,
      summary: post.summary,
      author: post.author,
      workspace: post.workspace,
      images: post.images.map((i:{ imageUrl: string }) => i.imageUrl),
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      publishedAt: post.publishedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
    }
    return Response.json(body)
  } catch (e) {
    console.error("post detail error:", e)
    return Response.json({ error: "加载失败" } satisfies ApiError, { status: 500 })
  }
}
