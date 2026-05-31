"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ChevronDownIcon } from "@/components/icons"
import { CoverImageUpload } from "@/components/cover-image-upload"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

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
  const [coverUrls, setCoverUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title || !content) return
    setLoading(true)
    try {
      try {
        await api("/api/posts", {
          method: "POST",
          body: { title, content, category, images: coverUrls },
        })
        toast.success("发布成功")
        router.push("/web/interactions")
      } catch (data: any) {
        toast.error(data.error || "发布失败")
      }
    } catch {
      toast.error("发布失败，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 内容区域 */}
      <div className="max-w-[896px] mx-auto px-8 py-6 pb-[80px]">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-5"
        >
          {/* 头部 — Figma: "发布内容" 20px Semi Bold + 关闭按钮 */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#101828] leading-7">
              发布内容
            </h1>

          </div>

          {/* 封面 — Figma: 水平布局, label 80px + 上传区, pt-5 */}
          <div className="flex gap-4 pt-5">
            <span className="w-20 shrink-0 pt-2 text-sm font-medium text-[#364153] leading-5">
              封面
            </span>
            <div className="flex-1">
              <CoverImageUpload
                onValueChange={setCoverUrls}
              />
            </div>
          </div>

          {/* 选择分类 — Figma: 水平布局, h-12, pt-3 */}
          <div className="flex items-center gap-4 pt-3">
            <span className="w-20 shrink-0 text-sm font-medium text-[#364153] leading-5">
              选择分类
            </span>
            <div className="relative flex-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] border border-[#E5E7EB] text-sm text-[#101828] bg-white appearance-none outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF] pointer-events-none" />
            </div>
          </div>

          {/* 标题 — Figma: 水平布局, pt-3 */}
          <div className="flex items-center gap-4 pt-3">
            <span className="w-20 shrink-0 text-sm font-medium text-[#364153] leading-5">
              标题
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入标题（必填）"
              className="flex-1 h-[37px] px-3 py-2 rounded-[10px] border border-[#E5E7EB] text-sm text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none"
            />
          </div>

          {/* 内容 — Figma: 水平布局, h-[161px], py-3 */}
          <div className="flex gap-4 py-3">
            <span className="w-20 shrink-0 pt-2 text-sm font-medium text-[#364153] leading-5">
              内容
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法...（必填）"
              className="flex-1 h-[260px] px-3 py-2 rounded-[10px] border border-[#E5E7EB] text-sm text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none resize-none leading-5"
            />
          </div>
        </form>
      </div>

      {/* 底部固定操作栏 — Figma: sticky bottom, border-t, shadow */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]">
        <div className="max-w-[896px] mx-auto px-4 py-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-[68px] h-9 rounded-[10px] text-sm font-medium text-[#364153] hover:bg-[#F3F4F6] transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !title || !content}
            onClick={handleSubmit}
            className="w-[76px] h-9 rounded-[10px] bg-[#FB2C36] hover:bg-[#e0262f] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "提交中..." : "发布"}
          </button>
        </div>
      </div>
    </>
  )
}
