import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "2048 — XXGame",
  description: "经典 2048 数字游戏，滑动合并，挑战 2048！",
}

export default function Game2048Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
