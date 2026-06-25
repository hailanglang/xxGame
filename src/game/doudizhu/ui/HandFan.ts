// src/game/doudizhu/ui/HandFan.ts
import Phaser from "phaser"
import { CardSprite } from "./Card"
import { Card } from "../logic/types"

export class HandFan extends Phaser.GameObjects.Container {
  private cards: CardSprite[] = []

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    scene.add.existing(this)
  }

  setHand(hand: Card[], interactive = true) {
    this.removeAll(true)
    this.cards = []

    const cardWidth = 71
    const overlap = hand.length > 10 ? 20 : 28
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
