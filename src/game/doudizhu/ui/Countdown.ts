// src/game/doudizhu/ui/Countdown.ts
import Phaser from "phaser"
import { px } from "../utils/scale"

/**
 * 倒计时条
 *
 * 横向进度条，计时归零时触发回调。颜色在剩余 >30% 时为金色，≤30% 时为红色。
 *
 * @param scene     所属 Phaser 场景
 * @param x         条左上角 x 坐标
 * @param y         条左上角 y 坐标
 * @param width     条宽度 (像素)
 * @param onTimeout 超时回调函数
 */
export class Countdown extends Phaser.GameObjects.Container {
  private bar: Phaser.GameObjects.Graphics
  private totalTime: number
  private remaining: number
  private _active = false
  private onTimeout: () => void
  private barWidth: number

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, onTimeout: () => void) {
    super(scene, x, y)
    this.barWidth = width
    this.totalTime = 15
    this.remaining = 15
    this.onTimeout = onTimeout
    this.bar = scene.add.graphics()
    this.add(this.bar)
    scene.add.existing(this)
  }

  start(seconds = 15) {
    this.totalTime = seconds
    this.remaining = seconds
    this._active = true
    this.draw()
  }

  stop() {
    this._active = false
    this.bar.clear()
  }

  update(delta: number) {
    if (!this._active) return
    this.remaining -= delta / 1000
    if (this.remaining <= 0) {
      this.remaining = 0
      this._active = false
      this.onTimeout()
    }
    this.draw()
  }

  private draw() {
    this.bar.clear()
    const pct = Math.max(0, this.remaining / this.totalTime)
    const color = pct > 0.3 ? 0xd4a017 : 0xcc0000
    this.bar.fillStyle(color, 1)
    this.bar.fillRoundedRect(0, 0, this.barWidth * pct, px(8, this.scene), px(4, this.scene))
  }
}
