import type { Metadata } from "next"
import { type ReactNode } from "react"
import { NavBar } from "@/components/nav-bar"
import { ToastProvider } from "@/components/toast-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "XXGame — 游戏玩家社区",
    template: "%s | XXGame",
  },
  description: "发现好玩家，游戏有伴，拒绝凑数。XXGame 是一个游戏玩家社区平台。",
  keywords: ["游戏社区", "游戏玩家", "找游戏搭子", "AI陪玩", "斗地主", "飞行棋", "XXGame", "游戏社交"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "XXGame",
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#F9FAFB] min-h-screen">
        <NavBar />
        {children}
        <ToastProvider />
        <SpeedInsights/>
      </body>
    </html>
  )
}
