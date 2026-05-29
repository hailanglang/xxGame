"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LoginDialog } from "@/components/login-dialog"

const links = [
  { href: "/", label: "首页" },
  { href: "/interactions", label: "互动" },
]

export function NavBar() {
  const pathname = usePathname()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white border-b border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto h-full flex items-center justify-between px-8">
        <Link
          href="/"
          className="text-xl font-semibold text-[#101828] leading-7"
        >
          XXGame
        </Link>

        <div className="flex items-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-base font-medium leading-6",
                pathname === link.href
                  ? "text-[#FB2C36]"
                  : "text-[#4A5565]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => setLoginOpen(true)}
            className="ml-8 w-20 h-10 bg-[#FB2C36] hover:bg-[#e0262f] text-white text-base font-medium rounded-[10px] transition-colors"
          >
            登录
          </button>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  )
}
