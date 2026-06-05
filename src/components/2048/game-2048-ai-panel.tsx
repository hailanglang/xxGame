"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { moveTiles } from "@/lib/game-2048"
import type { TileBoard, Direction } from "@/lib/game-2048"
import { addUsage, type TokenUsage } from "@/lib/deepseek-usage"
import TokenUsagePanel from "@/components/2048/token-usage-panel"
import { dsApi } from "@/lib/api-client"
import { useGameStore } from "@/stores/game-store"
import {
  BOARD_PX,
  DIR_ARROW,
  CMAP,
  serializeBoard,
  buildUserMessage,
  SYSTEM_PROMPT,
} from "@/components/2048/utils"
import type { AiMessage, DeepSeekResponse } from "@/components/2048/types"

interface GameAiPanelProps {
  board: TileBoard | null
  onMove: (dir: Direction) => void
}

export default function GameAiPanel({ board, onMove }: GameAiPanelProps) {
  // ---- 状态 ----
  const apiKey = useGameStore((s) => s.apiKey)
  const [autoMode, setAutoMode] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUsage, setLastUsage] = useState<TokenUsage | null>(null)
  const [totalUsage, setTotalUsage] = useState<TokenUsage>({ prompt: 0, cached: 0, miss: 0, completion: 0, total: 0, cost: 0 })

  // ---- ref ----
  const abortRef = useRef<AbortController | null>(null)
  const callIdRef = useRef(0)
  const autoModeRef = useRef(false)

  // ---- 保存到 localStorage ----
  const setApiKey = useGameStore((s) => s.setApiKey)
  const handleApiKeyChange = useCallback((val: string) => {
    setApiKey(val)
  }, [setApiKey])

  const toggleAutoMode = useCallback(() => {
    const next = !autoMode
    setAutoMode(next)
    autoModeRef.current = next
  }, [autoMode])

  // ---- 获取建议 ----
  const getSuggestion = useCallback(async () => {
    if (!board || !apiKey.trim()) return
    if (loading) return

    if (abortRef.current) {
      abortRef.current.abort()
    }

    const thisCall = ++callIdRef.current
    setLoading(true)
    setError(null)

    try {
      const snapshot = serializeBoard(board)
      const validDirs = (["up", "down", "left", "right"] as Direction[]).filter(
        (d) => moveTiles(board, d).moved,
      )
      if (validDirs.length === 0) {
        setError("当前局面无合法移动")
        setLoading(false)
        return
      }
      const { suggestion, usage } = await fetchSuggestion(board, validDirs)

      if (callIdRef.current !== thisCall) return // 被后续调用覆盖

      setLastUsage(usage)
      setTotalUsage((prev) => addUsage(prev, usage))

      const msg: AiMessage = {
        boardSnapshot: snapshot,
        direction: suggestion.direction,
        reason: suggestion.reason,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, msg])
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return
      }
      if (callIdRef.current !== thisCall) return // 被后续调用覆盖
      setError(e instanceof Error ? e.message : "未知错误")
    } finally {
      if (callIdRef.current === thisCall) setLoading(false)
    }
  }, [board, apiKey, loading])

  
  // ---- DeepSeek API 调用 ----
  async function fetchSuggestion(b: TileBoard, valid: Direction[]): Promise<{ suggestion: DeepSeekResponse; usage: TokenUsage }> {
    const controller = new AbortController()
    abortRef.current = controller

    const { content, usage } = await dsApi(apiKey, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(b, valid) },
    ], controller.signal)

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("AI 返回格式异常，请重试")

    const parsed = JSON.parse(jsonMatch[0]) as DeepSeekResponse
    if (!valid.includes(parsed.direction)) {
      throw new Error("AI 返回了无效方向，请重试")
    }

    return { suggestion: parsed, usage }
  }

  // ---- AI 托管：当棋盘变化时自动走下一步 ----
  useEffect(() => {
    if (!autoMode || !board || !apiKey.trim()) return

    abortRef.current?.abort()

    const thisCall = ++callIdRef.current

    const timer = setTimeout(async () => {
      const validDirs = (["up", "down", "left", "right"] as Direction[]).filter(
        (d) => moveTiles(board, d).moved,
      )
      if (validDirs.length === 0) return

      try {
        const snapshot = serializeBoard(board)
        const { suggestion, usage } = await fetchSuggestion(board, validDirs)
        if (callIdRef.current !== thisCall) return

        setLastUsage(usage)
        setTotalUsage((prev) => addUsage(prev, usage))
        setMessages((prev) => [
          ...prev,
          { boardSnapshot: snapshot, direction: suggestion.direction, reason: suggestion.reason, timestamp: Date.now() },
        ])
        await new Promise((r) => setTimeout(r, 0))
        onMove(suggestion.direction)
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        if (callIdRef.current !== thisCall) return
      }
    }, 400) // 等滑行 + appear 动画播完

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [board, autoMode, apiKey, onMove])

  /** 渲染 4×4 迷你棋盘 */
  function MiniBoard({ grid }: { grid: number[][] }) {
    return (
      <div className="grid grid-cols-4 gap-[1px]" style={{ width: 88, height: 88 }}>
        {grid.flat().map((v, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-[2px] text-[10px] font-bold leading-none"
            style={{
              width: 20,
              height: 20,
              backgroundColor: v === 0 ? "#CDC1B4" : (CMAP[v]?.bg ?? "#3C3A32"),
              color: v <= 4 ? "#776E65" : "#F9F6F2",
            }}
          >
            {v !== 0 ? (v >= 100 ? "…" : v) : ""}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 flex-col gap-3 border bg-white"
      style={{ width: 610, minHeight: BOARD_PX, borderRadius: 14, padding: 16, borderColor: "#E5E7EB" }}
    >
      <TokenUsagePanel lastUsage={lastUsage} totalUsage={totalUsage} />

      {/* ---- API Key 输入 ---- */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "#6A7282" }}>
          🔑 DeepSeek API Key
        </label>
        <Input
          type="password"
          placeholder="sk-xxxxxxxxxxxxxxxx"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
        />
      </div>

      {/* ---- AI 托管按钮 ---- */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="cursor-pointer"
          size="sm"
          onClick={toggleAutoMode}
          disabled={!apiKey.trim() || !board}
        >
          {autoMode ? "关闭托管" : "AI 托管"}
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          size="sm"
          onClick={getSuggestion}
          disabled={!apiKey.trim() || !board || loading || autoMode}
        >
          {loading ? "分析中…" : "获取建议"}
        </Button>
      </div>
      <div className="text-xs" style={{ color: "#99A1AF" }}>
        {autoMode ? "AI 正在自动下棋，无需手动操作" : "点击「AI 托管」让 AI 自动走棋"}
      </div>

      {/* ---- 错误提示 ---- */}
      {error && (
        <div className="rounded-md bg-red-50 p-2 text-xs" style={{ color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* ---- AI 建议列表（倒序，最新的在最上面） ---- */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium" style={{ color: "#364153" }}>
            历史步骤
          </span>
          <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {messages.slice().reverse().map((msg, ri) => {
              const step = messages.length - ri
              return (
                <div
                  key={msg.timestamp}
                  className="flex gap-3 rounded-md p-3"
                  style={ri === 0
                    ? { backgroundColor: "#EFF6FF", border: "0.666px solid #DBEAFE", borderRadius: 10 }
                    : { backgroundColor: "#FFFFFF", border: "0.666px solid #F3F4F6", borderRadius: 10 }
                  }
                >
                  {/* 迷你棋盘 */}
                  <div className="shrink-0">
                    <MiniBoard grid={msg.boardSnapshot} />
                  </div>
                  {/* 文字信息 */}
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs" style={{ color: "#99A1AF" }}>
                      第 {step} 步
                    </span>
                    <span className="text-sm font-medium" style={{ color: "#1E2939" }}>
                      {DIR_ARROW[msg.direction]}
                    </span>
                    <span className="text-xs" style={{ color: "#6A7282", lineHeight: "19.5px" }}>
                      {msg.reason}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
