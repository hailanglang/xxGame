// src/game/useGameBridge.ts
"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/user-store"

const BRIDGE_CHANNEL = "game:bridge"

export function sendToReact(type: string, payload: unknown) {
  window.dispatchEvent(new CustomEvent(BRIDGE_CHANNEL, { detail: { type, payload } }))
}

export function useGameBridge(game: Phaser.Game | null) {
  const token = useUserStore((s) => s.token)

  useEffect(() => {
    if (!game) return

    const handler = (e: Event) => {
      const { type, payload } = (e as CustomEvent).detail
      switch (type) {
        case "PHASER_READY":
          // Phaser 初始化完成，React 侧可同步 token
          if (token) {
            const scene = game.scene.getScene("PlayScene")
            scene?.events.emit("auth:set-token", token)
          }
          break
      }
    }

    window.addEventListener(BRIDGE_CHANNEL, handler)
    return () => window.removeEventListener(BRIDGE_CHANNEL, handler)
  }, [game, token])
}
