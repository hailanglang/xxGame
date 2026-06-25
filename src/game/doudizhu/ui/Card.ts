// src/game/doudizhu/ui/Card.ts
import Phaser from "phaser"
import { Card as CardData, RANK_NAMES } from "../logic/types"

const CARD_WIDTH = 71
const CARD_HEIGHT = 96

export class CardSprite extends Phaser.GameObjects.Container {
  public cardData: CardData
  public isSelected = false

  private bg: Phaser.GameObjects.Rectangle
  private label!: Phaser.GameObjects.Text
  private back: Phaser.GameObjects.Image | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, card: CardData, faceUp = true) {
    super(scene, x, y)
    this.cardData = card

    // 牌面背景
    this.bg = scene.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 1)
      .setStrokeStyle(1, 0x333333)
    this.add(this.bg)

    if (faceUp && card.suit) {
      const suitColor = card.suit === "h" || card.suit === "d" ? 0xcc0000 : 0x000000
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      this.label = scene.add
        .text(-CARD_WIDTH / 2 + 6, -CARD_HEIGHT / 2 + 4, `${RANK_NAMES[card.rank]}${suitSymbol[card.suit]}`, {
          fontSize: "16px",
          color: suitColor === 0xcc0000 ? "#cc0000" : "#000000",
        })
        .setOrigin(0, 0)
      this.add(this.label)
    } else if (faceUp && !card.suit) {
      // 王
      this.label = scene.add
        .text(0, 0, card.rank === 17 ? "大王" : "小王", {
          fontSize: "14px",
          color: card.rank === 17 ? "#cc0000" : "#000000",
        })
        .setOrigin(0.5)
      this.add(this.label)
    } else {
      // 牌背
      this.back = scene.add.image(0, 0, "card-back")
      if (this.back) this.back.setDisplaySize(CARD_WIDTH - 4, CARD_HEIGHT - 4)
      this.add(this.back)
    }

    this.setSize(CARD_WIDTH, CARD_HEIGHT)
    this.setInteractive({ useHandCursor: true })
    scene.add.existing(this)
  }

  /** 翻转为牌面 (用于发牌动画后的底牌翻转) */
  showFace() {
    if (this.label) return // already face up
    if (!this.back) return

    // 移除牌背
    this.back.destroy()
    this.back = null

    // 根据牌面信息创建文字
    if (this.cardData.suit) {
      const suitColor = this.cardData.suit === "h" || this.cardData.suit === "d" ? 0xcc0000 : 0x000000
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      this.label = this.scene.add
        .text(-CARD_WIDTH / 2 + 6, -CARD_HEIGHT / 2 + 4, `${RANK_NAMES[this.cardData.rank]}${suitSymbol[this.cardData.suit]}`, {
          fontSize: "16px",
          color: suitColor === 0xcc0000 ? "#cc0000" : "#000000",
        })
        .setOrigin(0, 0)
      this.add(this.label)
    } else {
      this.label = this.scene.add
        .text(0, 0, this.cardData.rank === 17 ? "大王" : "小王", {
          fontSize: "14px",
          color: this.cardData.rank === 17 ? "#cc0000" : "#000000",
        })
        .setOrigin(0.5)
      this.add(this.label)
    }
  }

  toggleSelect() {
    this.isSelected = !this.isSelected
    this.y += this.isSelected ? -20 : 20
  }

  deselect() {
    if (this.isSelected) {
      this.isSelected = false
      this.y += 20
    }
  }
}
