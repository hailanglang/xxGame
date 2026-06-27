// src/game/doudizhu/ui/HandFan.ts
import Phaser from "phaser"
import { CardSprite, CARD_BASE_WIDTH } from "./Card"
import { Card } from "../logic/types"
import { px } from "../utils/scale"

/**
 * 扇形手牌容器
 *
 * 将手牌排列为横向扇形布局，支持选中/取消选中交互。
 * 牌间距根据手牌数量自动调整，参考 Figma 设计（重叠约 60% 卡片宽度）。
 *
 * @param scene 所属 Phaser 场景
 * @param x     容器中心 x 坐标
 * @param y     容器中心 y 坐标
 */
export class HandFan extends Phaser.GameObjects.Container {
  private cards: CardSprite[] = []

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    scene.add.existing(this)
  }

  setHand(hand: Card[], interactive = true) {
    this.removeAll(true)
    this.cards = []

    if (hand.length === 0) return

    const cardWidth = px(CARD_BASE_WIDTH, this.scene)
    // Figma 设计：20 张手牌时 cardWidth=92, overlap=56 → overlap ≈ cardWidth × 0.6
    // 牌多时紧凑，牌少时宽松
    const overlapRatio = hand.length > 17 ? 0.55 : hand.length > 10 ? 0.6 : 0.7
    const overlap = Math.round(cardWidth * overlapRatio)
    const totalWidth = (hand.length - 1) * overlap + cardWidth
    const startX = -totalWidth / 2

    hand.forEach((card, i) => {
      const cs = new CardSprite(this.scene, startX + i * overlap + cardWidth / 2, 0, card, true)
      if (interactive) {
        cs.on("pointerdown", () => cs.toggleSelect())
      }
      this.cards.push(cs)
      this.add(cs)
    })
  }

  getSelectedCards(): Card[] {
    return this.cards.filter((c) => c.isSelected).map((c) => c.cardData)
  }

  deselectAll() {
    this.cards.forEach((c) => c.deselect())
  }

  getCards(): CardSprite[] {
    return this.cards
  }
}
