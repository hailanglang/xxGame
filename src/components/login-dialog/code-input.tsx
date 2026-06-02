"use client"

import { useState, useEffect, memo} from "react"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface Props {
  phone: string
  value: string
  onChange: (value: string) => void
}

export const CodeInput = memo(function CodeInput({ phone, value, onChange }: Props) {
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)

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

  return (
    <div className="flex gap-2">
      <input
        type="text"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  )
})
