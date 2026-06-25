import Phaser from "phaser"

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" })
  }

  preload() {
    // 加载资源
    this.load.image("bg-table", "/game/doudizhu/bg-table.png")
    this.load.atlas("cards", "/game/doudizhu/cards.png", "/game/doudizhu/cards.json")
    this.load.image("card-back", "/game/doudizhu/card-back.png")
    this.load.image("avatar-frame", "/game/doudizhu/avatar.png")

    // 音效
    this.load.audio("sfx-deal", "/game/doudizhu/sfx/deal.mp3")
    this.load.audio("sfx-play", "/game/doudizhu/sfx/play.mp3")
    this.load.audio("sfx-bomb", "/game/doudizhu/sfx/bomb.mp3")
    this.load.audio("sfx-win", "/game/doudizhu/sfx/win.mp3")
    this.load.audio("sfx-lose", "/game/doudizhu/sfx/lose.mp3")

    // 加载进度条
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const bar = this.add.graphics()
    this.load.on("progress", (v: number) => {
      bar.clear()
      bar.fillStyle(0xffffff, 0.8)
      bar.fillRect(width / 2 - 150, height / 2 - 8, 300 * v, 16)
    })
    this.load.on("complete", () => bar.destroy())
  }

  create() {
    this.scene.start("MenuScene")
  }
}
