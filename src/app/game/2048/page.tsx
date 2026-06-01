"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  createTileBoard,
  moveTiles,
  spawnTile,
  canTilesMove,
  hasTileBoardWon,
  resetTileIds,
} from "@/lib/game-2048"
import type { TileBoard, Direction } from "@/lib/game-2048"

// ---- 常量 ----
const BEST_KEY = "game-2048-best"
const CELL = 100
const GAP = 8
const PAD = 12
const BOARD_PX = CELL * 4 + GAP * 3 + PAD * 2 // 448px

function getBest(): number {
  try {
    const v = localStorage.getItem(BEST_KEY)
    return v ? Number(v) || 0 : 0
  } catch {
    return 0
  }
}
function saveBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v))
  } catch {
    /* noop */
  }
}

// ---- tile 位置扁平列表 ----
interface TilePos {
  id: number
  value: number
  row: number
  col: number
}
function flat(board: TileBoard): TilePos[] {
  const out: TilePos[] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const t = board[r][c]
      if (t) out.push({ id: t.id, value: t.value, row: r, col: c })
    }
  return out
}

// ---- tile 颜色 ----
const CMAP: Record<number, { bg: string; fg: string }> = {
  2: { bg: "#EEE4DA", fg: "#776E65" },
  4: { bg: "#EDE0C8", fg: "#776E65" },
  8: { bg: "#F2B179", fg: "#F9F6F2" },
  16: { bg: "#F59563", fg: "#F9F6F2" },
  32: { bg: "#F67C5F", fg: "#F9F6F2" },
  64: { bg: "#F65E3B", fg: "#F9F6F2" },
  128: { bg: "#EDCF72", fg: "#F9F6F2" },
  256: { bg: "#EDCC61", fg: "#F9F6F2" },
  512: { bg: "#EDC850", fg: "#F9F6F2" },
  1024: { bg: "#EDC53F", fg: "#F9F6F2" },
  2048: { bg: "#EDC22E", fg: "#F9F6F2" },
}

// ---- 组件 ----
export default function Game2048Page() {
  const [board, setBoard] = useState<TileBoard>(createTileBoard)
  const [score, setScore] = useState(0)
  const [best, setBestScore] = useState(getBest)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepPlaying, setKeepPlaying] = useState(false)

  // 动画状态
  const [consumedIds, setConsumedIds] = useState<Set<number>>(new Set())
  const [spawnedId, setSpawnedId] = useState<number | null>(null)

  const ref = useRef(board)
  ref.current = board

  useEffect(() => {
    setBestScore(getBest())
  }, [])

  const handleMove = useCallback(
    (dir: Direction) => {
      if (gameOver) return
      const cur = ref.current
      if (!cur) return

      const result = moveTiles(cur, dir)
      if (!result.moved) return

      // spawn 新 tile
      const { board: withSpawn, id: sid } = spawnTile(result.board)

      // 合并动画标记
      if (result.consumedIds.size > 0) {
        setConsumedIds(result.consumedIds)
        setTimeout(() => setConsumedIds(new Set()), 150)
      }

      // 新 tile appear 动画
      if (sid !== -1) {
        setSpawnedId(sid)
        setTimeout(() => setSpawnedId(null), 200)
      }

      const nextScore = score + result.score
      setBoard(withSpawn)
      setScore(nextScore)
      if (nextScore > best) {
        setBestScore(nextScore)
        saveBest(nextScore)
      }

      if (!won && hasTileBoardWon(withSpawn)) setWon(true)

      setTimeout(() => {
        if (!canTilesMove(withSpawn)) setGameOver(true)
      }, 0)
    },
    [score, best, gameOver, won],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      }
      const d = map[e.key]
      if (d) {
        e.preventDefault()
        handleMove(d)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleMove])

  const restart = () => {
    resetTileIds()
    setBoard(createTileBoard())
    setScore(0)
    setGameOver(false)
    setWon(false)
    setKeepPlaying(false)
    setConsumedIds(new Set())
    setSpawnedId(null)
  }

  const cont = () => setKeepPlaying(true)
  const showWin = won && !keepPlaying

  const tiles = flat(board)

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 style={{ color: "#101828", fontSize: 30, fontWeight: 700 }}>2048</h1>
        <div className="flex gap-3">
          <div className="rounded-md px-4 py-2 text-white" style={{ backgroundColor: "#BBADA0" }}>
            得分: {score}
          </div>
          <div className="rounded-md px-4 py-2 text-white" style={{ backgroundColor: "#BBADA0" }}>
            最高: {best}
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm" style={{ color: "#6A7282" }}>
        使用方向键移动数字方块，合并相同数字，挑战 2048！
      </p>

      {/* 棋盘 */}
      <div
        className="relative"
        style={{ width: BOARD_PX, height: BOARD_PX, backgroundColor: "#BBADA0", borderRadius: 8 }}
      >
        {/* 空槽背景 */}
        <div
          className="absolute"
          style={{
            inset: PAD,
            display: "grid",
            gap: GAP,
            gridTemplateColumns: `repeat(4, ${CELL}px)`,
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{ width: CELL, height: CELL, backgroundColor: "#CDC1B4", borderRadius: 6 }}
            />
          ))}
        </div>

        {/* 前景 tile（绝对定位 + CSS transition 滑行） */}
        {tiles.map((t) => {
          const c = CMAP[t.value] ?? { bg: "#3C3A32", fg: "#F9F6F2" }
          const fs = t.value <= 64 ? "36px" : t.value <= 2048 ? "28px" : "24px"
          const isMerge = consumedIds.has(t.id)
          const isNew = t.id === spawnedId

          return (
            <div
              key={t.id}
              className="flex items-center justify-center font-bold"
              style={{
                position: "absolute",
                width: CELL,
                height: CELL,
                left: PAD,
                top: PAD,
                transform: `translate(${(CELL + GAP) * t.col}px, ${(CELL + GAP) * t.row}px)`,
                transition: "transform 100ms ease-in-out",
                backgroundColor: c.bg,
                color: c.fg,
                fontSize: fs,
                borderRadius: 6,
                zIndex: isNew ? 2 : 1,
                animation: isNew
                  ? "tile-appear 200ms ease-out both"
                  : isMerge
                    ? "tile-pop 150ms ease-out both"
                    : "none",
              }}
            >
              {t.value}
            </div>
          )
        })}

        {/* Game Over */}
        {gameOver && !showWin && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50"
            style={{ borderRadius: 8 }}
          >
            <p className="mb-4 text-3xl font-bold text-white">游戏结束</p>
            <button
              onClick={restart}
              className="rounded-md px-6 py-2 text-lg font-semibold text-white"
              style={{ backgroundColor: "#FB2C36" }}
            >
              再来一局
            </button>
          </div>
        )}

        {/* Win */}
        {showWin && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30"
            style={{ borderRadius: 8 }}
          >
            <p className="mb-4 text-3xl font-bold text-white">你赢了！</p>
            <button
              onClick={cont}
              className="rounded-md px-6 py-2 text-lg font-semibold text-white"
              style={{ backgroundColor: "#FB2C36" }}
            >
              继续
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={restart}
          className="rounded-md px-6 py-2 text-base font-semibold text-white"
          style={{ backgroundColor: "#FB2C36" }}
        >
          重新开始
        </button>
      </div>

      {/* 动画 keyframes */}
      <style>{`
        @keyframes tile-appear {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes tile-pop {
          0%   { transform: scale(0.8); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
