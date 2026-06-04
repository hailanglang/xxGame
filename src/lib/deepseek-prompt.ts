import type { TileBoard, Direction } from "@/lib/game-2048"

// ---- 常量 ----
export const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
export const DEEPSEEK_MODEL = "deepseek-chat"
export const LOCAL_KEY = "2048_deepseek_api_key"
export const LOCAL_AUTO = "2048_ai_auto_mode"
export const BOARD_PX = 448 // 与 page.tsx 中棋盘高度一致

// ---- 类型 ----
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

// ---- 方向箭头映射 ----
export const DIR_ARROW: Record<Direction, string> = {
  up: "↑ (向上)",
  down: "↓ (向下)",
  left: "← (向左)",
  right: "→ (向右)",
}

// ---- 迷你棋盘格子颜色 ----
export const MINI_CMAP: Record<number, string> = {
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

// ---- 棋盘序列化 ----
export function serializeBoard(b: TileBoard): number[][] {
  return b.map((row) => row.map((t) => (t ? t.value : 0)))
}

// ---- System Prompt ----
export const SYSTEM_PROMPT = `你是一位精通2048游戏的AI专家。你的目标是指导用户做出最优移动，以最大化合出高分方块（2048、4096或更高）的概率。

### 核心策略
你必须严格遵守以下"稳定角落策略"：

1. **固定最大方块**：始终将当前最大的数字固定在右下角（或左下/右上，一旦选定永不更改）。任何时候都不得移动这个角落方块，也不得向远离该角落的方向移动导致其离开。

2. **单调递减排列**：从最大数字所在的角落出发，沿着行和列，数字应严格单调递减（或非递增）。例如若右下角最大，则最后一行从右向左递减，最后一列从下向上递减。避免小数字被大数字包围无法合并。

3. **空格管理**：始终保持至少1个空格（最好是2个以上）。如果盘面全满且无相邻相同数字，则视为失败。

4. **移动评估顺序**：每次决策时，按以下优先级评估四个方向（基于角落位置调整）：
   - 如果角落为右下角，优先级：右 > 下 > 左 > 上
   - 如角落为其他位置，相应调整（即优先推向角落方向，其次沿边方向）

5. **最坏情况预判**：新方块可能出现在任何空格，且可能是2或4。你应该选择移动后最坏情况下仍然保持策略可行的方向。宁可放弃一次合并，也不破坏边角结构。

6. **禁止危险合并**：如果某个移动会导致大数字从角落移开，或者破坏单调行/列，除非该移动后能立即恢复（需说明），否则禁止选择。

7. **禁止推荐无效方向**：如果某个方向没有空隙（棋盘在该方向无法移动），绝不能推荐该方向。只从用户消息中标注的"合法方向"中选择。

### 输出格式
只回复 JSON 格式，不要任何其他文字：
{"direction": "up|down|left|right", "reason": "中文理由，一句话"}`

// ---- 用户消息构建 ----
export function buildUserMessage(b: TileBoard, s: number, valid: Direction[]): string {
  const grid = serializeBoard(b)
    .map((row) => `[${row.join(",")}]`)
    .join("\n")
  const dirNames: Record<Direction, string> = { up: "上", down: "下", left: "左", right: "右" }

  return `当前棋盘（4×4，0=空格）：\n${grid}\n当前分数: ${s}\n合法方向: ${valid.map((d) => dirNames[d]).join("、")}`
}
