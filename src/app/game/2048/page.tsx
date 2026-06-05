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
import GameAiPanel from "@/components/2048/game-2048-ai-panel"
import GameBoard from "@/components/2048/game-2048-board"

// ---- 组件 ----
export default function Game2048Page() {
  const [board, setBoard] = useState<TileBoard | null>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepPlaying, setKeepPlaying] = useState(false)

  // 动画状态
  const [consumedIds, setConsumedIds] = useState<Set<number>>(new Set())
  const [spawnedId, setSpawnedId] = useState<number | null>(null)

  const ref = useRef(board)
  const moveIdRef = useRef(0)
  ref.current = board

  // 客户端初始化（避免 SSR/Client 随机数不一致导致 hydration 报错）
  useEffect(() => {
    setBoard(createTileBoard())
  }, [])

  const handleMove = useCallback(
    (dir: Direction) => {
      if (gameOver) return
      const cur = ref.current
      if (!cur) return

      const result = moveTiles(cur, dir)
      if (!result.moved) return

      const thisMove = ++moveIdRef.current

      // 立即生成 new tile 数据（不等滑行结束）
      const { board: withSpawn, id: sid } = spawnTile(result.board)
      const nextScore = score + result.score
      setBoard(withSpawn)
      setScore(nextScore)
      if (result.consumedIds.size > 0) {
        setConsumedIds(result.consumedIds)
        setTimeout(() => setConsumedIds(new Set()), 150)
      }

      // new tile 的 appear 动画由 CSS animation-delay: 300ms 延迟展示
      if (sid !== -1) {
        setSpawnedId(sid)
        setTimeout(() => {
          if (moveIdRef.current !== thisMove) return
          setSpawnedId(null)
        }, 500) // 300ms 延迟 + 200ms 动画
      }

      // 立即检查胜负
      if (!won && hasTileBoardWon(withSpawn)) setWon(true)
      setTimeout(() => {
        if (!canTilesMove(withSpawn)) setGameOver(true)
      }, 0)
    },
    [score, gameOver, won],
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

  if (!board) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ color: "#101828", fontSize: 30, fontWeight: 700 }}>2048</h1>
          <div className="rounded-md px-4 py-2 text-white" style={{ backgroundColor: "#BBADA0" }}>
            得分: 0
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 style={{ color: "#101828", fontSize: 30, fontWeight: 700 }}>2048</h1>
        <div className="flex">
          <div className="flex gap-3">
            <div className="rounded-md px-4 py-2 text-white" style={{ backgroundColor: "#BBADA0" }}>
              得分: {score}
            </div>
          </div>
          <button
            onClick={restart}
            className="rounded-md ml-4 px-6 py-2 text-base font-semibold text-white"
            style={{ backgroundColor: "#FB2C36" }}
          >
            重新开始
          </button>
        </div>
      </div>

      <p className="mb-6 text-medium" style={{ color: "#6A7282" }}>
        使用方向键移动数字方块，合并相同数字，挑战 2048！
      </p>

      {/* 棋盘 + AI 面板左右并排 */}
      <div className="flex items-start gap-6">
        <GameBoard
          board={board}
          score={score}
          consumedIds={consumedIds}
          spawnedId={spawnedId}
          gameOver={gameOver}
          showWin={showWin}
          onRestart={restart}
          onContinue={cont}
        />

        {/* AI 面板 */}
        <GameAiPanel board={board} onMove={handleMove} />
      </div>

    </div>
  )
}
