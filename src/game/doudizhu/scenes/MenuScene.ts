import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" })
  }

  create() {
    // Placeholder — will be implemented in a later task
    this.add.text(640, 360, "斗地主", { fontSize: "48px", color: "#ffffff" }).setOrigin(0.5)
  }
}
