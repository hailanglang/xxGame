"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { WorkspaceIcon, EyeIcon, HeartIcon, CommentIcon } from "@/components/icons"
import { api } from "@/lib/api-client"
import type { PostItem, PostsResponse } from "@/types/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/stores/user-store"

const categoryTabs = [
  { label: "话题分享", active: true },
  { label: "摄影探头", active: false },
  { label: "摄影技巧", active: false },
  { label: "器材讨论", active: false },
]

function PostSkeleton() {
  return (
    <article className="bg-white border border-[#E5E7EB] rounded-[10px] p-6">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[119px] rounded-[10px]" />
        ))}
      </div>
      <Skeleton className="mt-4 h-7 w-4/5" />
      <Skeleton className="mt-2 h-6 w-full" />
      <Skeleton className="mt-4 h-5 w-1/3" />
    </article>
  )
}

export default function InteractionsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<PostItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<PostsResponse>("/api/posts?limit=20")
      .then((data) => {
        setPosts(data.items)
        setNextCursor(data.nextCursor)
      })
      .catch(() => toast.error("加载失败，请稍后再试"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-6">
      <div className="flex gap-6 justify-center">
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
          <button
            onClick={() => {
              const token = useUserStore.getState().token
              if (!token) {
                toast.error("请登录后进行内容发布")
                return
              }
              router.push("/interactions/new")
            }}
            className="mt-3 block w-full h-10 bg-[#FB2C36] hover:bg-[#e0262f] text-white text-base font-medium rounded-[10px] transition-colors flex items-center justify-center cursor-pointer"
          >
            发布内容
          </button>
        </aside>

        {/* ================================================================ */}
        {/* 中间文章列表 — Figma: 699.33px                                    */}
        {/* ================================================================ */}
        <main className="flex-1 max-w-[699.33px]">
          {loading ? (
            <div className="space-y-6">
              {[0, 1, 2].map((i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-[#4A5565] py-20">
              还没有内容，快来发布第一篇互动帖吧
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/interactions/${post.id}`)}
                  className="block cursor-pointer"
                >
                  <article className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 hover:shadow-md transition-shadow">
                    {/* 图片行 — Figma: 3张, 每张约 211x119px, gap 8px */}
                    {post.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {post.images.slice(0, 3).map((url, i) => (
                          <div
                            key={i}
                            className="h-[119px] bg-[#F3F4F6] rounded-[10px] overflow-hidden"
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

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
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ================================================================ */}
        {/* 右侧边栏 — Figma: 286px                                          */}
        {/* ================================================================ */}
      </div>
    </div>
  )
}
