"use client"

import dynamic from "next/dynamic"
import { DoudizhuAiPanel } from "@/components/doudizhu-ai-panel"

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-white text-xl bg-[#1a6b3c]">
      加载中...
    </div>
  ),
})

export default function DoudizhuPage() {
  return (
    <div className="relative">
      <GameCanvas />
      <div className="absolute top-4 right-4 z-10">
        <DoudizhuAiPanel />
      </div>
    </div>
  )
}
