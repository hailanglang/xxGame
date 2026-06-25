import { Combo, ComboType } from "./types"

export function canBeat(hand: Combo, lastPlay: Combo): boolean {
  // 王炸最大: 如果不是王炸则不处理；平手 (两手都是王炸) 返回 false
  if (hand.type === ComboType.Rocket && lastPlay.type !== ComboType.Rocket) return true
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
