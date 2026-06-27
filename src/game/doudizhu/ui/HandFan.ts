// src/game/doudizhu/ui/HandFan.ts
import Phaser from "phaser"
import { CardSprite, CARD_BASE_WIDTH } from "./Card"
import { Card } from "../logic/types"
import { px } from "../utils/scale"

/**
 * 扇形手牌容器
 *
 * 将手牌排列为横向扇形布局，支持选中/取消选中交互。
 * 牌间距根据手牌数量自动调整（>10 张较紧凑，≤10 张较宽松）。
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

    const cardWidth = px(CARD_BASE_WIDTH, this.scene)
    const overlap = hand.length > 10 ? px(30, this.scene) : px(42, this.scene)
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
}
