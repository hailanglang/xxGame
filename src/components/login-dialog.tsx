"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CloseIcon } from "@/components/icons"
import { useUserStore } from "@/stores/user-store"
import { api } from "@/lib/api-client"
import type { VerifyCodeResponse } from "@/types/api"
import { toast } from "sonner"

type LoginMode = "code" | "password"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const setAuth = useUserStore((s) => s.setAuth)
  const [mode, setMode] = useState<LoginMode>("code")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => phoneRef.current?.focus(), 150)
    }
  }, [open])

  // 重置状态
  useEffect(() => {
    if (!open) {
      setMode("code")
      setPhone("")
      setCode("")
      setPassword("")
      setAgreed(false)
      setCountdown(0)
      setLoading(false)
      setSending(false)
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
      try {
        await api("/api/sms/send-code", { method: "POST", body: { phone } })
        setCountdown(60)
      } catch (data: any) {
        toast.error(data.error || "发送失败")
      }
    } catch {
      toast.error("发送失败，请稍后再试")
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!phone) return

    if (mode === "code") {
      if (!code) return
    } else {
      if (!password) return
      if (!agreed) {
        toast.error("请先同意用户协议和隐私政策")
        return
      }
    }

    setLoading(true)
    try {
      try {
        const data =
          mode === "code"
            ? await api<VerifyCodeResponse>("/api/auth/verify-code", {
                method: "POST",
                body: { phone, code },
              })
            : await api<VerifyCodeResponse>("/api/auth/password-login", {
                method: "POST",
                body: { phone, password },
              })
        setAuth(data.token, data.user)
        toast.success("登录成功")
        onOpenChange(false)
      } catch (data: any) {
        toast.error(data.error || "登录失败")
      }
    } catch {
      toast.error("登录失败，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  const isActive = (m: LoginMode) => m === mode

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[448px] gap-0 p-6 rounded-2xl bg-white shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.1)] border-0 ring-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">登录 / 注册</DialogTitle>

        {/* 关闭按钮 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 flex items-center justify-center text-[#101828] hover:text-[#364153] transition-colors cursor-pointer"
          aria-label="关闭"
        >
          <CloseIcon className="size-8" />
        </button>

        {/* 标签切换 — Figma: 验证码登录 | 密码登录，gap 32px，选中态底部有2px下划线 */}
        <div className="flex items-center gap-8 mb-8">
          <button
            type="button"
            className="relative cursor-pointer"
            onClick={() => setMode("code")}
          >
            <h2
              className={`text-base leading-6 ${
                isActive("code")
                  ? "font-semibold text-[#101828]"
                  : "font-medium text-[#99A1AF]"
              }`}
            >
              验证码登录
            </h2>
            {isActive("code") && (
              <div className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-[#101828]" />
            )}
          </button>
          <button
            type="button"
            className="relative cursor-pointer"
            onClick={() => setMode("password")}
          >
            <h2
              className={`text-base leading-6 ${
                isActive("password")
                  ? "font-semibold text-[#101828]"
                  : "font-medium text-[#99A1AF]"
              }`}
            >
              密码登录
            </h2>
            {isActive("password") && (
              <div className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-[#101828]" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 手机号输入 */}
          <input
            ref={phoneRef}
            type="tel"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号码"
            className="w-full h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
          />

          {mode === "code" ? (
            <>
              {/* 验证码行 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入验证码"
                  className="flex-1 h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
                />
                <button
                  type="button"
                  disabled={sending || countdown > 0 || !phone}
                  onClick={sendCode}
                  className="w-32 h-14 shrink-0 rounded-[10px] bg-[#E5E7EB] text-[#364153] text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>

            </>
          ) : (
            <>
              {/* 密码输入 — Figma: 400x56, bg #F9FAFB, radius 10px */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
              />
            </>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={
              loading ||
              !phone ||
              (mode === "code" ? !code : !password)
            }
            className="w-full h-14 rounded-[10px] bg-[#1E2939] text-white text-base font-medium hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-10 cursor-pointer"
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
