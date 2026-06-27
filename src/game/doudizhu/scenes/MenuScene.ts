import Phaser from "phaser"
import { px } from "../utils/scale"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" })
  }

  create() {
    // 菜单页静态内容，降帧率省 CPU
    this.game.loop.targetFps = 30
    this.events.once("shutdown", () => {
      this.game.loop.targetFps = 60
    })

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
        fontSize: `${px(96, this)}px`,
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: px(4, this),
      })
      .setOrigin(0.5)

    // 副标题
    this.add
      .text(width / 2, height * 0.35, "与 AI 对战", {
        fontSize: `${px(20, this)}px`,
        color: "#cccccc",
      })
      .setOrigin(0.5)

    // 开始按钮
    const btn = this.add
      .text(width / 2, height * 0.55, "[ 开始游戏 ]", {
        fontSize: `${px(32, this)}px`,
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: px(32, this), y: px(12, this) },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    btn.on("pointerover", () => btn.setScale(1.05))
    btn.on("pointerout", () => btn.setScale(1))
    btn.on("pointerdown", () => {
      this.scene.start("DealingScene")
    })

    // 调试按钮
    this.add
      .text(width / 2, height * 0.7, "[ 牌面调试 ]", {
        fontSize: `${px(16, this)}px`,
        color: "#888888",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("DebugScene")
      })

    // 返回社区按钮
    const backBtn = this.add
      .text(width / 2, height * 0.78, "← 返回社区", {
        fontSize: `${px(48, this)}px`,
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    backBtn.on("pointerdown", () => {
      window.location.href = "/"
    })
  }
}
