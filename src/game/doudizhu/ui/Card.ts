// src/game/doudizhu/ui/Card.ts
import Phaser from "phaser"
import { Card as CardData, RANK_NAMES } from "../logic/types"
import { px } from "../utils/scale"

/** 手牌尺寸 (设计宽度 1280px) */
export const CARD_BASE_WIDTH = 92
export const CARD_BASE_HEIGHT = 136

/** 出牌展示区小牌尺寸 (底牌 / 已出牌) */
export const CARD_SMALL_WIDTH = 76
export const CARD_SMALL_HEIGHT = 112

/** 牌背尺寸 */
export const CARD_BACK_WIDTH = 72
export const CARD_BACK_HEIGHT = 108

/** CardSprite 构造参数 */
export interface CardSpriteOptions {
  scene: Phaser.Scene
  x: number
  y: number
  card: CardData
  faceUp?: boolean
  isSmall?: boolean
}

/**
 * 扑克牌精灵
 *
 * 一张可交互的牌，支持牌面/牌背两种状态、选中高亮、翻转动画。
 * 尺寸通过 px() 基于摄像机宽度等比缩放。
 * 牌面布局：左上角 rank+suit，中央 suit 大花
 */
export class CardSprite extends Phaser.GameObjects.Container {
  public cardData: CardData
  public isSelected = false

  private cardW: number
  private cardH: number
  private bg: Phaser.GameObjects.Rectangle
  private label!: Phaser.GameObjects.Text
  private centerSuit!: Phaser.GameObjects.Text | null
  private backDecoration: Phaser.GameObjects.Rectangle | null = null

  constructor({ scene, x, y, card, faceUp = true, isSmall = false }: CardSpriteOptions) {
    super(scene, x, y)
    this.cardData = card

    const baseW = isSmall ? CARD_SMALL_WIDTH : CARD_BASE_WIDTH
    const baseH = isSmall ? CARD_SMALL_HEIGHT : CARD_BASE_HEIGHT
    this.cardW = px(baseW, scene)
    this.cardH = px(baseH, scene)

    // 白色圆角牌面背景 + 细边框
    this.bg = scene.add
      .rectangle(0, 0, this.cardW, this.cardH, 0xffffff, 1)
      .setStrokeStyle(px(1.5, scene), 0x999999)
    this.add(this.bg)

    if (faceUp && card.suit) {
      const isRed = card.suit === "h" || card.suit === "d"
      const suitColor = isRed ? "#cc0000" : "#000000"
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      const rankStr = RANK_NAMES[card.rank]
      const suitStr = suitSymbol[card.suit]
      const rankFontSize = isSmall ? px(16, scene) : px(22, scene)
      const centerSuitSize = isSmall ? px(28, scene) : px(36, scene)
      const margin = isSmall ? px(5, scene) : px(8, scene)

      // 左上角 rank + suit
      this.label = scene.add
        .text(-this.cardW / 2 + margin, -this.cardH / 2 + margin, `${rankStr}${suitStr}`, {
          fontSize: `${rankFontSize}px`,
          color: suitColor,
          fontStyle: "bold",
        })
        .setOrigin(0, 0)
      this.add(this.label)

      // 中央大花色
      this.centerSuit = scene.add
        .text(0, 0, suitStr, {
          fontSize: `${centerSuitSize}px`,
          color: suitColor,
        })
        .setOrigin(0.5)
      this.add(this.centerSuit)

    } else if (faceUp && !card.suit) {
      // 王
      const isRed = card.rank === 17
      const label = card.rank === 17 ? "大王" : "小王"
      const fontSize = isSmall ? px(16, scene) : px(20, scene)
      this.label = scene.add
        .text(0, 0, label, {
          fontSize: `${fontSize}px`,
          color: isRed ? "#cc0000" : "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
      this.add(this.label)
      this.centerSuit = null
    } else {
      // 牌背 — 深色底 + 浅色边框
      this.bg.setFillStyle(0x1a3c6b, 1)
      this.bg.setStrokeStyle(px(2, scene), 0x2a5c9b)
      // 牌背花纹：内部浅色矩形
      const innerMargin = px(4, scene)
      this.backDecoration = scene.add
        .rectangle(0, 0, this.cardW - innerMargin * 2, this.cardH - innerMargin * 2, 0x2255aa, 1)
        .setStrokeStyle(px(1, scene), 0x3a7dcc)
      this.add(this.backDecoration)
      this.centerSuit = null
    }

    this.setSize(this.cardW, this.cardH)
    this.setInteractive({ useHandCursor: true })
    scene.add.existing(this)
  }

  /** 翻转为牌面 (用于发牌动画后的底牌翻转) */
  showFace() {
    if (this.label) return // 已经是牌面了
    // 清理牌背装饰
    if (this.backDecoration) {
      this.backDecoration.destroy()
      this.backDecoration = null
    }
    if (this.bg) {
      this.bg.setFillStyle(0xffffff, 1)
      this.bg.setStrokeStyle(px(1.5, this.scene), 0x999999)
    }
    this.createFaceContent()
  }

  private createFaceContent() {
    const card = this.cardData
    if (card.suit) {
      const isRed = card.suit === "h" || card.suit === "d"
      const suitColor = isRed ? "#cc0000" : "#000000"
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      const rankStr = RANK_NAMES[card.rank]
      const suitStr = suitSymbol[card.suit]
      const margin = px(8, this.scene)

      this.label = this.scene.add
        .text(-this.cardW / 2 + margin, -this.cardH / 2 + margin, `${rankStr}${suitStr}`, {
          fontSize: `${px(22, this.scene)}px`,
          color: suitColor,
          fontStyle: "bold",
        })
        .setOrigin(0, 0)
      this.add(this.label)

      this.centerSuit = this.scene.add
        .text(0, 0, suitStr, {
          fontSize: `${px(36, this.scene)}px`,
          color: suitColor,
        })
        .setOrigin(0.5)
      this.add(this.centerSuit)
    } else {
      const isRed = card.rank === 17
      const label = card.rank === 17 ? "大王" : "小王"
      this.label = this.scene.add
        .text(0, 0, label, {
          fontSize: `${px(20, this.scene)}px`,
          color: isRed ? "#cc0000" : "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
      this.add(this.label)
      this.centerSuit = null
    }
  }

  toggleSelect() {
    this.isSelected = !this.isSelected
    this.y += this.isSelected ? -px(30, this.scene) : px(30, this.scene)
  }

  deselect() {
    if (this.isSelected) {
      this.isSelected = false
      this.y += px(30, this.scene)
    }
  }
}
