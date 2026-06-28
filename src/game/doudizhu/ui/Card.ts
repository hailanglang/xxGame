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
 * 牌面布局：非王牌仅中央花色 icon，王在左上角显示文字。
 * 圆角矩形背景，符合真实扑克牌视觉风格。
 */
export class CardSprite extends Phaser.GameObjects.Container {
  public cardData: CardData
  public isSelected = false

  private cardW: number
  private cardH: number
  private bg: Phaser.GameObjects.Graphics
  private label: Phaser.GameObjects.Text | null = null
  private centerSuit: Phaser.GameObjects.Text | null = null
  private backDecoration: Phaser.GameObjects.Rectangle | null = null
  private _isSmall: boolean

  constructor({ scene, x, y, card, faceUp = true, isSmall = false }: CardSpriteOptions) {
    super(scene, x, y)
    this.cardData = card
    this._isSmall = isSmall

    const baseW = isSmall ? CARD_SMALL_WIDTH : CARD_BASE_WIDTH
    const baseH = isSmall ? CARD_SMALL_HEIGHT : CARD_BASE_HEIGHT
    this.cardW = px(baseW, scene)
    this.cardH = px(baseH, scene)

    // 圆角背景 (Graphics 支持 fillRoundedRect)
    this.bg = scene.add.graphics()
    this.add(this.bg)

    if (faceUp) {
      this.drawFaceBackground(scene)
      this.createFaceContent()
    } else {
      this.drawBackBackground(scene)
    }

    this.setSize(this.cardW, this.cardH)
    this.setInteractive({ useHandCursor: true })
    scene.add.existing(this)
  }

  /** 绘制牌面白色圆角背景 */
  private drawFaceBackground(scene: Phaser.Scene) {
    const r = px(12, scene)
    this.bg.clear()
    this.bg.fillStyle(0xffffff, 1)
    this.bg.fillRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, r)
    this.bg.lineStyle(px(1, scene), 0x999999, 1)
    this.bg.strokeRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, r)
  }

  /** 绘制牌背蓝色圆角背景 + 花纹 */
  private drawBackBackground(scene: Phaser.Scene) {
    const r = px(8, scene)
    this.bg.clear()
    this.bg.fillStyle(0x1a3c6b, 1)
    this.bg.fillRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, r)
    this.bg.lineStyle(px(2, scene), 0x2a5c9b, 1)
    this.bg.strokeRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, r)
    // 牌背花纹：内部浅色矩形
    const innerMargin = px(4, scene)
    this.backDecoration = scene.add
      .rectangle(0, 0, this.cardW - innerMargin * 2, this.cardH - innerMargin * 2, 0x2255aa, 1)
      .setStrokeStyle(px(1, scene), 0x3a7dcc)
    this.add(this.backDecoration)
  }

  /** 创建牌面内容 (花色 / 王文字) — 构造和翻转共用 */
  private createFaceContent() {
    const card = this.cardData
    const margin = px(8, this.scene)

    if (card.suit) {
      // 非王牌：左上角数字 + 中央花色 icon
      const isRed = card.suit === "h" || card.suit === "d"
      const suitColor = isRed ? "#cc0000" : "#000000"
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      const suitStr = suitSymbol[card.suit]
      const rankStr = RANK_NAMES[card.rank]
      const rankFontSize = this._isSmall ? px(16, this.scene) : px(36, this.scene)
      const centerSuitSize = this._isSmall ? px(28, this.scene) : px(48, this.scene)

      // 左上角仅数字 (无花色)
      this.label = this.scene.add
        .text(-this.cardW / 2 + margin, -this.cardH / 2 + margin, rankStr, {
          fontSize: `${rankFontSize}px`,
          color: suitColor,
          fontStyle: "bold",
        })
        .setOrigin(0, 0)
      this.add(this.label)

      // 中央大花色
      this.centerSuit = this.scene.add
        .text(0, 0, suitStr, {
          fontSize: `${centerSuitSize}px`,
          color: suitColor,
        })
        .setOrigin(0.5)
      this.add(this.centerSuit)
    } else {
      // 王：左上角文字，和数字牌位置对齐
      const isRed = card.rank === 17
      const labelText = card.rank === 17 ? "大" : "小"
      const fontSize = this._isSmall ? px(16, this.scene) : px(28, this.scene)

      this.label = this.scene.add
        .text(-this.cardW / 2 + margin, -this.cardH / 2 + margin, labelText, {
          fontSize: `${fontSize}px`,
          color: isRed ? "#cc0000" : "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0, 0)
      this.add(this.label)
      this.centerSuit = null
    }
  }

  /** 翻转为牌面（用于发牌动画后的底牌翻转） */
  showFace() {
    if (this.label || this.centerSuit) return // 已经是牌面了
    // 清理牌背装饰
    if (this.backDecoration) {
      this.backDecoration.destroy()
      this.backDecoration = null
    }
    // 重新绘制白色圆角背景
    this.drawFaceBackground(this.scene)
    // 创建牌面内容
    this.createFaceContent()
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
