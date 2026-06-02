"use client"

interface Props {
  value: string
  onChange: (value: string) => void
  sending: boolean
  countdown: number
  disabled: boolean
  onSend: () => void
}

export function CodeInput({ value, onChange, sending, countdown, disabled, onSend }: Props) {
  console.log('code input render', )
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
        disabled={sending || countdown > 0 || disabled}
        onClick={onSend}
        className="w-32 h-14 shrink-0 rounded-[10px] bg-[#E5E7EB] text-[#364153] text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {countdown > 0 ? `${countdown}s` : "获取验证码"}
      </button>
    </div>
  )
}
