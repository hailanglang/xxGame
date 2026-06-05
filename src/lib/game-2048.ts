// src/lib/game-2048.ts — 2048 游戏纯函数逻辑

export type Board = number[][] // 4×4
export type Direction = "up" | "down" | "left" | "right"

export interface MoveResult {
  board: Board
  score: number
  moved: boolean
}

// ---- 带 ID 追踪的 TileBoard（用于动画） ----

export interface TileData {
  id: number
  value: number
}

export type TileBoard = (TileData | null)[][]

let _nextId = 1

/** 重置 ID 计数器（创建新游戏时调用） */
export function resetTileIds() {
  _nextId = 1
}

/** 生成下一个 tile ID */
export function nextTileId(): number {
  return _nextId++
}

// ---- 原始 Board 函数（保持向后兼容） ----

const SIZE = 4

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

export function addRandomTile(board: Board): Board {
  const empty: [number, number][] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c])
    }
  }
  if (empty.length === 0) return board
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const next = structuredClone(board)
  next[r][c] = Math.random() < 0.9 ? 2 : 4
  return next
}

export function createBoard(): Board {
  let board = emptyBoard()
  board = addRandomTile(board)
  board = addRandomTile(board)
  return board
}

function mergeRow(row: number[]): { merged: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0)
  const merged: number[] = []
  let score = 0
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2
      merged.push(val)
      score += val
      i += 2
    } else {
      merged.push(filtered[i])
      i += 1
    }
  }
  while (merged.length < SIZE) merged.push(0)
  return { merged, score }
}

function rotate(board: Board): Board {
  const rotated = emptyBoard()
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      rotated[SIZE - 1 - c][r] = board[r][c]
    }
  }
  return rotated
}

export function move(board: Board, direction: Direction): MoveResult {
  let rotated = board
  const rotations: Record<Direction, number> = {
    left: 0,
    up: 1,
    right: 2,
    down: 3,
  }

  for (let i = 0; i < rotations[direction]; i++) {
    rotated = rotate(rotated)
  }

  let totalScore = 0
  let moved = false
  const merged = emptyBoard()
  for (let r = 0; r < SIZE; r++) {
    const { merged: row, score } = mergeRow(rotated[r])
    merged[r] = row
    totalScore += score
    if (row.some((v, c) => v !== rotated[r][c])) moved = true
  }

  let result = merged
  const reverseRotations = (4 - rotations[direction]) % 4
  for (let i = 0; i < reverseRotations; i++) {
    result = rotate(result)
  }

  return { board: result, score: totalScore, moved }
}

export function canMove(board: Board): boolean {
  const directions: Direction[] = ["up", "down", "left", "right"]
  return directions.some((d) => move(board, d).moved)
}

export function hasWon(board: Board): boolean {
  return board.some((row) => row.some((v) => v >= 2048))
}

// ---- TileBoard 函数（带 ID 追踪，支持动画） ----

function emptyTileBoard(): TileBoard {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
}

/** 生成一个随机 spawn 的 tile 值（2: 90%, 4: 10%） */
export function randomTileValue(): number {
  return Math.random() < 0.9 ? 2 : 4
}

/** 在 TileBoard 空位 spawn 一个新 tile，返回新 board 和 tile ID */
export function spawnTile(board: TileBoard): { board: TileBoard; id: number } {
  const empty: [number, number][] = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === null) empty.push([r, c])
  if (empty.length === 0) return { board, id: -1 }
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const id = _nextId++
  const next = structuredClone(board) as TileBoard
  next[r][c] = { id, value: randomTileValue() }
  return { board: next, id }
}

/** 随机在空位生成一个带 ID 的新 tile（内部用） */
function addRandomTileWithId(board: TileBoard): TileBoard {
  const empty: [number, number][] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === null) empty.push([r, c])
    }
  }
  if (empty.length === 0) return board
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const next = structuredClone(board) as TileBoard
  next[r][c] = { id: _nextId++, value: Math.random() < 0.9 ? 2 : 4 }
  return next
}

/** 创建初始 TileBoard */
export function createTileBoard(): TileBoard {
  _nextId = 1
  let board = emptyTileBoard()
  board = addRandomTileWithId(board)
  board = addRandomTileWithId(board)
  return board
}

/** 带 ID 的行合并。返回合并后行 + 得分 + 由合并创建的新 tile 列表 */
function mergeTileRow(
  row: (TileData | null)[],
): { merged: (TileData | null)[]; score: number; mergedIds: Set<number> } {
  const tiles = row.filter((t): t is TileData => t !== null)
  const merged: (TileData | null)[] = []
  let score = 0
  const mergedIds = new Set<number>()
  let i = 0
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      const val = tiles[i].value * 2
      const newId = _nextId++
      merged.push({ id: newId, value: val })
      mergedIds.add(tiles[i].id)
      mergedIds.add(tiles[i + 1].id)
      score += val
      i += 2
    } else {
      merged.push(tiles[i])
      i += 1
    }
  }
  while (merged.length < SIZE) merged.push(null)
  return { merged, score, mergedIds }
}

/** 逆时针旋转 TileBoard */
function rotateTileBoard(board: TileBoard): TileBoard {
  const rotated = emptyTileBoard()
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      rotated[SIZE - 1 - c][r] = board[r][c]
    }
  }
  return rotated
}

export interface TileMoveResult {
  board: TileBoard
  score: number
  moved: boolean
  /** 被合并吃掉的 tile ID 集合 */
  consumedIds: Set<number>
}

/** 执行一次带 ID 追踪的移动 */
export function moveTiles(board: TileBoard, direction: Direction): TileMoveResult {
  const rotations: Record<Direction, number> = {
    left: 0,
    up: 1,
    right: 2,
    down: 3,
  }

  let rotated = board
  for (let i = 0; i < rotations[direction]; i++) {
    rotated = rotateTileBoard(rotated)
  }

  let totalScore = 0
  let moved = false
  const merged = emptyTileBoard()
  const allConsumed = new Set<number>()

  for (let r = 0; r < SIZE; r++) {
    const { merged: row, score, mergedIds } = mergeTileRow(rotated[r])
    merged[r] = row
    totalScore += score
    if (row.some((t, c) => t?.id !== rotated[r][c]?.id)) moved = true
    mergedIds.forEach((id) => allConsumed.add(id))
  }

  let result = merged
  const reverseRotations = (4 - rotations[direction]) % 4
  for (let i = 0; i < reverseRotations; i++) {
    result = rotateTileBoard(result)
  }

  return { board: result, score: totalScore, moved, consumedIds: allConsumed }
}

/** 检查 TileBoard 是否有合法移动 */
export function canTilesMove(board: TileBoard): boolean {
  const dirs: Direction[] = ["up", "down", "left", "right"]
  return dirs.some((d) => moveTiles(board, d).moved)
}

/** 检查 TileBoard 是否达到 2048 */
export function hasTileBoardWon(board: TileBoard): boolean {
  return board.some((row) => row.some((t) => t !== null && t.value >= 2048))
}
