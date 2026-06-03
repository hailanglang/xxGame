"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TileBoard, Direction } from "@/lib/game-2048"

// ---- 常量 ----
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
const DEEPSEEK_MODEL = "deepseek-chat"
const LOCAL_KEY = "2048_deepseek_api_key"
const LOCAL_AUTO = "2048_ai_auto_mode"
const BOARD_PX = 448 // 与 page.tsx 中棋盘高度一致

// ---- 类型 ----
interface AiMessage {
  boardSnapshot: number[][]
  direction: Direction
  reason: string
  timestamp: number
}

interface DeepSeekResponse {
  direction: Direction
  reason: string
}

interface GameAiPanelProps {
  board: TileBoard | null
  score: number
}

export default function GameAiPanel({ board, score }: GameAiPanelProps) {
  // ---- 状态 ----
  const [apiKey, setApiKey] = useState("")
  const [autoMode, setAutoMode] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---- ref ----
  const abortRef = useRef<AbortController | null>(null)
  const prevBoardRef = useRef(board)
  const initializedRef = useRef(false)
  const callIdRef = useRef(0)

  // ---- 从 localStorage 恢复 ----
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(LOCAL_KEY)
      if (savedKey) setApiKey(savedKey)
      const savedAuto = localStorage.getItem(LOCAL_AUTO)
      if (savedAuto === "true") setAutoMode(true)
    } catch { /* 静默降级 */ }
  }, [])

  // ---- 保存到 localStorage ----
  const handleApiKeyChange = useCallback((val: string) => {
    setApiKey(val)
    try { localStorage.setItem(LOCAL_KEY, val) } catch { /* 静默降级 */ }
  }, [])

  const toggleAutoMode = useCallback(() => {
    const next = !autoMode
    setAutoMode(next)
    try { localStorage.setItem(LOCAL_AUTO, String(next)) } catch { /* 静默降级 */ }
  }, [autoMode])

  // ---- 棋盘序列化 ----
  function serializeBoard(b: TileBoard): number[][] {
    return b.map((row) =>
      row.map((t) => (t ? t.value : 0))
    )
  }

  // ---- prompt 构建 ----
  function buildPrompt(b: TileBoard, s: number): string {
    const grid = serializeBoard(b)
      .map((row) => `[${row.join(",")}]`)
      .join("\n")

    return `你是一个 2048 游戏 AI 助手，请分析当前棋局并给出最佳移动方向。
只回复 JSON 格式，不要任何其他文字：
{"direction": "up|down|left|right", "reason": "中文理由，一句话"}

当前棋盘（4×4，0=空格）：
${grid}

当前分数: ${s}`
  }

  // ---- DeepSeek API 调用 ----
  async function fetchSuggestion(b: TileBoard, s: number): Promise<DeepSeekResponse> {
    const controller = new AbortController()
    abortRef.current = controller

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "user", content: buildPrompt(b, s) },
        ],
        temperature: 0.3,
        max_tokens: 128,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      if (res.status === 401) throw new Error("API Key 无效，请检查")
      if (res.status === 429) throw new Error("请求过于频繁，请稍后重试")
      throw new Error(`API 错误 (${res.status})`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error("AI 返回为空，请重试")

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("AI 返回格式异常，请重试")

    const parsed = JSON.parse(jsonMatch[0]) as DeepSeekResponse
    const validDirs: Direction[] = ["up", "down", "left", "right"]
    if (!validDirs.includes(parsed.direction)) {
      throw new Error("AI 返回了无效方向，请重试")
    }

    return parsed
  }

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
      const result = await fetchSuggestion(board, score)

      if (callIdRef.current !== thisCall) return // 被后续调用覆盖

      const msg: AiMessage = {
        boardSnapshot: snapshot,
        direction: result.direction,
        reason: result.reason,
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
  }, [board, score, apiKey, loading])

  // ---- 组件卸载时中止未完成的请求 ----
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // ---- 自动建议 ----
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      prevBoardRef.current = board
      return
    }

    if (prevBoardRef.current === board) return
    prevBoardRef.current = board

    if (autoMode && board) {
      getSuggestion()
    }
  }, [board, autoMode, getSuggestion])

  // ---- 方向箭头映射 ----
  const DIR_ARROW: Record<Direction, string> = {
    up: "↑ (向上)",
    down: "↓ (向下)",
    left: "← (向左)",
    right: "→ (向右)",
  }

  // ---- 迷你棋盘格子颜色 ----
  const MINI_CMAP: Record<number, string> = {
    2: "#EEE4DA",
    4: "#EDE0C8",
    8: "#F2B179",
    16: "#F59563",
    32: "#F67C5F",
    64: "#F65E3B",
    128: "#EDCF72",
    256: "#EDCC61",
    512: "#EDC850",
    1024: "#EDC53F",
    2048: "#EDC22E",
  }

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
              backgroundColor: v === 0 ? "#CDC1B4" : (MINI_CMAP[v] ?? "#3C3A32"),
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
      className="flex w-[300px] shrink-0 flex-col gap-4 rounded-lg border bg-white p-4"
      style={{ minHeight: BOARD_PX }}
    >
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

      {/* ---- 自动建议开关 + 手动按钮 ---- */}
      <div className="flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={toggleAutoMode}
            className="h-3.5 w-3.5"
          />
          自动建议
        </label>
        <div className="flex-1" />
        <Button
          variant="default"
          size="sm"
          onClick={getSuggestion}
          disabled={!apiKey.trim() || !board || loading}
        >
          {loading ? "分析中…" : "获取建议"}
        </Button>
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
          <span className="text-xs font-semibold" style={{ color: "#101828" }}>
            🤖 AI 建议
          </span>
          <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {messages.slice().reverse().map((msg, ri) => {
              const step = messages.length - ri
              return (
                <div
                  key={msg.timestamp}
                  className="flex gap-3 rounded-md p-3"
                  style={ri === 0
                    ? { backgroundColor: "#F0F7FF", border: "1px solid #BFDBFE" }
                    : { backgroundColor: "#F9FAFB" }
                  }
                >
                  {/* 迷你棋盘 */}
                  <div className="shrink-0">
                    <MiniBoard grid={msg.boardSnapshot} />
                  </div>
                  {/* 文字信息 */}
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[11px] font-medium" style={{ color: "#6A7282" }}>
                      第 {step} 步
                    </span>
                    <span className="text-sm font-bold" style={{ color: "#101828" }}>
                      {DIR_ARROW[msg.direction]}
                    </span>
                    <span className="text-[11px]" style={{ color: "#6A7282" }}>
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
