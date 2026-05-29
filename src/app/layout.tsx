import type { Metadata } from "next"
import { NavBar } from "@/components/nav-bar"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "XXGame — 游戏玩家社区",
    template: "%s | XXGame",
  },
  description: "发现好玩家，游戏有伴，拒绝凑数。XXGame 是一个游戏玩家社区平台。",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#F9FAFB] min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
