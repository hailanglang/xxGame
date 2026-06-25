# 斗地主游戏 — 设计文档

- **创建日期**: 2026-06-25
- **项目**: XXGame — 游戏社区中心
- **状态**: 设计定稿

---

## 1. 概述

在 XXGame 项目内新增「斗地主」单人纸牌游戏。用户与两个 AI 对手对战，AI 逻辑调用 DeepSeek API（复用 2048 的 `dsApi` 模式）。游戏渲染使用 Phaser 3 Canvas/WebGL，嵌入 Next.js 路由 `/game/doudizhu`。

### 核心决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 渲染方案 | Phaser 3 嵌入 Next.js | 重度画面需求（60fps 动画、粒子特效、拖拽选牌） |
| AI 方案 | DeepSeek API（LLM） | 复用项目已有的 dsApi 模式，灵活的出牌策略 |
| 集成方式 | `next/dynamic` + ssr:false | Phaser ~1MB bundle 仅访问游戏页时加载 |
| 通信方式 | 自定义事件（window.dispatchEvent）| React ↔ Phaser 零耦合双向通信 |

---

## 2. 目录结构

```
src/
├── app/game/doudizhu/
│   ├── layout.tsx          ← Metadata, SEO
│   └── page.tsx            ← 仅 dynamic import，约 10 行
│
├── game/                                    ← 新增：游戏代码顶层
│   ├── GameCanvas.tsx                       ← React 壳子，挂载/卸载 Phaser
│   ├── useGameBridge.ts                     ← React ↔ Phaser 通信桥
│   │
│   └── doudizhu/
│       ├── config.ts                        ← Phaser GameConfig
│       ├── scenes/
│       │   ├── BootScene.ts                 ← 预加载贴图/音频
│       │   ├── MenuScene.ts                 ← 开始界面
│       │   ├── DealingScene.ts              ← 发牌动画 + 叫地主
│       │   ├── PlayScene.ts                 ← 主游戏（最核心）
│       │   └── ResultScene.ts               ← 结算
│       ├── logic/
│       │   ├── types.ts                     ← Card, Combo, ComboType, GameState
│       │   ├── deck.ts                      ← 洗牌、发牌
│       │   ├── rules.ts                     ← 牌型识别 & 出牌合法性
│       │   ├── compare.ts                   ← 牌型大小比较
│       │   └── ai-schema.ts                ← System prompt + 状态序列化 + 输出校验
│       ├── ui/
│       │   ├── Card.ts                      ← Phaser Container（一张牌）
│       │   ├── HandFan.ts                   ← 扇形手牌容器 + 选牌
│       │   ├── PlayerAvatar.ts             ← 玩家信息
│       │   ├── Countdown.ts                 ← 倒计时条
│       │   └── ParticleEffects.ts           ← 出牌/胜利特效
│       └── assets/                          ← 图片和音效
```

---

## 3. React ↔ Phaser 集成

### 3.1 页面入口 (page.tsx)

```tsx
"use client"

import dynamic from "next/dynamic"

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center">加载中...</div>,
})

export default function DoudizhuPage() {
  return <GameCanvas />
}
```

### 3.2 GameCanvas 挂载生命周期

```tsx
"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { doudizhuConfig } from "./doudizhu/config"

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return
    gameRef.current = new Phaser.Game({ ...doudizhuConfig, parent: containerRef.current })
    return () => { gameRef.current?.destroy(true); gameRef.current = null }
  }, [])

  return <div ref={containerRef} className="w-full h-screen" />
}
```

### 3.3 通信桥 (useGameBridge)

使用 `window.dispatchEvent` / `window.addEventListener` 实现零耦合通信：

| 方向 | 机制 | 示例 |
|------|------|------|
| Phaser → React | `window.dispatchEvent(new CustomEvent("game:bridge", { detail: { type, payload } }))` | 游戏结算时通知 React 保存分数 |
| React → Phaser | `game.scene.getScene("PlayScene")?.events.emit("auth:token", token)` | 用户登录后同步 token 到 Phaser |

通信桥不 import 任何对方模块，依赖 `useGameBridge` hook（React 侧）和全局事件监听（Phaser 侧）。

---

## 4. 游戏逻辑引擎

位于 `src/game/doudizhu/logic/`，纯 TypeScript，零 Phaser 依赖，可独立测试。

### 4.1 数据类型

```ts
enum Suit { Hearts = "h", Diamonds = "d", Clubs = "c", Spades = "s" }
// Rank: 3=3 ... 14=A, 15=2, 16=小王, 17=大王
type Rank = 3|4|5|6|7|8|9|10|11|12|13|14|15|16|17

interface Card { id: number; suit: Suit | null; rank: Rank }

enum ComboType {
  Single, Pair, Triple, TriplePlus1, TriplePlus2,
  Straight, PairStraight, Plane, PlanePlusWings, FourPlus2,
  Bomb, Rocket
}

interface Combo { type: ComboType; mainRank: Rank; length: number; cards: Card[] }
```

### 4.2 核心规则函数

```ts
/** 牌型识别：15 张手牌中识别出选中的牌构成什么牌型 */
export function recognizeCombo(cards: Card[]): Combo | null

/** 大小比较：hand 能否打过 lastPlay */
export function canBeat(hand: Combo, lastPlay: Combo): boolean
```

### 4.3 DeepSeek AI

调用模式与 2048 完全一致：

```
Phaser PlayScene
  → 轮到 AI 出牌
  → serializeGameState() 构建用户消息
  → dsApi(apiKey, [systemPrompt, userMessage], signal)
  → JSON.parse 解析 DeepSeek 返回值
  → validateAiPlay() 出牌合法性校验
  → 合法 → 出牌动画；非法 → 降级策略（出最小牌或 pass）
```

**System Prompt** 包含：
- 完整斗地主规则（牌型、大小、叫地主流程）
- 输出 JSON 格式约束
- 策略原则（配合队友、炸弹时机、手牌灵活性）

**用户消息** 包含：
- 当前角色（地主/农民）
- 我的手牌列表
- 地主底牌
- 三家剩余牌数
- 上一手出牌信息

**输出格式**：

```json
{
  "action": "play" | "pass",
  "cards": [cardId1, cardId2, ...],
  "reason": "简短的中文策略说明"
}
```

**出牌校验**：`recognizeCombo(selected) + canBeat(combo, lastCombo)` 二次验证，防止 AI 幻觉。

---

## 5. Phaser 场景（5 个）

### BootScene — 预加载
- 加载 SpriteSheet（54 张牌帧数据 + 卡背）
- 加载桌面背景、头像框
- 加载音效（出牌、洗牌、炸弹、胜利、失败）

### MenuScene — 主菜单
- 「斗地主」标题
- 「开始游戏」按钮
- AI 设置区域（API Key 输入 + Token 用量展示，复用 2048 的做法）
- 后续可扩展：排行榜、设置

### DealingScene — 发牌 + 叫地主
- 54 张牌从桌面中心扇形分配到 3 家
- 发牌完成后翻 3 张底牌
- 3 轮叫地主（DeepSeek 决定每个 AI 角色是否叫地主）
- 确定地主后进入 PlayScene

### PlayScene — 核心（最复杂）
- **布局**：上家（顶部）+ 出牌区（中央）+ 我的手牌（底部）+ 倒计时
- **手牌交互**：触控点选高亮、选中的牌向上浮起
- **出牌区**：显示上轮出的牌，支持飞入/飞出动画
- **AI 回合**：等待 → 调 API → 验证 → 执行 → 动画
- **计时器**：每轮 15 秒倒计时（条形进度条），超时自动出最小牌或 pass
- **状态管理**：GameState 对象保存完整牌局信息

### ResultScene — 结算
- 胜负结果文字（大字体）
- 展示 DeekSeep 给出的胜负原因/总结
- Token 用量总结
- 「再来一局」按钮 → MenuScene

---

## 6. 资源管理

| 资源 | 位置 | 估计大小 | 说明 |
|------|------|---------|------|
| 牌 SpriteSheet | `public/game/doudizhu/cards.png` + `.json` | ~200KB | 54 张牌帧 + 卡背 |
| 桌面背景 | `public/game/doudizhu/bg-table.png` | ~50KB | |
| 音效包 | `public/game/doudizhu/sfx/` | ~100KB | 出牌、洗牌、炸弹、胜利、失败 |
| 头像框 | `public/game/doudizhu/avatar.png` | ~20KB | |

Phaser 通过 `this.load.image("cards", "/game/doudizhu/cards.png")` 加载，不会经过 Next.js 的静态优化 pipeline。

---

## 7. 与现有项目关系

| 共享点 | 方案 |
|--------|------|
| 用户登录 | `useGameBridge` 从 `useUserStore` 读取 token |
| DeepSeek API Key | 扩展 `game-store.ts`（已 persist），增加 `doudizhuApiKey` 字段 |
| Token 用量 | 2048 的 `token-usage-panel.tsx` 搬至 `src/components/` 共享 |
| dsApi 调用 | 直接复用 `src/lib/api-client.ts` 的 `dsApi()` |
| 数据库 (Prisma) | 游戏纯前端，暂不写数据库 |
| 导航栏 | Phaser 全屏；返回社区通过 Phaser 按钮触发 `window.location.href = "/"` |
| 路由 | `/game/doudizhu` → `next/dynamic` → Phaser（~1MB bundle 仅在此页加载） |

---

## 8. 构建与包体

- Phaser 约 1MB（压缩后约 400KB），仅 `/game/doudizhu` 页面按需加载
- 游戏资源（图片 + 音效）~370KB，浏览器缓存
- 斗地主游戏逻辑代码 ~10-15KB（tree-shaken）
- AI 调用按估计约 ¥0.008/局，100 局约 ¥0.81

---

## 9. 后续可扩展

- **联网对战**：Phaser 切换网络模式，DeepSeek AI 替换为真实玩家 WebSocket
- **排行榜**：将胜负记录写入 Prisma（users → game_records 表）
- **小程序版**：游戏逻辑引擎（`logic/` 目录）可直接复用，Phaser scenes 需在 Uni-app 中适配
