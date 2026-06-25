import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" })
  }

  create() {
    const { width, height } = this.cameras.main

    // 背景
    if (this.textures.exists("bg-table")) {
      this.add.image(width / 2, height / 2, "bg-table").setDisplaySize(width, height)
    } else {
      this.cameras.main.setBackgroundColor("#1a6b3c")
    }

    // 标题
    this.add
      .text(width / 2, height * 0.25, "斗地主", {
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    // 副标题
    this.add
      .text(width / 2, height * 0.35, "与 AI 对战 · DeepSeek 驱动", {
        fontSize: "20px",
        color: "#cccccc",
      })
      .setOrigin(0.5)

    // 开始按钮
    const btn = this.add
      .text(width / 2, height * 0.55, "[ 开始游戏 ]", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 32, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    btn.on("pointerover", () => btn.setScale(1.05))
    btn.on("pointerout", () => btn.setScale(1))
    btn.on("pointerdown", () => {
      this.scene.start("DealingScene")
    })

    // 返回社区按钮
    const backBtn = this.add
      .text(width / 2, height * 0.7, "← 返回社区", {
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    backBtn.on("pointerdown", () => {
      window.location.href = "/"
    })
  }
}
