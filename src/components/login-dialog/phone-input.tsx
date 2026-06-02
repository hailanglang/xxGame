"use client"

import { forwardRef } from "react"

interface Props {
  value: string
  onChange: (value: string) => void
}

export const PhoneInput = forwardRef<HTMLInputElement, Props>(
  function PhoneInput({ value, onChange }, ref) {
    return (
      <input
        ref={ref}
        type="tel"
        maxLength={11}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="请输入手机号码"
        className="w-full h-14 px-4 rounded-[10px] bg-[#F9FAFB] text-base text-[#101828] placeholder-[#99A1AF] outline-none"
      />
    )
  },
)
