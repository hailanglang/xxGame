"use client"

interface Props {
  value: string
  onChange: (value: string) => void
}

export function PasswordInput({ value, onChange }: Props) {
  return (
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="请输入密码"
      className="w-full h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
    />
  )
}
