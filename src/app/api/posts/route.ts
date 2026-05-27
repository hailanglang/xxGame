import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

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

    return Response.json({
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
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
