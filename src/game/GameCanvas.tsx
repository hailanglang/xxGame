"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { doudizhuConfig } from "./doudizhu/config"

const ASPECT_RATIO = 16 / 9

function fitAspect(maxW: number, maxH: number): { width: number; height: number } {
  let w = maxW
  let h = Math.round(w / ASPECT_RATIO)
  if (h > maxH) {
    h = maxH
    w = Math.round(h * ASPECT_RATIO)
  }
  return { width: w, height: h }
}

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || gameRef.current) return

    const { width, height } = fitAspect(el.clientWidth, el.clientHeight)
    gameRef.current = new Phaser.Game({
      ...doudizhuConfig,
      width: width * devicePixelRatio,
      height: height * devicePixelRatio,
      parent: el,
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="flex justify-center h-[calc(100vh-64px)]">
      <div ref={containerRef} className="w-full mt-10 h-full max-w-[960px] max-h-[540px]" />
    </div>
  )
}
