import Phaser from "phaser"
import { px } from "../utils/scale"
import { CARD_BASE_HEIGHT, CARD_BASE_WIDTH, CardSprite } from "../ui/Card"
import { Rank, Suit } from "../logic/types"

/**
 * 主菜单场景
 *
 * 游戏首页，展示"斗地主"标题和装饰性卡牌。提供"开始游戏"按钮进入发牌场景，
 * 以及"返回社区"链接跳回 XXGame 首页。进入时降帧至 30fps 以节省 CPU。
 */
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

    new Array(15).fill(null).forEach((item,ind) =>{
      const suits = [Suit.Spades, Suit.Hearts, Suit.Clubs, Suit.Diamonds]

      // 装饰卡片（大王）
      const limitInd = ind % 8
      const card = {
        scene: this,
        x: px(100 + limitInd * (CARD_BASE_WIDTH + 10),this),
        y: px(100 + (ind > 7 ? CARD_BASE_HEIGHT + 10 : 0),this),
        card: { id: ind, suit: ind <= 12 ? suits[ind % 4] : null, rank: ind + 3 as Rank },
        faceUp: true
      }
      console.log('card.card', card.card)
      new CardSprite(card)
    })


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

    // 返回社区按钮
    const backBtn = this.add
      .text(width / 2, height * 0.7, "← 返回社区", {
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
