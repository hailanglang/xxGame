"use client"

import { useState, useRef, useEffect, memo, type FormEvent } from "react"
import { Dialog, DialogContent,DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CloseIcon } from "@/components/icons"
import { useUserStore } from "@/stores/user-store"
import { api } from "@/lib/api-client"
import type { VerifyCodeResponse } from "@/types/api"
import { PhoneInput } from "@/components/login-dialog/phone-input"
import { CodeInput } from "@/components/login-dialog/code-input"
import { PasswordInput } from "@/components/login-dialog/password-input"
import { toast } from "sonner"

type LoginMode = "code" | "password"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const setAuth = useUserStore((s) => s.setAuth)
  const [mode, setMode] = useState<LoginMode>("password")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => phoneRef.current?.focus(), 150)
    }
  }, [open])
  // 重置状态
  useEffect(() => {
    if (!open) {
      setMode("password")
      setPhone("")
      setCode("")
      setPassword("")
      setLoading(false)
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!phone) return

    if (mode === "code") {
      if (!code) return
    } else {
      if (!password) return
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
        <DialogDescription className="sr-only">
          通过手机号验证码或密码登录XXGame账号
        </DialogDescription>
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
          {([["password", "密码登录"],["code", "验证码登录"]] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              className="relative cursor-pointer"
              onClick={() => setMode(m)}
            >
              <h2
                className={`text-base leading-6 ${
                  isActive(m)
                    ? "font-semibold text-[#101828]"
                    : "font-medium text-[#99A1AF]"
                }`}
              >
                {label}
              </h2>
              {isActive(m) && (
                <div className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-[#101828]" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PhoneInput ref={phoneRef} value={phone} onChange={setPhone} />

          {mode === "code" ? (
            <CodeInput phone={phone} value={code} onChange={setCode} />
          ) : (
            <PasswordInput value={password} onChange={setPassword} />
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
              <span className="flex  items-center justify-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              <span className="text-xl">登录{mode == 'code' ? "/注册" : ''}</span>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
