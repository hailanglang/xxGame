"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LoginDialog } from "@/components/login-dialog"
import { useUserStore } from "@/stores/user-store"
import { UserIcon, LogoutIcon } from "@/components/icons"

const links = [
  { href: "/", label: "首页" },
  { href: "/interactions", label: "互动" },
]

export function NavBar() {
  const pathname = usePathname()
  const [loginOpen, setLoginOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const token = useUserStore((s) => s.token)
  const user = useUserStore((s) => s.user)
  const clearAuth = useUserStore((s) => s.clearAuth)
  const isLoggedIn = mounted && !!(token && user)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

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

          {isLoggedIn ? (
            /* 用户信息 — Figma: 12:14 */
            <div className="relative ml-8" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                <UserIcon className="size-6 text-[#4A5565]" />
                <span className="text-sm font-medium text-[#101828] leading-5">
                  {user?.nickname}
                </span>
              </button>

              {/* 下拉菜单 — Figma: 12:22 */}
              {menuOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-36 bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)] py-2">
                  <button
                    onClick={() => {
                      clearAuth()
                      setMenuOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-[#364153] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  >
                    <LogoutIcon className="size-4 text-[#364153]" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="ml-8 w-20 h-10 bg-[#FB2C36] hover:bg-[#e0262f] text-white text-base font-medium rounded-[10px] transition-colors cursor-pointer"
            >
              登录
            </button>
          )}
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  )
}
