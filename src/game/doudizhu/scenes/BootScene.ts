import Phaser from "phaser"

/**
 * 启动场景
 *
 * 游戏初始化入口。负责加载外部资源（图片、音效），并在资源缺失时自动生成
 * 占位纹理（card-back / bg-table），确保后续场景正常运行。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" })
  }

  preload() {
    // 尝试加载外部资源（文件可能不存在，会 404 但不影响运行）
    this.load.image("bg-table", "/game/doudizhu/bg-table.png")
    this.load.image("card-back", "/game/doudizhu/card-back.png")

    // 音效（暂无实际文件）
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
    // 生成占位纹理（外部资源加载失败时的 fallback）
    this.generatePlaceholderTextures()
    this.scene.start("MenuScene")
  }

  /** 生成占位纹理，供外部资源缺失时使用 */
  private generatePlaceholderTextures() {
    // card-back: 深蓝色圆角矩形 + 白色边框
    if (!this.textures.exists("card-back")) {
      const g = this.add.graphics()
      g.fillStyle(0x1565c0, 1)
      g.fillRoundedRect(0, 0, 71, 96, 4)
      g.lineStyle(2, 0x0d47a1, 1)
      g.strokeRoundedRect(1, 1, 69, 94, 4)
      g.generateTexture("card-back", 71, 96)
      g.destroy()
    }

    // bg-table: 绿色 1x1 像素纹理（MenuScene 会 fallback 到背景色，但提供纹理更干净）
    if (!this.textures.exists("bg-table")) {
      const g = this.add.graphics()
      g.fillStyle(0x1a6b3c, 1)
      g.generateTexture("bg-table", 1, 1)
      g.destroy()
    }
  }
}
