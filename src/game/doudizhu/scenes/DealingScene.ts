// src/game/doudizhu/scenes/DealingScene.ts
import Phaser from "phaser"
import { GameState, PlayerPosition } from "../logic/types"
import { initGame, assignLandlord } from "../logic/deck"
import { CardSprite } from "../ui/Card"
import { PlayerAvatar } from "../ui/PlayerAvatar"
import { px } from "../utils/scale"

/**
 * 发牌场景
 *
 * 54 张牌背面从桌面中央飞向三家玩家位置的动画。发牌完成后，3 张底牌在原地翻转
 * 并显示"底牌"标签。短暂停留后自动进入 PlayScene 开始叫地主阶段。
 */
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

    // 玩家信息 — 匹配 PlayScene 布局
    const handSizes = this.gameState.hands.map((h) => h.length)
    this.avatars = [
      new PlayerAvatar({ scene: this, x: px(24, this), y: height - px(250, this), avatarChar: "我", displayName: "你（农民）", cardCount: handSizes[0], isLandlord: false, layout: "left" }),
      new PlayerAvatar({ scene: this, x: width - px(24, this), y: px(24, this), avatarChar: "李", displayName: "AI 李四", cardCount: handSizes[1], isLandlord: false, layout: "right" }),
      new PlayerAvatar({ scene: this, x: px(24, this), y: px(24, this), avatarChar: "张", displayName: "AI 张三", cardCount: handSizes[2], isLandlord: false, layout: "left" }),
    ]

    // 三家手牌目标位置
    const targets: Array<{ x: number; y: number }> = [
      { x: centerX, y: height - px(70, this) },         // 玩家 (底部)
      { x: width - px(88, this), y: centerY },           // 下家 (右侧)
      { x: px(88, this), y: centerY },                    // 上家 (左侧)
    ]

    // 创建 54 张牌背面，全部从桌面中央开始
    const deck = this.gameState.deck
    deck.forEach((card) => {
      const cs = new CardSprite({ scene: this, x: centerX, y: centerY, card, faceUp: false })
      this.cards.push(cs)
    })

    // 发牌动画
    deck.forEach((_card, i) => {
      if (i >= 51) {
        // 3 张底牌：留在中央区域
        const bottomOffsetX = (i - 51 - 1) * px(55, this)
        this.tweens.add({
          targets: this.cards[i],
          x: centerX + bottomOffsetX,
          y: centerY - px(40, this),
          duration: 100,
          delay: i * 30,
        })
        return
      }

      const targetIdx = (i % 3) as PlayerPosition
      const t = targets[targetIdx]
      const cardInHand = Math.floor(i / 3)
      // 侧边牌使用更紧凑的间距
      const spacing = targetIdx === 0 ? px(36, this) : px(6, this)
      const offsetX = targetIdx === 1
        ? -cardInHand * spacing  // 下家向左堆叠
        : targetIdx === 2
          ? cardInHand * spacing // 上家向右堆叠
          : (cardInHand - 8) * spacing // 玩家居中

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
    // "底牌" 标签
    const { width } = this.cameras.main
    this.add.text(width / 2, this.cameras.main.height / 2 - px(70, this), "底牌", {
      fontSize: `${px(14, this)}px`,
      color: "#aaaaaa",
    }).setOrigin(0.5)

    // 翻转 3 张底牌
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
    this.gameState = assignLandlord(this.gameState, 0)
    this.scene.start("PlayScene", { gameState: this.gameState })
  }
}
