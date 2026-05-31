"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import type { PostDetail } from "@/types/api"
import { ChevronLeftIcon, EyeIcon, HeartIcon, CommentIcon } from "@/components/icons"

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [imageIdx, setImageIdx] = useState(0)

  useEffect(() => {
    api<PostDetail>(`/api/posts/${id}`).then(setPost)
  }, [id])

  if (!post) {
    return (
      <div className="max-w-[896px] mx-auto px-8 py-6">
        <p className="text-center text-[#4A5565] py-20">加载中...</p>
      </div>
    )
  }

  const images = post.images
  const date = new Date(post.publishedAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="max-w-[896px] mx-auto px-8 py-6 pb-8">
      {/* 返回按钮 — Figma: 19:21 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-[#4A5565] hover:text-[#101828] transition-colors cursor-pointer leading-5"
      >
        <ChevronLeftIcon className="size-5" />
        返回
      </button>

      {/* 文章卡片 — Figma: 19:28 */}
      <article className="mt-4 bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
        {/* 图片轮播 — Figma: 19:30, 320px height */}
        {images.length > 0 && (
          <div className="relative h-[320px] bg-[#F3F4F6]">
            <img
              src={images[imageIdx]}
              alt=""
              className="w-full h-full object-cover"
            />

            {/* 左箭头 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImageIdx((imageIdx - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="size-6" />
                </button>
                {/* 右箭头 */}
                <button
                  onClick={() => setImageIdx((imageIdx + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="size-6 rotate-180" />
                </button>
                {/* 指示点 — Figma: 19:44-19:46 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIdx(i)}
                      className={`rounded-full transition-colors cursor-pointer ${
                        i === imageIdx ? "size-2 bg-white" : "size-2 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 文章信息 — Figma: 19:47, padding 24px */}
        <div className="p-6">
          {/* 作者 — Figma: 19:48 */}
          <div className="flex items-center gap-3">
            <div className="size-10 flex items-center justify-center bg-[#F3F4F6] rounded-full text-xl">
              🎬
            </div>
            <span className="text-sm font-medium text-[#101828] leading-5">
              {post.author.nickname || "匿名用户"}
            </span>
          </div>

          {/* 标题 — Figma: 24px Semi Bold */}
          <h1 className="mt-4 text-2xl font-semibold text-[#101828] leading-8">
            {post.title}
          </h1>

          {/* 正文 — Figma: 16px, line-height 26px */}
          <p className="mt-4 text-base text-[#364153] leading-[26px] whitespace-pre-wrap">
            {post.content}
          </p>

          {/* 标签 — Figma: 19:57 */}
          <div className="mt-6">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FEF2F2] text-xs text-[#E7000B] leading-4">
              话题分享
            </span>
          </div>

          {/* 发布日期 — Figma: 19:61 */}
          <p className="mt-4 text-xs text-[#6A7282] leading-4">
            {date}
          </p>

          {/* 统计栏 — Figma: 19:63, border-top, pt-4 */}
          <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1 text-sm text-[#6A7282] leading-5">
                <EyeIcon className="text-[#6A7282]" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1 text-sm text-[#6A7282] leading-5">
                <HeartIcon className="text-[#6A7282]" />
                {post.likeCount}
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] hover:bg-[#F3F4F6] text-[#FB2C36] cursor-pointer transition-colors">
              <CommentIcon className="text-[#FB2C36]" />
              <span className="text-sm font-medium leading-5">{post.commentCount}</span>
            </button>
          </div>
        </div>
      </article>

      {/* 评论卡片 — Figma: 19:80 */}
      <section className="mt-4 bg-white border border-[#E5E7EB] rounded-[10px] p-6">
        <h2 className="text-lg font-semibold text-[#101828] leading-7">
          评论 ({post.commentCount})
        </h2>

        {/* 空评论 — Figma: 19:84 */}
        <div className="pt-12 pb-8 flex flex-col items-center">
          <CommentIcon className="size-8 text-[#99A1AF] opacity-50" />
          <p className="mt-2 text-sm text-[#99A1AF] leading-5">
            暂无评论
          </p>
        </div>
      </section>
    </div>
  )
}
