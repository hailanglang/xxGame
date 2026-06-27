// src/game/doudizhu/scenes/DealingScene.ts
import Phaser from "phaser"
import { GameState, PlayerPosition } from "../logic/types"
import { initGame, assignLandlord } from "../logic/deck"
import { CardSprite } from "../ui/Card"
import { PlayerAvatar } from "../ui/PlayerAvatar"
import { px } from "../utils/scale"

export class DealingScene extends Phaser.Scene {
  private gameState!: GameState
  private cards: CardSprite[] = []
  private avatars!: PlayerAvatar[]

  constructor() {
    super({ key: "DealingScene" })
  }

  create() {
    this.gameState = initGame()
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor("#1a6b3c")

    const centerX = width / 2
    const centerY = height / 2

    // 玩家信息 (显示姓名和手牌数)
    const names = ["我", "下家", "上家"]
    const handSizes = this.gameState.hands.map((h) => h.length)
    this.avatars = [
      new PlayerAvatar(this, px(40, this), height - px(60, this), names[0], false),
      new PlayerAvatar(this, width - px(180, this), height / 2 - px(40, this), names[1], false),
      new PlayerAvatar(this, px(40, this), height / 2 - px(40, this), names[2], false),
    ]
    this.avatars.forEach((a, i) => a.setCardCount(handSizes[i]))

    // 三家手牌目标位置 (发牌动画终点)
    const targets: Array<{ x: number; y: number }> = [
      { x: centerX, y: height - px(80, this) },
      { x: width / 2 + px(280, this), y: height / 2 },
      { x: width / 2 - px(280, this), y: height / 2 },
    ]

    // 创建 54 张牌背面，全部从桌面中央开始
    const deck = this.gameState.deck
    deck.forEach((card) => {
      const cs = new CardSprite(this, centerX, centerY, card, false)
      this.cards.push(cs)
    })

    // 发牌动画：前 51 张 round-robin 发到三家，后 3 张留在中央作为底牌
    deck.forEach((_card, i) => {
      if (i >= 51) {
        // 3 张底牌：留在中央区域横向散开
        const bottomOffsetX = (i - 51 - 1) * px(50, this)
        this.tweens.add({
          targets: this.cards[i],
          x: centerX + bottomOffsetX,
          y: centerY,
          duration: 100,
          delay: i * 30,
        })
        return
      }

      const targetIdx = (i % 3) as PlayerPosition
      const t = targets[targetIdx]
      // 同一位置的手牌略微错开，形成扇形效果
      const cardInHand = Math.floor(i / 3)
      const offsetX = (cardInHand - 8) * px(36, this)

      this.tweens.add({
        targets: this.cards[i],
        x: t.x + offsetX,
        y: t.y,
        duration: 80,
        delay: i * 25,
      })
    })

    // 等待所有发牌动画完成后翻转底牌
    const totalDealTime = 54 * 25 + 150
    this.time.delayedCall(totalDealTime, () => this.flipBottomCards())
  }

  private flipBottomCards() {
    // 翻转 3 张底牌 (scaleY 归零 → yoyo → 翻转为牌面)
    this.cards.slice(51, 54).forEach((cs) => {
      this.tweens.add({
        targets: cs,
        scaleY: 0,
        duration: 150,
        yoyo: true,
        onYoyo: () => {
          cs.showFace()
        },
      })
    })

    // 2 秒后进入叫地主阶段
    this.time.delayedCall(2000, () => this.startCallingPhase())
  }

  private startCallingPhase() {
    // 简化版：直接指定玩家(0)为地主
    this.gameState = assignLandlord(this.gameState, 0)
    this.scene.start("PlayScene", { gameState: this.gameState })
  }
}
