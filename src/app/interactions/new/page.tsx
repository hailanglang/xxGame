"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CloseIcon, ImageIcon, VideoIcon, SmileIcon, ChevronDownIcon } from "@/components/icons"

const categories = [
  { value: "", label: "请选择分类" },
  { value: "topic", label: "话题分享" },
  { value: "photo-scout", label: "摄影探头" },
  { value: "photo-skill", label: "摄影技巧" },
  { value: "equipment", label: "器材讨论" },
]

export default function NewInteractionPage() {
  const router = useRouter()
  const [category, setCategory] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !content) return
    setLoading(true)
    // TODO: 接入 API
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
  }

  return (
    <div className="max-w-[896px] mx-auto p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E7EB] rounded-[10px] p-8"
      >
        {/* 头部 — Figma: "发布内容" + 关闭按钮 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#101828] leading-8">
            发布内容
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#99A1AF] hover:text-[#364153] transition-colors"
            aria-label="关闭"
          >
            <CloseIcon />
          </button>
        </div>

        {/* 选择分类 — Figma: mt-6 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-[#364153] leading-5 mb-2">
            选择分类
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-[47px] px-4 rounded-[10px] border border-[#E5E7EB] text-base text-[#101828] bg-white appearance-none outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-[#99A1AF] pointer-events-none" />
          </div>
        </div>

        {/* 标题 — Figma: mt-6 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-[#364153] leading-5 mb-2">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题（必填）"
            className="w-full h-[49px] px-4 py-3 rounded-[10px] border border-[#E5E7EB] text-base text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none"
          />
        </div>

        {/* 内容 — Figma: mt-6 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-[#364153] leading-5 mb-2">
            内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的想法...（必填）"
            rows={8}
            className="w-full h-[217px] px-4 py-3 rounded-[10px] border border-[#E5E7EB] text-base text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none resize-none leading-6"
          />
        </div>

        {/* 媒体工具栏 — Figma: mt-6, border-b, pb-6 */}
        <div className="mt-6 border-b border-[#E5E7EB] pb-6">
          <div className="flex items-center gap-4">
            {[
              { icon: ImageIcon, label: "图片" },
              { icon: VideoIcon, label: "视频" },
              { icon: SmileIcon, label: "表情" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[#4A5565] hover:bg-[#F3F4F6] transition-colors"
              >
                <Icon className="text-[#4A5565]" />
                <span className="text-sm font-medium leading-5">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 操作按钮 — Figma: mt-6, justify-end */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-20 h-12 rounded-[10px] text-base font-medium text-[#364153] hover:bg-[#F3F4F6] transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !title || !content}
            className="w-24 h-12 rounded-[10px] bg-[#FB2C36] hover:bg-[#e0262f] text-white text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "提交中..." : "发布"}
          </button>
        </div>
      </form>
    </div>
  )
}
