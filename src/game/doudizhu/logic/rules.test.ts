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
