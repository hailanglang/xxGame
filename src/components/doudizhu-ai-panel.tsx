"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/stores/game-store"

export function DoudizhuAiPanel() {
  const savedKey = useGameStore((s) => s.doudizhuApiKey)
  const setKey = useGameStore((s) => s.setDoudizhuApiKey)
  const [open, setOpen] = useState(false)
  const [inputKey, setInputKey] = useState(savedKey)

  return (
    <div>
      <Button
        variant="outline"
        className="bg-white/80 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {open ? "关闭" : "AI 设置"}
      </Button>

      {open && (
        <div className="mt-2 w-72 rounded-lg bg-white p-4 shadow-lg">
          <label className="text-xs font-medium text-gray-500">
            🔑 DeepSeek API Key
          </label>
          <Input
            type="password"
            placeholder="sk-xxxxxxxx"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="mt-1"
          />
          <Button
            className="mt-2 w-full cursor-pointer"
            size="sm"
            onClick={() => setKey(inputKey)}
          >
            保存
          </Button>
          {savedKey && (
            <p className="mt-1 text-xs text-green-600">✓ API Key 已设置</p>
          )}
        </div>
      )}
    </div>
  )
}
