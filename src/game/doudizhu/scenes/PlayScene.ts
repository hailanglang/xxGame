// src/game/doudizhu/scenes/PlayScene.ts
import Phaser from "phaser"
import type { GameState, Card, Combo, PlayerPosition } from "../logic/types"
import { RANK_NAMES } from "../logic/types"
import { recognizeCombo } from "../logic/rules"
import { canBeat } from "../logic/compare"
import { CardSprite } from "../ui/Card"
import { HandFan } from "../ui/HandFan"
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
  private lastPlayTexts!: (Phaser.GameObjects.Text | null)[]
  private countdown!: Countdown
  private particles!: ParticleEffects
  private currentTurnAction: (() => void) | null = null

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

    // 游戏正式开始
    this.gameState.phase = "playing"

    // ---- 出牌区（中央） ----
    this.lastPlayTexts = [null, null, null]

    // ---- 玩家信息 ----
    const names = ["我", "下家", "上家"]
    this.avatars = [
      new PlayerAvatar(this, 40, height - 60, names[0], this.gameState.landlord === 0),
      new PlayerAvatar(this, width - 180, height / 2 - 40, names[1], this.gameState.landlord === 1),
      new PlayerAvatar(this, 40, height / 2 - 40, names[2], this.gameState.landlord === 2),
    ]

    // ---- 我的手牌（底部扇形） ----
    this.myHand = new HandFan(this, width / 2, height - 50)
    this.myHand.setHand(this.gameState.hands[0], true)

    // ---- 出牌按钮 ----
    this.add
      .text(width / 2 - 60, height - 130, "出牌", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: 16, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onHumanPlay())

    this.add
      .text(width / 2 + 60, height - 130, "不出", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#666666",
        padding: { x: 16, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onHumanPass())

    // ---- 倒计时 ----
    this.countdown = new Countdown(this, width / 2 - 100, height - 170, 200, () => {
      this.onHumanTimeout()
    })

    // ---- 特效 ----
    this.particles = new ParticleEffects(this)

    // ---- 开始游戏 ----
    this.startTurn()
  }

  update(_time: number, delta: number) {
    this.countdown.update(delta)
  }

  // ==================== 回合管理 ====================

  private startTurn() {
    // 更新所有玩家的手牌数量显示
    this.gameState.hands.forEach((hand, i) => {
      this.avatars[i].setCardCount(hand.length)
    })

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
    // 如果自己是首轮出牌或上一手也是自己出的，不能 pass
    if (!this.gameState.lastPlay || this.gameState.lastPlay.player === 0) {
      this.showToast("必须出牌")
      return
    }
    this.executePass(0)
  }

  private onHumanTimeout() {
    if (this.gameState.currentPlayer !== 0) return
    // 超时自动出最小牌或 pass
    if (!this.gameState.lastPlay || this.gameState.lastPlay.player === 0) {
      // 出最小的单张
      const minCard = this.gameState.hands[0][0]
      const combo = recognizeCombo([minCard])
      if (combo) this.executePlay(0, [minCard], combo)
    } else {
      this.executePass(0)
    }
  }

  // ==================== AI 回合 ====================

  private async handleAiTurn() {
    const player = this.gameState.currentPlayer
    const hand = this.gameState.hands[player]

    // 通过 DeepSeek API 获取决策
    const decision = await this.callAi(player)

    if (!decision || decision.action === "pass") {
      // AI 选择 pass
      const canPass = this.gameState.lastPlay && this.gameState.lastPlay.player !== player
      if (canPass) {
        this.executePass(player)
      } else {
        // 不能 pass，出最小单张
        const minCard = hand[0]
        const combo = recognizeCombo([minCard])
        if (combo) this.executePlay(player, [minCard], combo)
      }
      return
    }

    // 验证 AI 出牌
    const combo = validateAiPlay(
      hand,
      "play",
      decision.cards,
      this.gameState.lastPlay?.combo ?? null,
    )

    if (combo) {
      // 从 hand 中获取对应的 Card 对象
      const selectedCards = hand.filter((c) => decision.cards.includes(c.id))
      this.executePlay(player, selectedCards, combo)
    } else {
      // 降级：出最小能出的牌
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
        // 无 API Key 时使用简单策略
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

  /** 无 API Key 或调用失败时的简单 AI 策略 */
  private fallbackAi(player: PlayerPosition): AiDecision {
    const hand = this.gameState.hands[player]
    const lastCombo = this.gameState.lastPlay?.combo ?? null

    if (!lastCombo || this.gameState.lastPlay?.player === player) {
      // 自由出牌：出最小的牌
      const combo = recognizeCombo([hand[0]])
      if (combo) {
        return { action: "play", cards: [hand[0].id], reason: "出最小牌" }
      }
    }

    // 尝试找最小的能打过的牌
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

    // 尝试所有可能的牌组合（简单策略：1张~4张）
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
    // 从手牌中移除
    const removedIds = new Set(cards.map((c) => c.id))
    const newHand = this.gameState.hands[player].filter((c) => !removedIds.has(c.id))
    this.gameState.hands[player] = newHand

    // 更新状态
    this.gameState.lastPlay = { player, combo }
    this.gameState.passCount = 0

    // 更新 UI
    if (player === 0) {
      this.myHand.setHand(newHand, true)
    }
    this.avatars[player].setCardCount(newHand.length)

    // 显示出的牌
    this.showLastPlay(player, combo)

    // 特效
    if (combo.type === "bomb" || combo.type === "rocket") {
      this.particles.playBomb(this.cameras.main.width / 2, this.cameras.main.height / 2)
    }

    // 检查是否出完
    if (newHand.length === 0) {
      this.gameState.winner = player
      this.gameState.phase = "finished"
      this.countdown.stop()
      this.time.delayedCall(1000, () => {
        this.scene.start("ResultScene", { gameState: this.gameState })
      })
      return
    }

    // 下一家
    this.nextPlayer()
  }

  private executePass(player: PlayerPosition) {
    this.gameState.passCount++
    this.showLastPlay(player, null)

    // 如果连续两家 pass，上一家自由出牌
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
    const positions = [
      { x: width / 2, y: height - 200 },
      { x: width / 2 + 150, y: height / 2 },
      { x: width / 2 - 150, y: height / 2 },
    ]

    // 清除旧文本
    if (this.lastPlayTexts[player]) {
      this.lastPlayTexts[player]!.destroy()
    }

    if (!combo) {
      // 显示"不出"
      this.lastPlayTexts[player] = this.add
        .text(positions[player].x, positions[player].y, "不出", {
          fontSize: "18px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5)
      return
    }

    const cardStr = combo.cards
      .map((c) => {
        const suitSymbol: Record<string, string> = { h: "♥", d: "♦", c: "♣", s: "♠" }
        const s = c.suit ? suitSymbol[c.suit] : ""
        return `${s}${RANK_NAMES[c.rank]}`
      })
      .join(" ")

    this.lastPlayTexts[player] = this.add
      .text(positions[player].x, positions[player].y, cardStr, {
        fontSize: "22px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
  }

  private showToast(msg: string) {
    const { width, height } = this.cameras.main
    const t = this.add
      .text(width / 2, height / 2, msg, {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#ff444488",
        padding: { x: 16, y: 8 },
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
