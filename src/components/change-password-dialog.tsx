"use client"

import { useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CloseIcon } from "@/components/icons"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasPassword: boolean
}

export function ChangePasswordDialog({ open, onOpenChange, hasPassword }: Props) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  function reset() {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setLoading(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (hasPassword && !oldPassword) return
    if (!newPassword || newPassword.length < 6) {
      toast.error("密码长度不能少于6位")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }

    setLoading(true)
    try {
      await api("/api/auth/password", {
        method: "PUT",
        body: hasPassword ? { oldPassword, newPassword } : { newPassword },
      })
      toast.success("密码修改成功")
      onOpenChange(false)
    } catch (data: any) {
      toast.error(data.error || "修改失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v) }}>
      <DialogContent
        className="sm:max-w-[448px] gap-0 p-6 rounded-2xl bg-white shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.1)] border-0 ring-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">修改密码</DialogTitle>

        {/* 关闭按钮 */}
        <button
          onClick={() => { reset(); onOpenChange(false) }}
          className="absolute top-4 right-4 flex items-center justify-center text-[#101828] hover:text-[#364153] transition-colors cursor-pointer"
          aria-label="关闭"
        >
          <CloseIcon className="size-8" />
        </button>

        {/* 标题 */}
        <h2 className="text-[20px] font-semibold text-[#101828] leading-7">
          修改密码
        </h2>

        {/* 描述 */}
        <p className="text-sm text-[#6A7282] leading-5 pt-2">
          请输入您的新密码
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPassword && (
            <div className="pt-6">
              <label className="block text-sm font-medium text-[#364153] leading-5 pb-2">
                原密码
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                className="w-full h-[49px] px-4 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] text-base text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none"
              />
            </div>
          )}

          <div className={hasPassword ? "pt-0" : "pt-6"}>
            <label className="block text-sm font-medium text-[#364153] leading-5 pb-2">
              新密码
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少6位）"
              className="w-full h-[49px] px-4 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] text-base text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#364153] leading-5 pb-2">
              确认新密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              className="w-full h-[49px] px-4 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] text-base text-[#101828] placeholder-[rgba(10,10,10,0.5)] outline-none"
            />
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => { reset(); onOpenChange(false) }}
              className="flex-1 h-[48px] rounded-[10px] bg-[#F3F4F6] text-[#364153] text-base font-medium hover:bg-[#E5E7EB] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (hasPassword && !oldPassword) ||
                !newPassword ||
                !confirmPassword
              }
              className="flex-1 h-[48px] rounded-[10px] bg-[#FB2C36] text-white text-base font-medium hover:bg-[#e0262f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "处理中..." : "确认修改"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
