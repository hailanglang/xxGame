// src/game/doudizhu/scenes/PlayScene.ts
import Phaser from "phaser"
import type { GameState, Card, Combo, PlayerPosition } from "../logic/types"
import { px } from "../utils/scale"
import { ComboType } from "../logic/types"
import { recognizeCombo } from "../logic/rules"
import { canBeat } from "../logic/compare"
import { HandFan } from "../ui/HandFan"
import { CardSprite, CARD_BACK_WIDTH, CARD_BACK_HEIGHT } from "../ui/Card"
import { PlayerAvatar } from "../ui/PlayerAvatar"
import { Countdown } from "../ui/Countdown"
import { ParticleEffects } from "../ui/ParticleEffects"
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  parseAiResponse,
  validateAiPlay,
  type AiDecision,
} from "../logic/ai-schema"
import { dsApi } from "@/lib/api-client"
import { useGameStore } from "@/stores/game-store"

export class PlayScene extends Phaser.Scene {
  private gameState!: GameState
  private myHand!: HandFan
  private avatars!: PlayerAvatar[]
  private lastPlayCards!: (Phaser.GameObjects.Container | null)[]
  private bottomCardsContainer!: Phaser.GameObjects.Container // 底牌展示
  private countdown!: Countdown
  private particles!: ParticleEffects
  private currentTurnAction: (() => void) | null = null
  private panelBacks!: (Phaser.GameObjects.Graphics | null)[] // 左右面板的牌背堆叠

  constructor() {
    super({ key: "PlayScene" })
  }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState
    this.currentTurnAction = null
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor("#1a6b3c")

    this.gameState.phase = "playing"

    // ---- 出牌区 ----
    this.lastPlayCards = [null, null, null]
    this.panelBacks = [null, null]

    // ---- 左侧面板 (上家) ----
    this.createSidePanel(0, 2)

    // ---- 右侧面板 (下家) ----
    this.createSidePanel(1, 1)

    // ---- 中央底牌区 ----
    this.createBottomCards()

    // ---- 玩家信息 (底部) ----
    this.avatars = [
      new PlayerAvatar({ scene: this, x: px(24, this), y: height - px(250, this), avatarChar: "我", displayName: "你（农民）", cardCount: this.gameState.hands[0].length, isLandlord: this.gameState.landlord === 0, layout: "left" }),
      new PlayerAvatar({ scene: this, x: width - px(24, this), y: px(24, this), avatarChar: "李", displayName: "AI 李四", cardCount: this.gameState.hands[1].length, isLandlord: this.gameState.landlord === 1, layout: "right" }),
      new PlayerAvatar({ scene: this, x: px(24, this), y: px(24, this), avatarChar: "张", displayName: "AI 张三", cardCount: this.gameState.hands[2].length, isLandlord: this.gameState.landlord === 2, layout: "left" }),
    ]

    // ---- 我的手牌 ----
    this.myHand = new HandFan({ scene: this, x: width / 2, y: height - px(70, this) })
    this.myHand.setHand(this.gameState.hands[0], true)

    // ---- 操作按钮 (底部居中) ----
    const btnY = height - px(12, this)
    const btnGap = px(120, this)

    // 不出
    this.createButton(width / 2 - btnGap, btnY, "不出", 0x666666, () => this.onHumanPass())
    // 出牌
    this.createButton(width / 2, btnY, "出牌", 0xd4a017, () => this.onHumanPlay())
    // 提示
    this.createButton(width / 2 + btnGap, btnY, "提示", 0x666666, () => this.onHumanHint())

    // ---- 倒计时 ----
    this.countdown = new Countdown({ scene: this, x: width / 2 - px(80, this), y: height - px(170, this), width: px(160, this), onTimeout: () => {
      this.onHumanTimeout()
    } })

    // ---- 特效 ----
    this.particles = new ParticleEffects({ scene: this })

    // ---- 开始游戏 ----
    this.startTurn()
  }

  update(_time: number, delta: number) {
    this.countdown.update(delta)
  }

  // ==================== 布局辅助 ====================

  /** 创建侧边面板 (对手信息 + 牌背堆叠 + 出牌区) */
  private createSidePanel(playerIdx: PlayerPosition, panelSide: number) {
    const { width, height } = this.cameras.main
    const panelW = px(176, this)
    const isRight = panelSide === 1
    const panelX = isRight ? width - panelW : 0

    // 半透明面板底色
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x000000, 0.08)
    panelBg.fillRoundedRect(panelX, 0, panelW, height * 0.55, px(8, this))
    panelBg.setDepth(-1)

    // 牌背堆叠 (从上家/下家的 avatar 下方开始)
    const stackX = isRight ? panelX + panelW - px(10, this) : panelX + px(10, this)
    const stackY = px(65, this)
    const direction = isRight ? "left" : "right"
    const count = this.gameState.hands[playerIdx].length
    this.drawCardBackStack(stackX, stackY, count, direction)
  }

  /** 绘制对手牌背堆叠 */
  private drawCardBackStack(x: number, y: number, count: number, direction: "left" | "right") {
    const g = this.add.graphics()
    const w = px(CARD_BACK_WIDTH, this)
    const h = px(CARD_BACK_HEIGHT, this)
    const spacing = px(6, this)

    for (let i = 0; i < Math.min(count, 20); i++) {
      const cx = direction === "right" ? x + i * spacing : x - i * spacing
      g.fillStyle(0x1a3c6b, 1)
      g.fillRoundedRect(cx - w / 2, y - h / 2, w, h, px(3, this))
      g.lineStyle(px(1.5, this), 0x2a5c9b, 1)
      g.strokeRoundedRect(cx - w / 2, y - h / 2, w, h, px(3, this))
    }
    this.panelBacks.push(g)
  }

  /** 创建中央底牌区 */
  private createBottomCards() {
    const { width } = this.cameras.main
    const centerX = width / 2
    const topY = px(80, this)

    // "底牌" 标签
    this.add.text(centerX, topY - px(24, this), "底牌", {
      fontSize: `${px(14, this)}px`,
      color: "#aaaaaa",
    }).setOrigin(0.5)

    // 3 张底牌 (face up, small size)
    this.bottomCardsContainer = this.add.container(centerX, topY)
    const bottomCards = this.gameState.deck.slice(51, 54)
    const gap = px(60, this)
    const totalW = (bottomCards.length - 1) * gap
    bottomCards.forEach((card, i) => {
      const cs = new CardSprite({ scene: this, x: i * gap - totalW / 2, y: 0, card, faceUp: true, isSmall: false })
      this.bottomCardsContainer.add(cs)
    })
  }

  /** 创建操作按钮 */
  private createButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const btn = this.add.text(0, 0, label, {
      fontSize: `${px(18, this)}px`,
      color: "#ffffff",
      backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
      padding: { x: px(20, this), y: px(8, this) },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    btn.setPosition(x, y)
    btn.on("pointerover", () => btn.setScale(1.05))
    btn.on("pointerout", () => btn.setScale(1))
    btn.on("pointerdown", () => onClick())
    return btn
  }

  // ==================== 回合管理 ====================

  private startTurn() {
    // 更新所有玩家的手牌数量显示
    this.gameState.hands.forEach((hand, i) => {
      this.avatars[i].setCardCount(hand.length)
    })

    // 更新左右面板的牌背堆叠
    this.updatePanelBacks()

    if (this.gameState.phase === "finished") {
      this.scene.start("ResultScene", { gameState: this.gameState })
      return
    }

    if (this.gameState.currentPlayer === 0) {
      // 玩家回合：启动倒计时
      this.countdown.start(15)
    } else {
      // AI 回合：延迟后自动出牌
      this.countdown.stop()
      this.currentTurnAction = () => this.handleAiTurn()
      this.time.delayedCall(500, () => this.currentTurnAction?.())
    }
  }

  private updatePanelBacks() {
    // 销毁旧牌背
    this.panelBacks.forEach((g) => g?.destroy())
    this.panelBacks = []
    // 重新创建
    this.createSidePanel(0, 2)
    this.createSidePanel(1, 1)
  }

  // ==================== 玩家操作 ====================

  private onHumanPlay() {
    if (this.gameState.currentPlayer !== 0) return
    const selected = this.myHand.getSelectedCards()
    if (selected.length === 0) return

    const combo = recognizeCombo(selected)
    if (!combo) {
      this.showToast("无效牌型")
      return
    }
    if (this.gameState.lastPlay && !canBeat(combo, this.gameState.lastPlay.combo)) {
      this.showToast("打不过，请选择更大的牌")
      return
    }

    this.executePlay(0, selected, combo)
  }

  private onHumanPass() {
    if (this.gameState.currentPlayer !== 0) return
    if (!this.gameState.lastPlay || this.gameState.lastPlay.player === 0) {
      this.showToast("必须出牌")
      return
    }
    this.executePass(0)
  }

  private onHumanHint() {
    if (this.gameState.currentPlayer !== 0) return
    // 提示功能：高亮一个可以出的牌
    const hand = this.gameState.hands[0]
    const lastCombo = this.gameState.lastPlay?.combo ?? null

    // 尝试找最小的能出的牌型
    for (let len = 1; len <= Math.min(hand.length, 20); len++) {
      for (let i = 0; i <= hand.length - len; i++) {
        const subset = hand.slice(i, i + len)
        const combo = recognizeCombo(subset)
        if (combo && (!lastCombo || canBeat(combo, lastCombo))) {
          // 找到提示，高亮对应的手牌
          this.myHand.deselectAll()
          const cards = this.myHand.getCards()
          subset.forEach((card) => {
            const c = cards.find((cs) => cs.cardData.id === card.id)
            if (c) c.toggleSelect()
          })
          this.showToast("提示成功")
          return
        }
      }
    }
    this.showToast("没有能出的牌")
  }

  private onHumanTimeout() {
    if (this.gameState.currentPlayer !== 0) return
    if (!this.gameState.lastPlay || this.gameState.lastPlay.player === 0) {
      const minCard = this.gameState.hands[0][0]
      const combo = recognizeCombo([minCard])
      if (combo) {
        this.executePlay(0, [minCard], combo)
      } else {
        this.executePlay(0, [minCard], { type: ComboType.Single, mainRank: minCard.rank, length: 1, cards: [minCard] })
      }
    } else {
      this.executePass(0)
    }
  }

  // ==================== AI 回合 ====================

  private async handleAiTurn() {
    const player = this.gameState.currentPlayer
    const hand = this.gameState.hands[player]

    const decision = await this.callAi(player)
    if (!this.scene.isActive()) return

    if (!decision || decision.action === "pass") {
      const canPass = this.gameState.lastPlay && this.gameState.lastPlay.player !== player
      if (canPass) {
        this.executePass(player)
      } else {
        const minCard = hand[0]
        const combo = recognizeCombo([minCard])
        if (combo) this.executePlay(player, [minCard], combo)
      }
      return
    }

    const combo = validateAiPlay(
      hand,
      "play",
      decision.cards,
      this.gameState.lastPlay?.combo ?? null,
    )

    if (combo) {
      const selectedCards = hand.filter((c) => decision.cards.includes(c.id))
      this.executePlay(player, selectedCards, combo)
    } else {
      const fallback = this.findSmallestPlay(hand)
      if (fallback) {
        this.executePlay(player, fallback.cards, fallback)
      } else {
        this.executePass(player)
      }
    }
  }

  private async callAi(player: PlayerPosition): Promise<AiDecision | null> {
    try {
      const apiKey = useGameStore.getState().doudizhuApiKey
      if (!apiKey) {
        return this.fallbackAi(player)
      }

      const { content } = await dsApi(apiKey, [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: buildUserMessage(this.gameState, player) },
      ])

      return parseAiResponse(content)
    } catch {
      return this.fallbackAi(player)
    }
  }

  private fallbackAi(player: PlayerPosition): AiDecision {
    const hand = this.gameState.hands[player]
    const lastCombo = this.gameState.lastPlay?.combo ?? null

    if (!lastCombo || this.gameState.lastPlay?.player === player) {
      const combo = recognizeCombo([hand[0]])
      if (combo) {
        return { action: "play", cards: [hand[0].id], reason: "出最小牌" }
      }
    }

    const play = this.findSmallestPlay(hand)
    if (play) {
      return { action: "play", cards: play.cards.map((c) => c.id), reason: "出牌" }
    }

    return { action: "pass", cards: [], reason: "要不起" }
  }

  private findSmallestPlay(hand: Card[]): Combo | null {
    const lastCombo = this.gameState.lastPlay?.combo ?? null
    if (!lastCombo) {
      return recognizeCombo([hand[0]])
    }

    for (let len = 1; len <= Math.min(hand.length, 20); len++) {
      for (let i = 0; i <= hand.length - len; i++) {
        const subset = hand.slice(i, i + len)
        const combo = recognizeCombo(subset)
        if (combo && canBeat(combo, lastCombo)) return combo
      }
    }
    return null
  }

  // ==================== 执行出牌 ====================

  private executePlay(player: PlayerPosition, cards: Card[], combo: Combo) {
    const removedIds = new Set(cards.map((c) => c.id))
    const newHand = this.gameState.hands[player].filter((c) => !removedIds.has(c.id))
    this.gameState.hands[player] = newHand

    this.gameState.lastPlay = { player, combo }
    this.gameState.passCount = 0

    if (player === 0) {
      this.myHand.setHand(newHand, true)
    }
    this.avatars[player].setCardCount(newHand.length)

    this.showLastPlay(player, combo)

    if (combo.type === ComboType.Bomb || combo.type === ComboType.Rocket) {
      this.particles.playBomb(this.cameras.main.width / 2, this.cameras.main.height / 2)
    }

    if (newHand.length === 0) {
      this.gameState.winner = player
      this.gameState.phase = "finished"
      this.countdown.stop()
      this.time.delayedCall(1000, () => {
        this.scene.start("ResultScene", { gameState: this.gameState })
      })
      return
    }

    this.nextPlayer()
  }

  private executePass(player: PlayerPosition) {
    this.gameState.passCount++
    this.showLastPlay(player, null)

    if (this.gameState.passCount >= 2) {
      this.gameState.lastPlay = null
      this.gameState.passCount = 0
    }

    this.nextPlayer()
  }

  private nextPlayer() {
    this.gameState.currentPlayer = ((this.gameState.currentPlayer + 1) % 3) as PlayerPosition
    this.time.delayedCall(800, () => this.startTurn())
  }

  // ==================== UI 辅助 ====================

  private showLastPlay(player: PlayerPosition, combo: Combo | null) {
    const { width, height } = this.cameras.main

    // 位置：中央(玩家), 右侧(下家), 左侧(上家)
    const positions = [
      { x: width / 2, y: height * 0.28 },            // 我 (底部出牌区)
      { x: width - px(88, this), y: height * 0.44 },  // 下家 (右侧面板)
      { x: px(88, this), y: height * 0.44 },           // 上家 (左侧面板)
    ]

    // 清除上一次
    if (this.lastPlayCards[player]) {
      this.lastPlayCards[player]!.destroy()
      this.lastPlayCards[player] = null
    }

    if (!combo) {
      this.lastPlayCards[player] = this.add.container(positions[player].x, positions[player].y)
      const t = this.add.text(0, 0, "不出", {
        fontSize: `${px(16, this)}px`,
        color: "#aaaaaa",
        fontStyle: "bold",
      }).setOrigin(0.5)
      this.lastPlayCards[player]!.add(t)
      return
    }

    // 用小型 CardSprite 展示打出的牌
    const container = this.add.container(positions[player].x, positions[player].y)
    const isSidePlayer = player !== 0
    const gap = isSidePlayer ? px(18, this) : px(28, this)
    const totalW = (combo.cards.length - 1) * gap
    combo.cards.forEach((card, i) => {
      const cs = new CardSprite({ scene: this, x: i * gap - totalW / 2, y: 0, card, faceUp: true, isSmall: false })
      container.add(cs)
    })
    this.lastPlayCards[player] = container
  }

  private showToast(msg: string) {
    const { width, height } = this.cameras.main
    const t = this.add
      .text(width / 2, height / 2, msg, {
        fontSize: `${px(24, this)}px`,
        color: "#ffffff",
        backgroundColor: "#ff444488",
        padding: { x: px(16, this), y: px(8, this) },
      })
      .setOrigin(0.5)
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 60,
      duration: 1000,
      delay: 500,
      onComplete: () => t.destroy(),
    })
  }
}
