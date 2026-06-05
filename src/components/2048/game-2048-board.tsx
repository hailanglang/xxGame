"use client"

import type { TileBoard } from "@/lib/game-2048"
import { flat, CMAP, CELL, GAP, PAD, BOARD_PX } from "@/components/2048/utils"
import type { GameBoardProps } from "@/components/2048/types"

// ---- 组件 ----
export default function GameBoard({
  board,
  consumedIds,
  spawnedId,
  gameOver,
  showWin,
  onRestart,
  onContinue,
}: GameBoardProps) {
  const tiles = flat(board)

  return (
    <>
      <div
        className="relative shrink-0"
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

        {/* 前景 tile */}
        {tiles.map((t) => {
          const c = CMAP[t.value] ?? { bg: "#3C3A32", fg: "#F9F6F2" }
          const fs = t.value <= 64 ? "36px" : t.value <= 2048 ? "28px" : "24px"
          const isMerge = consumedIds.has(t.id)
          const isNew = t.id === spawnedId

          return (
            <div
              key={t.id}
              className="absolute"
              style={{
                width: CELL,
                height: CELL,
                left: PAD,
                top: PAD,
                transform: `translate(${(CELL + GAP) * t.col}px, ${(CELL + GAP) * t.row}px)`,
                transition: "transform 300ms ease-in-out",
              }}
            >
              <div
                className="flex items-center justify-center font-bold"
                style={{
                  width: CELL,
                  height: CELL,
                  backgroundColor: c.bg,
                  color: c.fg,
                  fontSize: fs,
                  borderRadius: 6,
                  animation: isNew
                    ? "tile-appear 200ms ease-out 300ms both"
                    : isMerge
                      ? "tile-pop 150ms ease-out both"
                      : "none",
                }}
              >
                {t.value}
              </div>
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
              onClick={onRestart}
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
              onClick={onContinue}
              className="rounded-md px-6 py-2 text-lg font-semibold text-white"
              style={{ backgroundColor: "#FB2C36" }}
            >
              继续
            </button>
          </div>
        )}
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
    </>
  )
}
