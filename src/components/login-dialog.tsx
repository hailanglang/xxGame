"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CloseIcon } from "@/components/icons"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => phoneRef.current?.focus(), 150)
    }
  }, [open])

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function sendCode() {
    if (!phone || !/^1\d{10}$/.test(phone)) return
    setSending(true)
    try {
      const res = await fetch("/api/sms/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (res.ok) {
        setCountdown(60)
      } else {
        alert(data.error || "发送失败")
      }
    } catch {
      alert("发送失败，请稍后再试")
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !code) return
    setLoading(true)
    // TODO: 接入验证码校验 + 登录
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[448px] gap-0 p-6 rounded-2xl bg-white shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.1)] border-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">登录 / 注册</DialogTitle>

        {/* 关闭按钮 — Figma: x:408, y:16, 24x24 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 size-6 flex items-center justify-center text-[#101828] hover:text-[#364153] transition-colors"
          aria-label="关闭"
        >
          <CloseIcon />
        </button>

        {/* 标题 — Figma: "验证码登录" 16px Semi Bold + 下划线指示器 */}
        <div className="flex items-center gap-8 mb-8">
          <div className="relative">
            <h2 className="text-base font-semibold text-[#101828] leading-6">
              验证码登录
            </h2>
            <div className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-[#101828]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 手机号输入 — Figma: 400x56, bg #F9FAFB, radius 10px */}
          <input
            ref={phoneRef}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号码"
            className="w-full h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
          />

          {/* 验证码行 — Figma: 输入框 + 获取验证码按钮, gap 8px */}
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入验证码"
              className="flex-1 h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
            />
            <button
              type="button"
              disabled={sending || countdown > 0 || !phone}
              onClick={sendCode}
              className="w-32 h-14 shrink-0 rounded-[10px] bg-[#E5E7EB] text-[#364153] text-base font-medium hover:bg-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "发送中..." : countdown > 0 ? `${countdown}s` : "获取验证码"}
            </button>
          </div>

          {/* 登录按钮 — Figma: 全宽 56px, bg #1E2939, radius 10px */}
          <button
            type="submit"
            disabled={loading || !phone || !code}
            className="w-full h-14 rounded-[10px] bg-[#1E2939] text-white text-base font-medium hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-[52px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              "登录/注册"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
