// src/game/doudizhu/ui/Card.ts
import Phaser from "phaser"
import { Card as CardData, RANK_NAMES } from "../logic/types"
import { px } from "../utils/scale"

/** 牌面基准尺寸 (设计宽度 1280px) */
export const CARD_BASE_WIDTH = 106
export const CARD_BASE_HEIGHT = 144

/**
 * 扑克牌精灵
 *
 * 一张可交互的牌，支持牌面/牌背两种状态、选中高亮、翻转动画。
 * 尺寸通过 px() 基于摄像机宽度等比缩放。
 *
 * @param scene  所属 Phaser 场景
 * @param x      初始 x 坐标
 * @param y      初始 y 坐标
 * @param card   牌数据 (id, suit, rank)
 * @param faceUp true=牌面朝上，false=牌背朝上
 */
export class CardSprite extends Phaser.GameObjects.Container {
  public cardData: CardData
  public isSelected = false

  private cardW: number
  private cardH: number
  private bg: Phaser.GameObjects.Rectangle
  private label!: Phaser.GameObjects.Text
  private back: Phaser.GameObjects.Image | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, card: CardData, faceUp = true) {
    super(scene, x, y)
    this.cardData = card
    this.cardW = px(106, scene)
    this.cardH = px(144, scene)

    // 牌面背景
    this.bg = scene.add
      .rectangle(0, 0, this.cardW, this.cardH, 0xffffff, 1)
      .setStrokeStyle(px(2, scene), 0x333333)
    this.add(this.bg)

    if (faceUp && card.suit) {
      const suitColor = card.suit === "h" || card.suit === "d" ? 0xcc0000 : 0x000000
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      this.label = scene.add
        .text(-this.cardW / 2 + px(9, scene), -this.cardH / 2 + px(6, scene), `${RANK_NAMES[card.rank]}${suitSymbol[card.suit]}`, {
          fontSize: `${px(24, scene)}px`,
          color: suitColor === 0xcc0000 ? "#cc0000" : "#000000",
        })
        .setOrigin(0, 0)
      this.add(this.label)
    } else if (faceUp && !card.suit) {
      // 王
      this.label = scene.add
        .text(0, 0, card.rank === 17 ? "大王" : "小王", {
          fontSize: `${px(20, scene)}px`,
          color: card.rank === 17 ? "#cc0000" : "#000000",
        })
        .setOrigin(0.5)
      this.add(this.label)
    } else {
      // 牌背
      this.back = scene.add.image(0, 0, "card-back")
      if (this.back) this.back.setDisplaySize(this.cardW - px(6, scene), this.cardH - px(6, scene))
      this.add(this.back)
    }

    this.setSize(this.cardW, this.cardH)
    this.setInteractive({ useHandCursor: true })
    scene.add.existing(this)
  }

  /** 翻转为牌面 (用于发牌动画后的底牌翻转) */
  showFace() {
    if (this.label) return
    if (!this.back) return

    this.back.destroy()
    this.back = null

    if (this.cardData.suit) {
      const suitColor = this.cardData.suit === "h" || this.cardData.suit === "d" ? 0xcc0000 : 0x000000
      const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
      this.label = this.scene.add
        .text(-this.cardW / 2 + px(9, this.scene), -this.cardH / 2 + px(6, this.scene), `${RANK_NAMES[this.cardData.rank]}${suitSymbol[this.cardData.suit]}`, {
          fontSize: `${px(24, this.scene)}px`,
          color: suitColor === 0xcc0000 ? "#cc0000" : "#000000",
        })
        .setOrigin(0, 0)
      this.add(this.label)
    } else {
      this.label = this.scene.add
        .text(0, 0, this.cardData.rank === 17 ? "大王" : "小王", {
          fontSize: `${px(20, this.scene)}px`,
          color: this.cardData.rank === 17 ? "#cc0000" : "#000000",
        })
        .setOrigin(0.5)
      this.add(this.label)
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
