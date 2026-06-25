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
  for (const rank of JOKER_RANKS) {
    cards.push({ id: id++, suit: null, rank })
  }
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
  return { ...state, landlord: landlordPos, hands: newHands, dizhuCards: [] }
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
