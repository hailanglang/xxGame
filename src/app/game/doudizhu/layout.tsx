import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "斗地主 — XXGame",
  description: "经典斗地主纸牌游戏，与 AI 对战，挑战牌技！",
}

export default function DoudizhuLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
