"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: 接入真实短信 API
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[460px] gap-0 p-0 rounded-lg bg-white border-[#D9D9D9]"
        style={{ padding: 0 }}
        showCloseButton={false}
      >
        {/* 关闭按钮 — Figma: 16:532, 右上角 15x15px, 4px stroke */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-[31px] right-[25px] size-[15px] flex items-center justify-center text-[#1E1E1E] hover:text-black"
          aria-label="关闭"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="4">
            <line x1="1" y1="1" x2="14" y2="14" />
            <line x1="14" y1="1" x2="1" y2="14" />
          </svg>
        </button>

        <DialogHeader className="sr-only">
          <DialogTitle>登录 / 注册</DialogTitle>
        </DialogHeader>

        {/* 表单 — Figma: 24px padding, 24px gap */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          {/* 手机号 — Figma: Input Field 18:64 */}
          <div className="flex flex-col gap-2">
            <label className="text-base text-[#1E1E1E]">手机号</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号码"
              className="h-11 rounded-lg border-[#D9D9D9] text-base"
            />
          </div>

          {/* 验证码 — Figma: Input Field 18:65 */}
          <div className="flex flex-col gap-2">
            <label className="text-base text-[#1E1E1E]">验证码</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入验证码"
              className="h-11 rounded-lg border-[#D9D9D9] text-base"
            />
          </div>

          {/* 登录/注册 — Figma: Button 18:66, #2C2C2C bg, full width */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg text-base font-normal bg-[#2C2C2C] hover:bg-[#3C3C3C] text-[#F5F5F5]"
          >
            {loading ? "处理中..." : "登录/注册"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
