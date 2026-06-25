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

  // ---- 四带二 (优先级高于飞机/顺子等) ----
  if (n === 6) {
    const four = groups.find(([, cs]) => cs.length === 4)
    if (four) {
      // 可以是两个单张 (groups.length===3) 或一对 (groups.length===2)
      return makeCombo(ComboType.FourPlus2, four[0], cards)
    }
  }
  if (n === 8) {
    const four = groups.find(([, cs]) => cs.length === 4)
    if (four && groups.length === 3 && groups.filter(([, cs]) => cs.length === 2).length === 2) {
      return makeCombo(ComboType.FourPlus2, four[0], cards)
    }
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
  const triples = groups.filter(([, cs]) => cs.length === 3).map(([r]) => r).sort((a, b) => b - a)
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

  return null
}
