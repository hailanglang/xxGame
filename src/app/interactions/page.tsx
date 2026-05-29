import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { WorkspaceIcon, EyeIcon, HeartIcon, CommentIcon } from "@/components/icons"

export const metadata: Metadata = {
  title: "互动列表",
  description: "浏览 XXGame 社区中最新的游戏讨论和影视动态",
}

const categoryTabs = [
  { label: "话题分享", active: true },
  { label: "摄影探头", active: false },
  { label: "摄影技巧", active: false },
  { label: "器材讨论", active: false },
]

const recommendedUsers = [
  { name: "摄影王老师", fans: "12.5K", emoji: "📸" },
  { name: "CFJ", fans: "8.3K", emoji: "🎬" },
  { name: "摄影师阿明", fans: "15.2K", emoji: "📷" },
  { name: "光影追寻者", fans: "6.7K", emoji: "🌟" },
]

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
    <div className="max-w-[1280px] mx-auto px-8 py-6">
      <div className="flex gap-6">
        {/* ================================================================ */}
        {/* 左侧导航 — Figma: 182.67px, padding 16px                          */}
        {/* ================================================================ */}
        <aside className="w-[182.67px] shrink-0">
          <nav className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 space-y-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab.label}
                className={`
                  block w-full h-10 rounded-[10px] text-base font-medium leading-6 text-left px-4
                  ${tab.active
                    ? "bg-[#FB2C36] text-white"
                    : "text-[#364153] hover:bg-[#F3F4F6]"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* 发布按钮 — 与 nav-bar 登录按钮相同样式 */}
          <Link
            href="/interactions/new"
            className="mt-3 block w-full h-10 bg-[#FB2C36] hover:bg-[#e0262f] text-white text-base font-medium rounded-[10px] transition-colors flex items-center justify-center"
          >
            发布
          </Link>
        </aside>

        {/* ================================================================ */}
        {/* 中间文章列表 — Figma: 699.33px                                    */}
        {/* ================================================================ */}
        <main className="flex-1 max-w-[699.33px]">
          {posts.length === 0 ? (
            <p className="text-center text-[#4A5565] py-20">
              还没有内容，快来发布第一篇互动帖吧
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/interactions/${post.id}`}
                  className="block"
                >
                  <article className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 hover:shadow-md transition-shadow">
                    {/* 图片行 — Figma: 3张, 每张约 211x119px, gap 8px */}
                    <div className="flex gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-[119px] bg-[#F3F4F6] rounded-[10px] overflow-hidden"
                        >
                          {post.images[i] ? (
                            <img
                              src={post.images[i].imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {/* 标题 — Figma: 20px Semi Bold, #101828, mt-4 */}
                    <h2 className="mt-4 text-xl font-semibold text-[#101828] leading-7">
                      {post.title}
                    </h2>

                    {/* 摘要 — Figma: 16px Regular, #4A5565, 3行, mt-2 */}
                    <p className="mt-2 text-base text-[#4A5565] leading-6 line-clamp-3 h-12">
                      {post.summary}
                    </p>

                    {/* 底部信息栏 — Figma: mt-4, space-between */}
                    <div className="mt-4 flex items-center justify-between">
                      {/* 左侧: 工作区 + 浏览数 */}
                      <div className="flex items-center gap-4">
                        {post.workspace && (
                          <span className="flex items-center gap-1 text-sm text-[#6A7282] leading-5">
                            <WorkspaceIcon className="text-[#6A7282]" />
                            {post.workspace.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm text-[#6A7282] leading-5">
                          <EyeIcon className="text-[#6A7282]" />
                          {post.viewCount}
                        </span>
                      </div>

                      {/* 右侧: 点赞 + 评论 */}
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-base font-medium text-[#6A7282] leading-6">
                          <HeartIcon className="text-[#6A7282]" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1 text-base font-medium text-[#6A7282] leading-6">
                          <CommentIcon className="text-[#6A7282]" />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* ================================================================ */}
        {/* 右侧边栏 — Figma: 286px                                          */}
        {/* ================================================================ */}
        <aside className="w-[286px] shrink-0 space-y-6">
          {/* 推荐关注 */}
          <section className="bg-white border border-[#E5E7EB] rounded-[10px] p-4">
            <h3 className="text-lg font-semibold text-[#101828] leading-[27px]">
              推荐关注
            </h3>
            <div className="mt-4 space-y-3">
              {recommendedUsers.map((user) => (
                <div key={user.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 flex items-center justify-center bg-[#F3F4F6] rounded-full text-xl">
                      {user.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#101828] leading-5">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#6A7282] leading-4">
                        {user.fans} 粉丝
                      </p>
                    </div>
                  </div>
                  <button className="w-[52px] h-7 bg-[#FB2C36] hover:bg-[#e0262f] text-white text-sm font-medium rounded transition-colors">
                    关注
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm font-medium text-[#4A5565] hover:text-[#101828] leading-5">
                查看更多 →
              </button>
            </div>
          </section>

          {/* 扫码关注 */}
          <section className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 text-center">
            <h3 className="text-lg font-semibold text-[#101828] leading-[27px]">
              扫码关注我们
            </h3>
            <div className="mt-3 flex justify-center">
              <div className="size-32 flex items-center justify-center bg-[#F3F4F6] rounded-[10px]">
                <div className="size-24 bg-[#D1D5DC] rounded" />
              </div>
            </div>
            <p className="mt-2 text-xs text-[#6A7282] leading-4">
              扫描二维码下载APP
            </p>
          </section>

          {/* 快捷入口 */}
          <section className="bg-white border border-[#E5E7EB] rounded-[10px] p-4">
            <div className="flex justify-around">
              {["小星座运势", "星座运势", "热点工具"].map((item) => (
                <button
                  key={item}
                  className="text-base font-medium text-[#4A5565] hover:text-[#101828] leading-6"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
