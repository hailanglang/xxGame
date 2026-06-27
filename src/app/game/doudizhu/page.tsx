"use client"

import dynamic from "next/dynamic"
import { DoudizhuAiPanel } from "@/components/doudizhu-ai-panel"

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
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
