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
