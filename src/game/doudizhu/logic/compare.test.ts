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
