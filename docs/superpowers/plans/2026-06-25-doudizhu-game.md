# 斗地主游戏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 XXGame 内新增单人斗地主游戏（Phaser 3 渲染 + DeepSeek AI 对手）。

**Architecture:** Phaser 3 嵌入 Next.js 路由 `/game/doudizhu`。游戏逻辑引擎（纯 TS）零 Phaser 依赖。AI 通过 `dsApi()` 调用 DeepSeek API，返回 JSON 决策，经 rules 引擎二次校验后执行。React ↔ Phaser 通过自定义事件通信。

**Tech Stack:** Phaser 3 + React 19 + Next.js 16 + TypeScript 5 + TailwindCSS v4 + Zustand (persist)

## Global Constraints

- `@/` 路径别名映射到 `./src/*`
- Phaser 使用 `next/dynamic` + `ssr: false` 加载，不进 SSR
- 所有 path 使用 `import { X } from "@/..."` 格式
- 游戏逻辑引擎（`logic/`）零框架依赖，纯函数可测
- AI 调用复用 `src/lib/api-client.ts` 的 `dsApi()`
- 使用 `src/stores/game-store.ts` 的 persist 存储 API Key
- commit 信息格式：`feat: xxx`

---

## File Structure

```
src/
├── app/game/doudizhu/
│   ├── layout.tsx                    # Metadata (SEO)
│   └── page.tsx                      # dynamic import GameCanvas
│
├── game/
│   ├── GameCanvas.tsx                # Phaser 挂载/卸载壳子
│   ├── useGameBridge.ts              # React ↔ Phaser 通信桥
│   │
│   └── doudizhu/
│       ├── config.ts                 # Phaser.Types.Core.GameConfig
│       ├── logic/
│       │   ├── types.ts              # Card, Combo, ComboType, GameState
│       │   ├── deck.ts               # 洗牌、发牌
│       │   ├── rules.ts              # 牌型识别
│       │   ├── compare.ts            # 大小比较
│       │   └── ai-schema.ts          # System prompt + 序列化 + 校验
│       ├── scenes/
│       │   ├── BootScene.ts          # 预加载
│       │   ├── MenuScene.ts          # 主菜单 (含 AI 设置面板)
│       │   ├── DealingScene.ts       # 发牌动画 + 叫地主
│       │   ├── PlayScene.ts          # 核心游戏
│       │   └── ResultScene.ts        # 结算
│       └── ui/
│           ├── Card.ts               # Phaser Container（一张牌）
│           ├── HandFan.ts            # 扇形手牌 + 选牌
│           ├── PlayerAvatar.ts       # 玩家信息
│           ├── Countdown.ts          # 倒计时条
│           └── ParticleEffects.ts    # 特效

Modified files:
├── src/stores/game-store.ts          # + doudizhuApiKey, + doudizhuTokenUsage
├── src/components/token-usage-panel.tsx  # 从 2048/ 提取到共享位置
├── src/components/2048/game-2048-ai-panel.tsx  # 更新 import 路径
├── package.json                      # + phaser dependency
```

---

### Task 1: 游戏数据类型 (types.ts + deck.ts)

**Files:**
- Create: `src/game/doudizhu/logic/types.ts`
- Create: `src/game/doudizhu/logic/deck.ts`
- Test: 无需单独测试，被后续任务覆盖

**Interfaces:**
- Produces: `Card`, `Suit`, `Rank`, `ComboType`, `Combo`, `PlayerPosition`, `GamePhase`, `GameState` types; `createDeck()`, `shuffleDeck()`, `dealCards()` functions

- [ ] **Step 1: Create types.ts**

```ts
/** 花色 */
export enum Suit {
  Hearts = "h",
  Diamonds = "d",
  Clubs = "c",
  Spades = "s",
}

/** 点数: 3=3 … 14=A, 15=2, 16=小王, 17=大王 */
export type Rank = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17

export interface Card {
  id: number          // 0-53 全局唯一标识
  suit: Suit | null   // null = 王
  rank: Rank
}

export const RANK_NAMES: Record<Rank, string> = {
  3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "10", 11: "J", 12: "Q", 13: "K", 14: "A", 15: "2",
  16: "小王", 17: "大王",
}

/** 牌型枚举 */
export enum ComboType {
  Single = "single",
  Pair = "pair",
  Triple = "triple",
  TriplePlus1 = "triple_plus_1",
  TriplePlus2 = "triple_plus_2",
  Straight = "straight",
  PairStraight = "pair_straight",
  Plane = "plane",
  PlanePlusWings = "plane_plus_wings",
  FourPlus2 = "four_plus_2",
  Bomb = "bomb",
  Rocket = "rocket",
}

/** 识别后的牌型结果 */
export interface Combo {
  type: ComboType
  mainRank: Rank     // 用来比较大小的主牌点数
  length: number     // 组成牌型的张数
  cards: Card[]      // 实际出牌
}

/** 玩家位置 */
export type PlayerPosition = 0 | 1 | 2  // 0=玩家(我)，1=下家(AI)，2=上家(AI)

/** 游戏阶段 */
export type GamePhase =
  | "idle"
  | "dealing"
  | "calling_landlord"
  | "playing"
  | "finished"

/** 完整游戏状态 */
export interface GameState {
  phase: GamePhase
  deck: Card[]                       // 完整 54 张牌
  hands: [Card[], Card[], Card[]]    // [我的, 下家AI, 上家AI]
  dizhuCards: Card[]                 // 3 张底牌
  landlord: PlayerPosition | null    // 地主位置
  currentPlayer: PlayerPosition      // 当前轮到谁
  lastPlay: {                        // 上一手牌
    player: PlayerPosition
    combo: Combo
  } | null
  passCount: number                  // 连续 pass 次数 (passCount>=2 时新轮次)
  scores: [number, number, number]   // 三家得分
  winner: PlayerPosition | null      // 赢家
}
```

- [ ] **Step 2: Create deck.ts**

```ts
import { Card, Suit, Rank, GameState, PlayerPosition } from "./types"

const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades]
const RANKS: Rank[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
const JOKER_RANKS: Rank[] = [16, 17]

/** 创建一副有序的 54 张牌 (Fisher-Yates 洗牌前) */
export function createDeck(): Card[] {
  const cards: Card[] = []
  let id = 0
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: id++, suit, rank })
    }
  }
  // 小王、大王
  cards.push({ id: id++, suit: null, rank: 16 })
  cards.push({ id: id++, suit: null, rank: 17 })
  return cards
}

/** Fisher-Yates 洗牌 */
export function shuffleDeck(cards: Card[]): Card[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 发牌: 3 家各 17 张 + 3 张底牌 */
export function dealCards(shuffled: Card[]): {
  hands: [Card[], Card[], Card[]]
  dizhuCards: Card[]
} {
  return {
    hands: [
      shuffled.slice(0, 17),
      shuffled.slice(17, 34),
      shuffled.slice(34, 51),
    ] as [Card[], Card[], Card[]],
    dizhuCards: shuffled.slice(51, 54),
  }
}

/** 将底牌交给地主 */
export function assignLandlord(
  state: GameState,
  landlordPos: PlayerPosition
): GameState {
  const newHands: [Card[], Card[], Card[]] = [...state.hands]
  newHands[landlordPos] = [...newHands[landlordPos], ...state.dizhuCards]
  return { ...state, landlord: landlordPos, hands: newHands }
}

/** 初始化游戏 */
export function initGame(): GameState {
  const deck = shuffleDeck(createDeck())
  const { hands, dizhuCards } = dealCards(deck)
  return {
    phase: "dealing",
    deck,
    hands,
    dizhuCards,
    landlord: null,
    currentPlayer: 0,
    lastPlay: null,
    passCount: 0,
    scores: [0, 0, 0],
    winner: null,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/doudizhu/logic/types.ts src/game/doudizhu/logic/deck.ts
git commit -m "feat: 添加斗地主数据类型和发牌逻辑"
```

---

### Task 2: 牌型识别引擎 (rules.ts)

**Files:**
- Create: `src/game/doudizhu/logic/rules.ts`
- Create: `src/game/doudizhu/logic/rules.test.ts` (Vitest)

**Interfaces:**
- Consumes: `Card`, `Combo`, `ComboType`, `Rank` from `types.ts`
- Produces: `recognizeCombo(cards: Card[]): Combo | null`

**核心逻辑:** `recognizeCombo` 按以下顺序识别（优先级从高到低）：
1. Rocket（王炸：小王+大王）
2. Bomb（炸弹：4 张同点数）
3. FourPlus2（四带二）
4. PlanePlusWings（飞机带翅膀）
5. Plane（飞机：≥2 个连续三条，无带牌）
6. PairStraight（连对：≥3 个连续对子）
7. Straight（顺子：≥5 张连续单牌）
8. TriplePlus2（三带二）
9. TriplePlus1（三带一）
10. Triple（三条）
11. Pair（对子）
12. Single（单张）

- [ ] **Step 1: Install Vitest (如果尚未安装)**

```bash
pnpm add -D vitest
```

在 `package.json` 添加:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/game/doudizhu/logic/rules.test.ts
import { describe, it, expect } from "vitest"
import { recognizeCombo } from "./rules"
import { ComboType, type Card, type Rank, type Combo } from "./types"

function card(rank: Rank, offset = 0): Card {
  // suit 不影响识别，只用 rank
  const suitMap = ["h", "d", "c", "s"] as const
  return { id: offset, suit: suitMap[offset % 4] as any, rank }
}

describe("recognizeCombo", () => {
  it("识别单张", () => {
    const result = recognizeCombo([card(3)])
    expect(result?.type).toBe(ComboType.Single)
    expect(result?.mainRank).toBe(3)
  })

  it("识别对子", () => {
    const result = recognizeCombo([card(5), card(5, 1)])
    expect(result?.type).toBe(ComboType.Pair)
    expect(result?.mainRank).toBe(5)
  })

  it("识别三条", () => {
    const result = recognizeCombo([card(7), card(7, 1), card(7, 2)])
    expect(result?.type).toBe(ComboType.Triple)
    expect(result?.mainRank).toBe(7)
  })

  it("识别三带一", () => {
    const result = recognizeCombo([card(8), card(8, 1), card(8, 2), card(5)])
    expect(result?.type).toBe(ComboType.TriplePlus1)
    expect(result?.mainRank).toBe(8)
  })

  it("识别三带二", () => {
    const result = recognizeCombo([
      card(9), card(9, 1), card(9, 2),
      card(4), card(4, 3),
    ])
    expect(result?.type).toBe(ComboType.TriplePlus2)
    expect(result?.mainRank).toBe(9)
  })

  it("识别顺子 (5 张)", () => {
    const result = recognizeCombo([
      card(3), card(4), card(5), card(6), card(7),
    ])
    expect(result?.type).toBe(ComboType.Straight)
    expect(result?.mainRank).toBe(7) // 最大牌
  })

  it("顺子不能包含 2", () => {
    // 15=2, 不允许顺子
    const result = recognizeCombo([card(3), card(4), card(5), card(6), card(15)])
    expect(result).toBeNull()
  })

  it("识别连对 (3 对)", () => {
    const result = recognizeCombo([
      card(5), card(5, 1),
      card(6), card(6, 2),
      card(7), card(7, 3),
    ])
    expect(result?.type).toBe(ComboType.PairStraight)
    expect(result?.mainRank).toBe(7)
  })

  it("识别飞机 (2 个三条)", () => {
    const result = recognizeCombo([
      card(6), card(6, 1), card(6, 2),
      card(7), card(7, 3), card(7, 4),
    ])
    expect(result?.type).toBe(ComboType.Plane)
    expect(result?.mainRank).toBe(7)
  })

  it("识别炸弹", () => {
    const result = recognizeCombo([
      card(10), card(10, 1), card(10, 2), card(10, 3),
    ])
    expect(result?.type).toBe(ComboType.Bomb)
    expect(result?.mainRank).toBe(10)
  })

  it("识别王炸", () => {
    const result = recognizeCombo([
      { id: 52, suit: null, rank: 16 },
      { id: 53, suit: null, rank: 17 },
    ])
    expect(result?.type).toBe(ComboType.Rocket)
  })

  it("无效牌型返回 null (不构成任何牌型)", () => {
    const result = recognizeCombo([card(3), card(5)])
    expect(result).toBeNull()
  })

  it("空数组返回 null", () => {
    expect(recognizeCombo([])).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm vitest run src/game/doudizhu/logic/rules.test.ts
```
Expected: Tests fail because `recognizeCombo` is not defined yet.

- [ ] **Step 4: Implement minimal code**

```ts
// src/game/doudizhu/logic/rules.ts
import { Card, Combo, ComboType, Rank } from "./types"

/** 按点数分组，返回 [点数, 牌数量][] 按点数降序排列 */
function groupByRank(cards: Card[]): [Rank, Card[]][] {
  const map = new Map<Rank, Card[]>()
  for (const c of cards) {
    const arr = map.get(c.rank) ?? []
    arr.push(c)
    map.set(c.rank, arr)
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0])
}

/** 检查数组是否连续（2 不能被包含在顺子/连对/飞机中） */
function isConsecutive(ranks: Rank[], allowJoker = false): boolean {
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] - 1) return false
  }
  if (!allowJoker) {
    for (const r of ranks) {
      if (r === 15 || r === 16 || r === 17) return false
    }
  }
  return true
}

function makeCombo(type: ComboType, mainRank: Rank, cards: Card[]): Combo {
  return { type, mainRank, length: cards.length, cards }
}

export function recognizeCombo(cards: Card[]): Combo | null {
  const n = cards.length
  if (n === 0) return null

  // ---- 王炸 ----
  if (n === 2 && cards.some((c) => c.rank === 16) && cards.some((c) => c.rank === 17)) {
    return makeCombo(ComboType.Rocket, 17, cards)
  }

  const groups = groupByRank(cards)

  // ---- 炸弹 ----
  if (n === 4 && groups.length === 1) {
    return makeCombo(ComboType.Bomb, groups[0][0], cards)
  }

  if (n === 1) return makeCombo(ComboType.Single, cards[0].rank, cards)
  if (n === 2 && groups.length === 1) return makeCombo(ComboType.Pair, groups[0][0], cards)
  if (n === 3 && groups.length === 1) return makeCombo(ComboType.Triple, groups[0][0], cards)

  // ---- 三带一 ----
  if (n === 4 && groups.length === 2) {
    const triple = groups.find(([, cs]) => cs.length === 3)
    if (triple) return makeCombo(ComboType.TriplePlus1, triple[0], cards)
  }

  // ---- 三带二 ----
  if (n === 5 && groups.length === 2) {
    const triple = groups.find(([, cs]) => cs.length === 3)
    const pair = groups.find(([, cs]) => cs.length === 2)
    if (triple && pair) return makeCombo(ComboType.TriplePlus2, triple[0], cards)
  }

  // ---- 顺子 (5 张起，不含 2/王) ----
  if (n >= 5 && groups.length === n) {
    const ranks = cards.map((c) => c.rank).sort((a, b) => b - a)
    if (isConsecutive(ranks)) {
      return makeCombo(ComboType.Straight, ranks[0], cards)
    }
  }

  // ---- 连对 (≥3 对) ----
  if (n >= 6 && n % 2 === 0 && groups.every(([, cs]) => cs.length === 2)) {
    const ranks = groups.map(([r]) => r).sort((a, b) => b - a)
    if (isConsecutive(ranks)) {
      return makeCombo(ComboType.PairStraight, ranks[0], cards)
    }
  }

  // ---- 飞机 (≥2 个三条) ----
  const triples = groups.filter(([, cs]) => cs.length >= 3).map(([r]) => r).sort((a, b) => b - a)
  if (triples.length >= 2 && isConsecutive(triples)) {
    const nTriple = triples.length
    const usedCards = nTriple * 3
    const remaining = n - usedCards

    if (remaining === 0) {
      return makeCombo(ComboType.Plane, triples[0], cards)
    }

    // 飞机带翅膀 (单牌或对子)
    if (remaining === nTriple) {
      // 飞机带单：剩余张数 = 连续三条个数
      return makeCombo(ComboType.PlanePlusWings, triples[0], cards)
    }
    if (remaining === nTriple * 2) {
      // 飞机带对：剩余张数 = 连续三条个数 * 2
      const isPairs = groups.filter(([, cs]) => cs.length < 3).every(([, cs]) => cs.length === 2)
      if (isPairs) {
        return makeCombo(ComboType.PlanePlusWings, triples[0], cards)
      }
    }
  }

  // ---- 四带二 ----
  if (n === 6) {
    const four = groups.find(([, cs]) => cs.length === 4)
    if (four && groups.length === 3) {
      return makeCombo(ComboType.FourPlus2, four[0], cards)
    }
  }
  if (n === 8) {
    const four = groups.find(([, cs]) => cs.length === 4)
    if (four && groups.length === 3 && groups.filter(([, cs]) => cs.length === 2).length === 2) {
      return makeCombo(ComboType.FourPlus2, four[0], cards)
    }
  }

  return null
}
```

- [ ] **Step 5: Run tests to verify they all pass**

```bash
pnpm vitest run src/game/doudizhu/logic/rules.test.ts
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/game/doudizhu/logic/rules.ts src/game/doudizhu/logic/rules.test.ts
git commit -m "feat: 实现牌型识别引擎 rules.ts"
```

---

### Task 3: 牌型大小比较 (compare.ts)

**Files:**
- Create: `src/game/doudizhu/logic/compare.ts`
- Create: `src/game/doudizhu/logic/compare.test.ts`

**Interfaces:**
- Consumes: `Combo`, `ComboType` from `types.ts`
- Produces: `canBeat(hand: Combo, lastPlay: Combo): boolean`

**规则:**
- 王炸 > 炸弹 > 普通牌型
- 普通牌型必须 type 完全相同、张数相同、mainRank 更大
- 炸弹之间按 mainRank 比较

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/doudizhu/logic/compare.test.ts
import { describe, it, expect } from "vitest"
import { canBeat } from "./compare"
import { ComboType, type Combo, type Rank } from "./types"

function combo(type: ComboType, mainRank: Rank, length: number): Combo {
  return { type, mainRank, length, cards: [] }
}

describe("canBeat", () => {
  it("王炸能打过炸弹", () => {
    expect(canBeat(combo(ComboType.Rocket, 17, 2), combo(ComboType.Bomb, 10, 4))).toBe(true)
  })

  it("王炸能打过王炸 (不存在, 但逻辑上平手返回 false)", () => {
    expect(canBeat(combo(ComboType.Rocket, 17, 2), combo(ComboType.Rocket, 17, 2))).toBe(false)
  })

  it("炸弹能打过普通牌型", () => {
    expect(canBeat(combo(ComboType.Bomb, 8, 4), combo(ComboType.Single, 14, 1))).toBe(true)
  })

  it("炸弹能打过更大的普通牌型", () => {
    expect(canBeat(combo(ComboType.Bomb, 5, 4), combo(ComboType.TriplePlus2, 14, 5))).toBe(true)
  })

  it("大炸弹能打过小炸弹", () => {
    expect(canBeat(combo(ComboType.Bomb, 11, 4), combo(ComboType.Bomb, 5, 4))).toBe(true)
  })

  it("小炸弹打不过大炸弹", () => {
    expect(canBeat(combo(ComboType.Bomb, 5, 4), combo(ComboType.Bomb, 11, 4))).toBe(false)
  })

  it("普通牌型相同 type 相同长度就能打过", () => {
    expect(canBeat(combo(ComboType.Single, 14, 1), combo(ComboType.Single, 3, 1))).toBe(true)
  })

  it("普通牌型相同 type 但 mainRank 更小就打不过", () => {
    expect(canBeat(combo(ComboType.Pair, 5, 2), combo(ComboType.Pair, 10, 2))).toBe(false)
  })

  it("不同牌型不能互打 (非炸弹)", () => {
    expect(canBeat(combo(ComboType.Single, 14, 1), combo(ComboType.Pair, 3, 2))).toBe(false)
  })

  it("相同类型但长度不同不能互打", () => {
    expect(canBeat(combo(ComboType.Straight, 7, 5), combo(ComboType.Straight, 8, 6))).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/game/doudizhu/logic/compare.test.ts
```

- [ ] **Step 3: Implement compare.ts**

```ts
// src/game/doudizhu/logic/compare.ts
import { Combo, ComboType } from "./types"

export function canBeat(hand: Combo, lastPlay: Combo): boolean {
  // 王炸最大
  if (hand.type === ComboType.Rocket) return true
  if (lastPlay.type === ComboType.Rocket) return false

  // 炸弹
  if (hand.type === ComboType.Bomb && lastPlay.type === ComboType.Bomb) {
    return hand.mainRank > lastPlay.mainRank
  }
  if (hand.type === ComboType.Bomb) return true // 炸弹打任何非王炸
  if (lastPlay.type === ComboType.Bomb) return false

  // 普通牌型：必须同 type、同长度、mainRank 更大
  if (hand.type !== lastPlay.type) return false
  if (hand.length !== lastPlay.length) return false
  return hand.mainRank > lastPlay.mainRank
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
pnpm vitest run src/game/doudizhu/logic/compare.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/doudizhu/logic/compare.ts src/game/doudizhu/logic/compare.test.ts
git commit -m "feat: 实现牌型大小比较 compare.ts"
```

---

### Task 4: AI Schema (ai-schema.ts)

**Files:**
- Create: `src/game/doudizhu/logic/ai-schema.ts`

**Interfaces:**
- Consumes: `GameState`, `Card`, `Combo`, `ComboType`, `Rank`, `RANK_NAMES` from `types.ts`; `recognizeCombo` from `rules.ts`; `canBeat` from `compare.ts`
- Produces: `SYSTEM_PROMPT`, `buildUserMessage(state, lastCombo): string`, `parseAiResponse(raw: string): AiDecision | null`, `validateAiPlay(hand, action, cardIds, lastCombo): Combo | null`

- [ ] **Step 1: Write ai-schema.ts**

```ts
// src/game/doudizhu/logic/ai-schema.ts
import { GameState, Card, Combo, ComboType, RANK_NAMES } from "./types"
import { recognizeCombo } from "./rules"
import { canBeat } from "./compare"

export interface AiDecision {
  action: "play" | "pass"
  cards: number[]   // card IDs
  reason: string
}

export const SYSTEM_PROMPT = `你是一位精通斗地主游戏的AI。

### 游戏状态说明
一副牌54张（含大小王），3人游戏。地主手牌20张，农民各17张。
出牌轮流进行，上家出牌后你必须以相同牌型出更大的牌，或出炸弹/王炸。
不能或不想出时出"pass"。

### 牌型规则
- 单张  |  对子  |  三条  |  三带一  |  三带二
- 顺子：5张或以上连续单牌（3-A，不包含2和大小王）
- 连对：3对或以上连续对子（不包含2和大小王）
- 飞机：2个或以上连续三条
- 飞机带翅膀：飞机+相同数量的单牌或对子
- 炸弹：4张相同点数
- 王炸：大王+小王

点数大小顺序：3<4<5<6<7<8<9<10<J<Q<K<A<2<小王<大王
炸弹 > 任何非炸弹牌型。王炸 > 炸弹。

### 输出格式
只输出以下JSON，不要任何其他文字：
{"action":"play|pass","cards":[cardId,...],"reason":"简短的中文策略说明"}

不出牌时 action="pass" cards=[]。action="play" 时 cards 必须包含至少一张牌的ID。

### 策略原则
1. 手牌少时优先出完
2. 作为农民时配合队友，用大牌顶地主
3. 炸弹在关键时刻使用（如对手只剩1-2张牌，或作为最后手段）
4. 尽量保持手牌灵活性，避免拆散顺子/连对`

function formatCard(card: Card): string {
  const suitName: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
  const s = card.suit ? suitName[card.suit] : ""
  return `${s}${RANK_NAMES[card.rank]}`
}

function formatCombo(combo: Combo): string {
  const cards = combo.cards.map(formatCard).join(" ")
  const typeName: Record<string, string> = {
    single: "单张", pair: "对子", triple: "三条",
    triple_plus_1: "三带一", triple_plus_2: "三带二",
    straight: "顺子", pair_straight: "连对",
    plane: "飞机", plane_plus_wings: "飞机带翅膀",
    four_plus_2: "四带二", bomb: "炸弹", rocket: "王炸",
  }
  return `${typeName[combo.type]} [${cards}]`
}

/** 构建用户消息 (DeepSeek 输入) */
export function buildUserMessage(state: GameState, myPosition: number): string {
  const myCards = state.hands[myPosition].map(formatCard).join(", ")
  const role = state.landlord === myPosition ? "地主" : "农民"
  const myName = myPosition === 0 ? "我" : `玩家${myPosition + 1}`
  const landlordIdx = state.landlord ?? 0

  const handSizes = state.hands.map((h) => h.length)
  const lastPlayStr = state.lastPlay ? formatCombo(state.lastPlay.combo) : "无（新轮次开始，自由出牌）"

  return `当前角色：${myName}（${role}）
底牌：${state.dizhuCards.map(formatCard).join(", ")}
我的手牌（牌面由小到大）：${myCards}
剩余手牌：地主 ${handSizes[landlordIdx]} 张 | 农民 ${handSizes[(landlordIdx + 1) % 3]} 张 | 农民 ${handSizes[(landlordIdx + 2) % 3]} 张
上一手牌：${lastPlayStr}
轮到：${myName} 出牌`
}

/** 解析 DeepSeek 返回的 JSON */
export function parseAiResponse(raw: string): AiDecision | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!["play", "pass"].includes(parsed.action)) return null
    if (!Array.isArray(parsed.cards)) return null
    if (typeof parsed.reason !== "string") return null
    if (parsed.action === "play" && parsed.cards.length === 0) return null
    return parsed as AiDecision
  } catch {
    return null
  }
}

/** 验证 AI 出牌的合法性，返回识别后的 Combo */
export function validateAiPlay(
  hand: Card[],
  action: "play" | "pass",
  cardIds: number[],
  lastCombo: Combo | null,
): Combo | null {
  if (action === "pass") return null
  const selected = cardIds.map((id) => hand.find((c) => c.id === id)).filter(Boolean) as Card[]
  if (selected.length === 0) return null
  const combo = recognizeCombo(selected)
  if (!combo) return null
  if (lastCombo && !canBeat(combo, lastCombo)) return null
  return combo
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/doudizhu/logic/ai-schema.ts
git commit -m "feat: 实现 AI schema (prompt + 序列化 + 输出校验)"
```

---

### Task 5: 安装 Phaser + 页面入口 + GameCanvas

**Files:**
- Modify: `package.json` (add phaser dependency)
- Create: `src/app/game/doudizhu/layout.tsx`
- Create: `src/app/game/doudizhu/page.tsx`
- Create: `src/game/GameCanvas.tsx`
- Create: `src/game/doudizhu/config.ts`

- [ ] **Step 1: Install Phaser**

```bash
pnpm add phaser@^3.87.0
```

- [ ] **Step 2: Add phaser type declaration**

创建 `src/types/phaser.d.ts`（如果 TS 对 phaser 的全局命名空间报错，确保 tsconfig 包含该文件）。

- [ ] **Step 3: Create layout.tsx**

```tsx
// src/app/game/doudizhu/layout.tsx
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "斗地主 — XXGame",
  description: "经典斗地主纸牌游戏，与 AI 对战，挑战牌技！",
}

export default function DoudizhuLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 4: Create config.ts**

```ts
// src/game/doudizhu/config.ts
import Phaser from "phaser"
import { BootScene } from "./scenes/BootScene"
import { MenuScene } from "./scenes/MenuScene"
import { DealingScene } from "./scenes/DealingScene"
import { PlayScene } from "./scenes/PlayScene"
import { ResultScene } from "./scenes/ResultScene"

export const doudizhuConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#1a6b3c",
  parent: undefined, // 由 GameCanvas 在运行时设置
  scene: [BootScene, MenuScene, DealingScene, PlayScene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
```

- [ ] **Step 5: Create GameCanvas.tsx**

```tsx
// src/game/GameCanvas.tsx
"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { doudizhuConfig } from "./doudizhu/config"

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return
    gameRef.current = new Phaser.Game({
      ...doudizhuConfig,
      parent: containerRef.current,
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-screen" />
}
```

- [ ] **Step 6: Create page.tsx**

```tsx
// src/app/game/doudizhu/page.tsx
"use client"

import dynamic from "next/dynamic"

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-white text-xl bg-[#1a6b3c]">
      加载中...
    </div>
  ),
})

export default function DoudizhuPage() {
  return <GameCanvas />
}
```

- [ ] **Step 7: 验证页面可访问**

```bash
pnpm dev
# 访问 http://localhost:3000/game/doudizhu
# 应能看到绿色背景的 Phaser canvas（虽然还没有场景）
```

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/game/doudizhu/ src/game/GameCanvas.tsx src/game/doudizhu/config.ts
git commit -m "feat: 安装 Phaser 并创建斗地主页面入口"
```

---

### Task 6: BootScene + MenuScene

**Files:**
- Create: `src/game/doudizhu/scenes/BootScene.ts`
- Create: `src/game/doudizhu/scenes/MenuScene.ts`

- [ ] **Step 1: Create BootScene.ts**

```ts
// src/game/doudizhu/scenes/BootScene.ts
import Phaser from "phaser"

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" })
  }

  preload() {
    // 加载资源
    this.load.image("bg-table", "/game/doudizhu/bg-table.png")
    this.load.atlas("cards", "/game/doudizhu/cards.png", "/game/doudizhu/cards.json")
    this.load.image("card-back", "/game/doudizhu/card-back.png")
    this.load.image("avatar-frame", "/game/doudizhu/avatar.png")

    // 音效
    this.load.audio("sfx-deal", "/game/doudizhu/sfx/deal.mp3")
    this.load.audio("sfx-play", "/game/doudizhu/sfx/play.mp3")
    this.load.audio("sfx-bomb", "/game/doudizhu/sfx/bomb.mp3")
    this.load.audio("sfx-win", "/game/doudizhu/sfx/win.mp3")
    this.load.audio("sfx-lose", "/game/doudizhu/sfx/lose.mp3")

    // 加载进度条
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const bar = this.add.graphics()
    this.load.on("progress", (v: number) => {
      bar.clear()
      bar.fillStyle(0xffffff, 0.8)
      bar.fillRect(width / 2 - 150, height / 2 - 8, 300 * v, 16)
    })
    this.load.on("complete", () => bar.destroy())
  }

  create() {
    this.scene.start("MenuScene")
  }
}
```

- [ ] **Step 2: Create MenuScene.ts**

```ts
// src/game/doudizhu/scenes/MenuScene.ts
import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" })
  }

  create() {
    const { width, height } = this.cameras.main

    // 背景
    if (this.textures.exists("bg-table")) {
      this.add.image(width / 2, height / 2, "bg-table").setDisplaySize(width, height)
    } else {
      this.cameras.main.setBackgroundColor("#1a6b3c")
    }

    // 标题
    this.add
      .text(width / 2, height * 0.25, "斗地主", {
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    // 副标题
    this.add
      .text(width / 2, height * 0.35, "与 AI 对战 · DeepSeek 驱动", {
        fontSize: "20px",
        color: "#cccccc",
      })
      .setOrigin(0.5)

    // 开始按钮
    const btn = this.add
      .text(width / 2, height * 0.55, "[ 开始游戏 ]", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 32, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    btn.on("pointerover", () => btn.setScale(1.05))
    btn.on("pointerout", () => btn.setScale(1))
    btn.on("pointerdown", () => {
      this.scene.start("DealingScene")
    })

    // 返回社区按钮
    const backBtn = this.add
      .text(width / 2, height * 0.7, "← 返回社区", {
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    backBtn.on("pointerdown", () => {
      window.location.href = "/"
    })
  }
}
```

- [ ] **Step 3: 验证场景切换**

```bash
# 访问 /game/doudizhu → 看到绿色背景 + 标题 + 按钮
# 点击按钮 → 转换到 DealingScene（虽然还没有内容，控制台无报错即可）
```

- [ ] **Step 4: Commit**

```bash
git add src/game/doudizhu/scenes/BootScene.ts src/game/doudizhu/scenes/MenuScene.ts
git commit -m "feat: 添加 BootScene 和 MenuScene"
```

---

### Task 7: Phaser UI 组件 (Card, HandFan, PlayerAvatar, Countdown, ParticleEffects)

**Files:**
- Create: `src/game/doudizhu/ui/Card.ts`
- Create: `src/game/doudizhu/ui/HandFan.ts`
- Create: `src/game/doudizhu/ui/PlayerAvatar.ts`
- Create: `src/game/doudizhu/ui/Countdown.ts`
- Create: `src/game/doudizhu/ui/ParticleEffects.ts`

- [ ] **Step 1: Create Card.ts**

```ts
// src/game/doudizhu/ui/Card.ts
import Phaser from "phaser"
import { Card as CardData, RANK_NAMES } from "../logic/types"

const CARD_WIDTH = 71
const CARD_HEIGHT = 96

export class CardSprite extends Phaser.GameObjects.Container {
  public cardData: CardData
  public isSelected = false

  private bg: Phaser.GameObjects.Rectangle
  private label: Phaser.GameObjects.Text
  private back: Phaser.GameObjects.Image | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, card: CardData, faceUp = true) {
    super(scene, x, y)
    this.cardData = card

    // 牌面背景
    this.bg = scene.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 1)
      .setStrokeStyle(1, 0x333333)
    this.add(this.bg)

    if (faceUp && card.suit) {
      const suitColor = card.suit === "h" || card.suit === "d" ? 0xcc0000 : 0x000000
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      this.label = scene.add
        .text(-CARD_WIDTH / 2 + 6, -CARD_HEIGHT / 2 + 4, `${RANK_NAMES[card.rank]}${suitSymbol[card.suit]}`, {
          fontSize: "16px",
          color: suitColor === 0xcc0000 ? "#cc0000" : "#000000",
        })
        .setOrigin(0, 0)
      this.add(this.label)
    } else if (faceUp && !card.suit) {
      // 王
      this.label = scene.add
        .text(0, 0, card.rank === 17 ? "大王" : "小王", {
          fontSize: "14px",
          color: card.rank === 17 ? "#cc0000" : "#000000",
        })
        .setOrigin(0.5)
      this.add(this.label)
    } else {
      // 牌背
      this.back = scene.add.image(0, 0, "card-back")
      if (this.back) this.back.setDisplaySize(CARD_WIDTH - 4, CARD_HEIGHT - 4)
      this.add(this.back!)
    }

    this.setSize(CARD_WIDTH, CARD_HEIGHT)
    this.setInteractive({ useHandCursor: true })
    scene.add.existing(this)
  }

  toggleSelect() {
    this.isSelected = !this.isSelected
    this.y += this.isSelected ? -20 : 20
  }

  deselect() {
    if (this.isSelected) {
      this.isSelected = false
      this.y += 20
    }
  }
}
```

- [ ] **Step 2: Create HandFan.ts**

```ts
// src/game/doudizhu/ui/HandFan.ts
import Phaser from "phaser"
import { CardSprite } from "./Card"
import { Card } from "../logic/types"

export class HandFan extends Phaser.GameObjects.Container {
  private cards: CardSprite[] = []

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    scene.add.existing(this)
  }

  setHand(hand: Card[], interactive = true) {
    this.removeAll(true)
    this.cards = []

    const cardWidth = 71
    const overlap = hand.length > 10 ? 20 : 28
    const totalWidth = (hand.length - 1) * overlap + cardWidth
    const startX = -totalWidth / 2

    hand.forEach((card, i) => {
      const cs = new CardSprite(this.scene, startX + i * overlap + cardWidth / 2, 0, card, true)
      if (interactive) {
        cs.on("pointerdown", () => cs.toggleSelect())
      }
      this.cards.push(cs)
      this.add(cs)
    })
  }

  getSelectedCards(): Card[] {
    return this.cards.filter((c) => c.isSelected).map((c) => c.cardData)
  }

  deselectAll() {
    this.cards.forEach((c) => c.deselect())
  }
}
```

- [ ] **Step 3: Create PlayerAvatar.ts**

```ts
// src/game/doudizhu/ui/PlayerAvatar.ts
import Phaser from "phaser"
import { PlayerPosition } from "../logic/types"

export class PlayerAvatar extends Phaser.GameObjects.Container {
  private nameText: Phaser.GameObjects.Text
  private cardCountText: Phaser.GameObjects.Text
  private avatarBg: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, isLandlord: boolean) {
    super(scene, x, y)

    this.avatarBg = scene.add.graphics()
    this.avatarBg.fillStyle(isLandlord ? 0xd4a017 : 0x333333, 1)
    this.avatarBg.fillCircle(0, 0, 24)
    this.add(this.avatarBg)

    this.nameText = scene.add.text(30, -10, name, { fontSize: "14px", color: "#ffffff" })
    this.add(this.nameText)

    this.cardCountText = scene.add.text(30, 8, "17 张", { fontSize: "12px", color: "#cccccc" })
    this.add(this.cardCountText)

    // 地主标志
    if (isLandlord) {
      const badge = scene.add.text(0, -30, "地主", {
        fontSize: "11px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5)
      this.add(badge)
    }

    scene.add.existing(this)
  }

  setCardCount(n: number) {
    this.cardCountText.setText(`${n} 张`)
  }
}
```

- [ ] **Step 4: Create Countdown.ts**

```ts
// src/game/doudizhu/ui/Countdown.ts
import Phaser from "phaser"

export class Countdown extends Phaser.GameObjects.Container {
  private bar: Phaser.GameObjects.Graphics
  private totalTime: number
  private remaining: number
  private active = false
  private onTimeout: () => void

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, onTimeout: () => void) {
    super(scene, x, y)
    this.totalTime = 15
    this.remaining = 15
    this.onTimeout = onTimeout
    this.bar = scene.add.graphics()
    this.add(this.bar)
    scene.add.existing(this)
  }

  start(seconds = 15) {
    this.totalTime = seconds
    this.remaining = seconds
    this.active = true
    this.draw()
  }

  stop() {
    this.active = false
    this.bar.clear()
  }

  update(delta: number) {
    if (!this.active) return
    this.remaining -= delta / 1000
    if (this.remaining <= 0) {
      this.remaining = 0
      this.active = false
      this.onTimeout()
    }
    this.draw()
  }

  private draw() {
    this.bar.clear()
    const pct = Math.max(0, this.remaining / this.totalTime)
    const color = pct > 0.3 ? 0xd4a017 : 0xcc0000
    this.bar.fillStyle(color, 1)
    this.bar.fillRoundedRect(0, 0, 200 * pct, 8, 4)
  }
}
```

- [ ] **Step 5: Create ParticleEffects.ts**

```ts
// src/game/doudizhu/ui/ParticleEffects.ts
import Phaser from "phaser"

export class ParticleEffects {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  playBomb(x: number, y: number) {
    // 炸弹特效：红色火花
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0xff4400)
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => particle.destroy(),
      })
    }
  }

  playWin(x: number, y: number) {
    // 胜利特效：金色烟花
    for (let i = 0; i < 40; i++) {
      const color = Math.random() > 0.5 ? 0xffd700 : 0xff4444
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), color)
      this.scene.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(200, 400),
        x: x + Phaser.Math.Between(-150, 150),
        alpha: 0,
        duration: Phaser.Math.Between(500, 1000),
        delay: i * 30,
        onComplete: () => p.destroy(),
      })
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/game/doudizhu/ui/
git commit -m "feat: 添加 Phaser UI 组件 (Card, HandFan, Avatar, Countdown, Particles)"
```

---

### Task 8: useGameBridge + game-store 扩展 + 共享 TokenUsagePanel

**Files:**
- Create: `src/game/useGameBridge.ts`
- Modify: `src/stores/game-store.ts`
- Create: `src/components/token-usage-panel.tsx`
- Modify: `src/components/2048/game-2048-ai-panel.tsx` (import path)

- [ ] **Step 1: Create useGameBridge.ts**

```ts
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
```

- [ ] **Step 2: Extend game-store.ts**

```ts
// src/stores/game-store.ts (修改后)
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { TokenUsage } from "@/lib/deepseek-usage"

interface GameState {
  // 2048 API Key
  apiKey: string
  setApiKey: (key: string) => void
  // 斗地主 API Key
  doudizhuApiKey: string
  setDoudizhuApiKey: (key: string) => void
  // 斗地主 Token 用量 (累计)
  doudizhuTokenUsage: TokenUsage | null
  setDoudizhuTokenUsage: (usage: TokenUsage | null) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
      doudizhuApiKey: "",
      setDoudizhuApiKey: (doudizhuApiKey) => set({ doudizhuApiKey }),
      doudizhuTokenUsage: null,
      setDoudizhuTokenUsage: (doudizhuTokenUsage) => set({ doudizhuTokenUsage }),
    }),
    {
      name: "xxgame_game_store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
```

- [ ] **Step 3: 共享 TokenUsagePanel**

将 `src/components/2048/token-usage-panel.tsx` 搬到 `src/components/token-usage-panel.tsx`（内容不变），并更新 2048 的 import path。

```tsx
// src/components/token-usage-panel.tsx (从 2048 目录搬过来)
// 完整内容复制自 src/components/2048/token-usage-panel.tsx
```

修改 `src/components/2048/game-2048-ai-panel.tsx` 中的引入路径:
```ts
// 修改前:
import TokenUsagePanel from "@/components/2048/token-usage-panel"
// 修改后:
import TokenUsagePanel from "@/components/token-usage-panel"
```

- [ ] **Step 4: Commit**

```bash
git add src/game/useGameBridge.ts src/stores/game-store.ts src/components/token-usage-panel.tsx src/components/2048/token-usage-panel.tsx
git commit -m "feat: 添加通信桥、扩展 game-store、共享 TokenUsagePanel"
```

---

### Task 9: DealingScene (发牌动画 + 叫地主)

**Files:**
- Create: `src/game/doudizhu/scenes/DealingScene.ts`

- [ ] **Step 1: Create DealingScene.ts**

```ts
// src/game/doudizhu/scenes/DealingScene.ts
import Phaser from "phaser"
import { GameState, PlayerPosition } from "../logic/types"
import { initGame, assignLandlord } from "../logic/deck"
import { CardSprite } from "../ui/Card"

export class DealingScene extends Phaser.Scene {
  private gameState!: GameState
  private cards: CardSprite[] = []

  constructor() {
    super({ key: "DealingScene" })
  }

  create() {
    this.gameState = initGame()
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor("#1a6b3c")

    // 牌堆位置 (桌面中央)
    const centerX = width / 2
    const centerY = height / 2

    // 三家手牌目标位置
    const targets = [
      { x: centerX, y: height - 80 },         // 玩家 (底部)
      { x: width / 2 + 280, y: height / 2 },  // 下家 (右侧)
      { x: width / 2 - 280, y: height / 2 },  // 上家 (左侧)
    ]

    // 创建 54 张牌背面
    const deck = this.gameState.deck
    deck.forEach((card, i) => {
      const cs = new CardSprite(this, centerX, centerY, card, false)
      this.cards.push(cs)
    })

    // 发牌动画：每张牌飞到对应位置
    const dealTimeline = this.tweens.timeline({
      onComplete: () => {
        // 翻转底牌
        this.cards.slice(51, 54).forEach((cs) => {
          this.tweens.add({
            targets: cs,
            scaleY: 0,
            duration: 150,
            yoyo: true,
            onYoyo: () => {
              // 翻转为正面
            },
          })
        })

        // 3 秒后进入叫地主阶段
        this.time.delayedCall(2000, () => this.startCallingPhase())
      },
    })

    deck.forEach((card, i) => {
      const targetIdx = i % 3 as PlayerPosition
      const t = targets[targetIdx]
      dealTimeline.add({
        targets: this.cards[i],
        x: t.x,
        y: t.y,
        duration: 100,
        delay: i * 30,
      })
    })
  }

  private startCallingPhase() {
    // 简化版：直接指定玩家为地主（后续可改为 DeepSeek 叫地主）
    this.gameState = assignLandlord(this.gameState, 0)
    this.scene.start("PlayScene", { gameState: this.gameState })
  }
}
```

- [ ] **Step 2: 验证**

```bash
# 点击"开始游戏" → 能看到发牌动画 → 自动进入 PlayScene (还没有内容但无报错即可)
```

- [ ] **Step 3: Commit**

```bash
git add src/game/doudizhu/scenes/DealingScene.ts
git commit -m "feat: 实现 DealingScene (发牌动画 + 叫地主)"
```

---

### Task 10: PlayScene (核心游戏场景)

**Files:**
- Create: `src/game/doudizhu/scenes/PlayScene.ts`

**这是最复杂的文件。** PlayScene 使用 Phaser update loop 驱动游戏流程：

- [ ] **Step 1: Create PlayScene.ts**

```ts
// src/game/doudizhu/scenes/PlayScene.ts
import Phaser from "phaser"
import { GameState, Card, Combo, PlayerPosition, RANK_NAMES } from "../logic/types"
import { assignLandlord } from "../logic/deck"
import { recognizeCombo } from "../logic/rules"
import { canBeat } from "../logic/compare"
import { CardSprite } from "../ui/Card"
import { HandFan } from "../ui/HandFan"
import { PlayerAvatar } from "../ui/PlayerAvatar"
import { Countdown } from "../ui/Countdown"
import { ParticleEffects } from "../ui/ParticleEffects"
import { SYSTEM_PROMPT, buildUserMessage, parseAiResponse, validateAiPlay, AiDecision } from "../logic/ai-schema"
import { dsApi } from "@/lib/api-client"
import { useGameStore } from "@/stores/game-store"

export class PlayScene extends Phaser.Scene {
  private gameState!: GameState
  private myHand!: HandFan
  private avatars!: PlayerAvatar[]
  private lastPlayTexts!: (Phaser.GameObjects.Text | null)[]
  private countdown!: Countdown
  private particles!: ParticleEffects
  private passCountTexts!: (Phaser.GameObjects.Text | null)[]
  private currentTurnAction: (() => void) | null = null

  constructor() {
    super({ key: "PlayScene" })
  }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor("#1a6b3c")

    // ---- 出牌区（中央） ----
    this.lastPlayTexts = [null, null, null]

    // ---- 玩家信息 ----
    const names = ["我", "下家", "上家"]
    this.avatars = [
      new PlayerAvatar(this, 40, height - 60, names[0], this.gameState.landlord === 0),
      new PlayerAvatar(this, width - 180, height / 2 - 40, names[1], this.gameState.landlord === 1),
      new PlayerAvatar(this, 40, height / 2 - 40, names[2], this.gameState.landlord === 2),
    ]

    // ---- 我的手牌（底部扇形） ----
    this.myHand = new HandFan(this, width / 2, height - 50)
    this.myHand.setHand(this.gameState.hands[0], true)

    // ---- 出牌按钮 ----
    const playBtn = this.add
      .text(width / 2 - 60, height - 130, "出牌", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 16, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onHumanPlay())

    const passBtn = this.add
      .text(width / 2 + 60, height - 130, "不出", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 16, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onHumanPass())

    // ---- 倒计时 ----
    this.countdown = new Countdown(this, width / 2 - 100, height - 170, 200, () => {
      this.onHumanTimeout()
    })

    // ---- 特效 ----
    this.particles = new ParticleEffects(this)

    // ---- 开始游戏 ----
    this.startTurn()
  }

  update(_time: number, delta: number) {
    this.countdown.update(delta)
  }

  // ==================== 回合管理 ====================

  private startTurn() {
    this.avatars.forEach((a) => a.setCardCount(0))

    if (this.gameState.phase === "finished") {
      this.scene.start("ResultScene", { gameState: this.gameState })
      return
    }

    if (this.gameState.currentPlayer === 0) {
      // 玩家回合
      this.countdown.start(15)
    } else {
      // AI 回合
      this.countdown.stop()
      this.currentTurnAction = () => this.handleAiTurn()
      this.time.delayedCall(500, () => this.currentTurnAction?.())
    }
  }

  // ==================== 玩家操作 ====================

  private onHumanPlay() {
    if (this.gameState.currentPlayer !== 0) return
    const selected = this.myHand.getSelectedCards()
    if (selected.length === 0) return

    const combo = recognizeCombo(selected)
    if (!combo) {
      this.showToast("无效牌型")
      return
    }
    if (this.gameState.lastPlay && !canBeat(combo, this.gameState.lastPlay.combo)) {
      this.showToast("打不过，请选择更大的牌")
      return
    }

    this.executePlay(0, selected, combo)
  }

  private onHumanPass() {
    if (this.gameState.currentPlayer !== 0) return
    // 如果自己是首轮出牌，不能 pass
    if (!this.gameState.lastPlay || this.gameState.lastPlay.player === 0) {
      this.showToast("必须出牌")
      return
    }
    this.executePass(0)
  }

  private onHumanTimeout() {
    if (this.gameState.currentPlayer !== 0) return
    // 超时自动出最小牌或 pass
    if (!this.gameState.lastPlay || this.gameState.lastPlay.player === 0) {
      // 出最小的单张
      const minCard = this.gameState.hands[0][0]
      const combo = recognizeCombo([minCard])
      if (combo) this.executePlay(0, [minCard], combo)
    } else {
      this.executePass(0)
    }
  }

  // ==================== AI 回合 ====================

  private async handleAiTurn() {
    const player = this.gameState.currentPlayer
    const hand = this.gameState.hands[player]

    // 通过 DeepSeek API 获取决策
    const decision = await this.callAi(player)

    if (!decision || decision.action === "pass") {
      // AI 选择 pass
      const canPass = this.gameState.lastPlay && this.gameState.lastPlay.player !== player
      if (canPass) {
        this.executePass(player)
      } else {
        // 不能 pass，出最小单张
        const minCard = hand[0]
        const combo = recognizeCombo([minCard])
        if (combo) this.executePlay(player, [minCard], combo)
      }
      return
    }

    // 验证 AI 出牌
    const combo = validateAiPlay(
      hand,
      "play",
      decision.cards,
      this.gameState.lastPlay?.combo ?? null,
    )

    if (combo) {
      this.executePlay(player, decision.cards, combo)
    } else {
      // 降级：出最小能出的牌
      const fallback = this.findSmallestPlay(hand)
      if (fallback) {
        this.executePlay(player, fallback.cards.map((c) => c.id), fallback)
      } else {
        this.executePass(player)
      }
    }
  }

  private async callAi(player: PlayerPosition): Promise<AiDecision | null> {
    try {
      const apiKey = useGameStore.getState().doudizhuApiKey
      if (!apiKey) {
        // 无 API Key 时使用简单策略
        return this.fallbackAi(player)
      }

      const { content } = await dsApi(apiKey, [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: buildUserMessage(this.gameState, player) },
      ])

      return parseAiResponse(content)
    } catch {
      return this.fallbackAi(player)
    }
  }

  /** 无 API Key 或调用失败时的简单 AI 策略 */
  private fallbackAi(player: PlayerPosition): AiDecision {
    const hand = this.gameState.hands[player]
    const lastCombo = this.gameState.lastPlay?.combo ?? null

    if (!lastCombo || this.gameState.lastPlay?.player === player) {
      // 自由出牌：出最小的牌
      const combo = recognizeCombo([hand[0]])
      if (combo) {
        return { action: "play", cards: [hand[0].id], reason: "出最小牌" }
      }
    }

    // 尝试找最小的能打过的牌
    const play = this.findSmallestPlay(hand)
    if (play) {
      return { action: "play", cards: play.cards.map((c) => c.id), reason: "出牌" }
    }

    return { action: "pass", cards: [], reason: "要不起" }
  }

  private findSmallestPlay(hand: Card[]): Combo | null {
    const lastCombo = this.gameState.lastPlay?.combo ?? null
    if (!lastCombo) {
      return recognizeCombo([hand[0]])
    }

    // 尝试所有可能的牌组合（简单暴力：1张~4张）
    for (let len = 1; len <= Math.min(hand.length, 20); len++) {
      for (let i = 0; i <= hand.length - len; i++) {
        const subset = hand.slice(i, i + len)
        const combo = recognizeCombo(subset)
        if (combo && canBeat(combo, lastCombo)) return combo
      }
    }
    return null
  }

  // ==================== 执行出牌 ====================

  private executePlay(player: PlayerPosition, cardIds: number[], combo: Combo) {
    // 从手牌中移除
    const removedIds = new Set(cardIds)
    const newHand = this.gameState.hands[player].filter((c) => !removedIds.has(c.id))
    this.gameState.hands[player] = newHand

    // 更新状态
    this.gameState.lastPlay = { player, combo }
    this.gameState.passCount = 0

    // 更新 UI
    if (player === 0) {
      this.myHand.setHand(newHand, true)
    }
    this.avatars[player].setCardCount(newHand.length)

    // 显示出的牌
    this.showLastPlay(player, combo)

    // 特效
    if (combo.type === "bomb" || combo.type === "rocket") {
      this.particles.playBomb(this.cameras.main.width / 2, this.cameras.main.height / 2)
    }

    // 检查是否出完
    if (newHand.length === 0) {
      this.gameState.winner = player
      this.gameState.phase = "finished"
      this.countdown.stop()
      this.time.delayedCall(1000, () => {
        this.scene.start("ResultScene", { gameState: this.gameState })
      })
      return
    }

    // 下一家
    this.nextPlayer()
  }

  private executePass(player: PlayerPosition) {
    this.gameState.passCount++
    this.showLastPlay(player, null)

    // 如果连续两家 pass，上一家自由出牌
    if (this.gameState.passCount >= 2) {
      this.gameState.lastPlay = null
      this.gameState.passCount = 0
    }

    this.nextPlayer()
  }

  private nextPlayer() {
    this.gameState.currentPlayer = ((this.gameState.currentPlayer + 1) % 3) as PlayerPosition
    this.time.delayedCall(800, () => this.startTurn())
  }

  // ==================== UI 辅助 ====================

  private showLastPlay(player: PlayerPosition, combo: Combo | null) {
    const { width, height } = this.cameras.main
    const positions = [
      { x: width / 2, y: height - 200 },
      { x: width / 2 + 150, y: height / 2 },
      { x: width / 2 - 150, y: height / 2 },
    ]

    // 清除旧文本
    if (this.lastPlayTexts[player]) {
      this.lastPlayTexts[player]!.destroy()
    }

    if (!combo) {
      // 显示"不出"
      this.lastPlayTexts[player] = this.add
        .text(positions[player].x, positions[player].y, "不出", {
          fontSize: "18px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5)
      return
    }

    const cardStr = combo.cards
      .map((c) => {
        const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
        const s = c.suit ? suitSymbol[c.suit] : ""
        return `${s}${RANK_NAMES[c.rank]}`
      })
      .join(" ")

    this.lastPlayTexts[player] = this.add
      .text(positions[player].x, positions[player].y, cardStr, {
        fontSize: "22px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
  }

  private showToast(msg: string) {
    const { width, height } = this.cameras.main
    const t = this.add
      .text(width / 2, height / 2, msg, {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#ff444488",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 60,
      duration: 1000,
      delay: 500,
      onComplete: () => t.destroy(),
    })
  }
}
```

- [ ] **Step 2: 验证**

```bash
# 开始游戏 → 发牌 → PlayScene
# 验证: 能看到手牌、出牌按钮、AI 自动出牌
# 验证: AI 调用 DeepSeek API 后能做出正确决策
# 验证: 出牌后有动画
# 验证: 炸弹有特效
# 验证: 一局结束后进入结算
```

- [ ] **Step 3: Commit**

```bash
git add src/game/doudizhu/scenes/PlayScene.ts
git commit -m "feat: 实现 PlayScene (核心游戏场景)"
```

---

### Task 11: ResultScene + AI 设置面板

**Files:**
- Create: `src/game/doudizhu/scenes/ResultScene.ts`
- Modify: `src/game/doudizhu/scenes/MenuScene.ts` (添加 AI 设置区域)

- [ ] **Step 1: Create ResultScene.ts**

```ts
// src/game/doudizhu/scenes/ResultScene.ts
import Phaser from "phaser"
import { GameState, RANK_NAMES } from "../logic/types"

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: "ResultScene" })
  }

  create(data: { gameState: GameState }) {
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor("#1a6b3c")

    const gs = data.gameState
    const isHumanWin = gs.winner === 0

    // 结果文字
    const resultText = isHumanWin ? "🎉 你赢了！" : "😞 你输了"
    this.add
      .text(width / 2, height * 0.3, resultText, {
        fontSize: "48px",
        color: isHumanWin ? "#ffd700" : "#ff4444",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    // 统计信息
    const names = ["我", "下家", "上家"]
    const info = gs.hands
      .map((h, i) => `${names[i]}: ${h.length} 张`)
      .join("  |  ")
    this.add
      .text(width / 2, height * 0.45, info, {
        fontSize: "18px",
        color: "#cccccc",
      })
      .setOrigin(0.5)

    // Token 用量提示
    this.add
      .text(width / 2, height * 0.52, "Token 用量详情请查看游戏外设置面板", {
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5)

    // 再来一局
    const replayBtn = this.add
      .text(width / 2, height * 0.65, "[ 再来一局 ]", {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("DealingScene"))

    // 返回菜单
    this.add
      .text(width / 2, height * 0.78, "返回主菜单", {
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("MenuScene"))
  }
}
```

- [ ] **Step 2: 更新 MenuScene 添加 AI 设置面板**

MenuScene 底部增加 React DOM 覆盖层。由于 Phaser 内嵌 React 组件不方便，改为在 MenuScene 中添加一个简单的"请返回页面设置 API Key"的文字提示。实际的 API Key 输入和 Token 用量展示复用 React 端的组件，渲染在 Phaser Canvas 之外的页面区域。

**方案：** 在 page.tsx 中，Phaser Canvas 下方（或浮动层）放置 React DOM 的 AI 设置面板。

修改 `src/app/game/doudizhu/page.tsx`:

```tsx
"use client"

import dynamic from "next/dynamic"
import { DoudizhuAiPanel } from "@/components/doudizhu-ai-panel"

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-white text-xl bg-[#1a6b3c]">
      加载中...
    </div>
  ),
})

export default function DoudizhuPage() {
  return (
    <div className="relative">
      <GameCanvas />
      <div className="absolute top-4 right-4 z-10">
        <DoudizhuAiPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/doudizhu-ai-panel.tsx**

参考 2048 的 AI 面板模式:

```tsx
// src/components/doudizhu-ai-panel.tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/game/doudizhu/scenes/ResultScene.ts src/components/doudizhu-ai-panel.tsx
git commit -m "feat: 实现 ResultScene 和 AI 设置面板"
```

---

### Task 12: 游戏资源 + 集成测试

**Files:**
- Create placeholder assets in `public/game/doudizhu/`
- End-to-end playtest

- [ ] **Step 1: Create placeholder assets**

由于暂时没有设计师制作的牌面资源，先用 Phaser 内置绘图生成占位牌：

修改 `BootScene.ts`，在 preload 中检测资源加载失败的 fallback。

- [ ] **Step 2: 创建 public 目录和占位资源**

```bash
mkdir -p public/game/doudizhu/sfx
```

对于 cards.png 和 cards.json，先用程序化生成的牌。在 `BootScene.ts` 的 `create()` 中添加 fallback 牌面绘制。

- [ ] **Step 3: 端到端验证**

```bash
pnpm dev
# 1. 访问 /game/doudizhu → 看到绿色背景 + "斗地主" 标题
# 2. 点击"开始游戏" → 发牌动画
# 3. 进入 PlayScene → 看到手牌、AI 自动出牌
# 4. 玩完一局 → 看到结算画面
# 5. 点击"再来一局" → 重新发牌
```

- [ ] **Step 4: 确认所有文件已提交、无遗漏**

```bash
git status
git log --oneline --graph
```

---

## Self-Review 检查

- [ ] Spec 覆盖度：每个 spec 中的功能点都有对应任务
- [ ] 无占位符/TODO：所有代码块都是完整的可实现代码
- [ ] 类型一致性：types.ts 导出的类型在 deck、rules、compare、ai-schema、PlayScene 中用法一致
- [ ] 测试覆盖：核心规则引擎（rules + compare）有完整单元测试
- [ ] 错误处理：AI 调用失败有 fallbackAi 降级策略
- [ ] 依赖管理：phaser 是唯一新增的运行时依赖
