// src/game/doudizhu/ui/PlayerAvatar.ts
import Phaser from "phaser"

export class PlayerAvatar extends Phaser.GameObjects.Container {
  private nameText: Phaser.GameObjects.Text
  private cardCountText: Phaser.GameObjects.Text
  private avatarBg: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, isLandlord: boolean) {
    super(scene, x, y)

    this.avatarBg = scene.add.graphics()
    this.avatarBg.fillStyle(isLandlord ? 0xd4a017 : 0x333333, 1)
    this.avatarBg.fillCircle(0, 0, 24)
    this.add(this.avatarBg)

    this.nameText = scene.add.text(30, -10, name, { fontSize: "14px", color: "#ffffff" })
    this.add(this.nameText)

    this.cardCountText = scene.add.text(30, 8, "17 张", { fontSize: "12px", color: "#cccccc" })
    this.add(this.cardCountText)

    // 地主标志
    if (isLandlord) {
      const badge = scene.add.text(0, -30, "地主", {
        fontSize: "11px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5)
      this.add(badge)
    }

    scene.add.existing(this)
  }

  setCardCount(n: number) {
    this.cardCountText.setText(`${n} 张`)
  }
}
