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
