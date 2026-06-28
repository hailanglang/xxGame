import Phaser from "phaser"
import { GameState, RANK_NAMES } from "../logic/types"
import { px } from "../utils/scale"

/**
 * 结算场景
 *
 * 展示游戏结果（胜利/失败）、各家剩余手牌统计以及 Token 用量提示。
 * 提供"再来一局"和"返回主菜单"按钮，方便快速重开。
 */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: "ResultScene" })
  }

  create(data: { gameState: GameState }) {
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor("#1a6b3c")

    const gs = data.gameState
    const isHumanWin = gs.winner === 0

    // 结果文字
    const resultText = isHumanWin ? "🎉 你赢了！" : "😞 你输了"
    this.add
      .text(width / 2, height * 0.3, resultText, {
        fontSize: `${px(48, this)}px`,
        color: isHumanWin ? "#ffd700" : "#ff4444",
        stroke: "#000000",
        strokeThickness: px(4, this),
      })
      .setOrigin(0.5)

    // 统计信息
    const names = ["我", "下家", "上家"]
    const info = gs.hands
      .map((h, i) => `${names[i]}: ${h.length} 张`)
      .join("  |  ")
    this.add
      .text(width / 2, height * 0.45, info, {
        fontSize: `${px(18, this)}px`,
        color: "#cccccc",
      })
      .setOrigin(0.5)

    // Token 用量提示
    this.add
      .text(width / 2, height * 0.52, "Token 用量详情请查看游戏外设置面板", {
        fontSize: `${px(14, this)}px`,
        color: "#888888",
      })
      .setOrigin(0.5)

    // 再来一局
    const replayBtn = this.add
      .text(width / 2, height * 0.65, "[ 再来一局 ]", {
        fontSize: `${px(28, this)}px`,
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: px(24, this), y: px(10, this) },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("DealingScene"))

    // 返回菜单
    this.add
      .text(width / 2, height * 0.78, "返回主菜单", {
        fontSize: `${px(18, this)}px`,
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("MenuScene"))
  }
}
