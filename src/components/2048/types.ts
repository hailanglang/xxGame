import type { TileBoard, Direction } from "@/lib/game-2048"

// ---- Board ----
export interface TilePos {
  id: number
  value: number
  row: number
  col: number
}

export interface GameBoardProps {
  board: TileBoard
  score: number
  consumedIds: Set<number>
  spawnedId: number | null
  gameOver: boolean
  showWin: boolean
  onRestart: () => void
  onContinue: () => void
}

// ---- AI Panel ----
export interface AiMessage {
  boardSnapshot: number[][]
  direction: Direction
  reason: string
  timestamp: number
}

export interface DeepSeekResponse {
  direction: Direction
  reason: string
}

export interface GameAiPanelProps {
  board: TileBoard | null
  onMove: (dir: Direction) => void
}
