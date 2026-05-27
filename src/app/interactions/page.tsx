import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const metadata: Metadata = {
  title: "互动列表",
  description: "浏览 XXGame 社区中最新的游戏讨论和影视动态",
}

export default async function InteractionsPage() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 20,
    include: {
      author: { select: { id: true, nickname: true, avatarUrl: true } },
      workspace: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 3 },
    },
  })

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">互动列表</h1>
        <Link
          href="/interactions/new"
          className="bg-[#E8392A] hover:bg-[#d02a1e] text-white px-4 py-2 rounded-md text-sm"
        >
          发布互动
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-400 py-20">还没有内容，快来发布第一篇互动帖吧</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/interactions/${post.id}`}
              className="block"
            >
              <article className="bg-white rounded-[20px] p-[18px] max-w-[660px] hover:shadow-md transition-shadow">
                {/* 缩略图行 — Figma: 3张 180x96px */}
                <div className="flex gap-[31px] mb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[180px] h-[96px] bg-gray-200 rounded-[10px] overflow-hidden shrink-0"
                    >
                      {post.images[i] ? (
                        <img
                          src={post.images[i].imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                      )}
                    </div>
                  ))}
                </div>

                {/* 标题 — Figma: 28px */}
                <h2 className="text-[28px] font-normal text-black leading-[34px] mb-2">
                  {post.title}
                </h2>

                {/* 摘要 — Figma: 18px, 3行 */}
                <p className="text-[18px] text-gray-600 leading-[22px] mb-4 line-clamp-3">
                  {post.summary}
                </p>

                {/* 底部: 头像 + 工作区 */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-[24px] w-[24px]">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                      {post.author.nickname?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {post.workspace && (
                    <span className="text-[18px] text-black">
                      {post.workspace.name}
                    </span>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
