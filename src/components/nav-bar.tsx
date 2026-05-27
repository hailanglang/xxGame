"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "首页" },
  { href: "/interactions", label: "互动" },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 h-[100px] bg-white border-b">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-6">
        <Link href="/" className="text-[32px] font-normal text-black">
          XXGame
        </Link>

        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-base text-black px-2 py-2",
                pathname === link.href && "font-semibold"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button className="bg-[#E8392A] hover:bg-[#d02a1e] text-white rounded-md px-5 h-9">
            登录
          </Button>
        </div>
      </div>
    </nav>
  )
}
