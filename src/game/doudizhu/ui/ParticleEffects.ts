// src/game/doudizhu/ui/ParticleEffects.ts
import Phaser from "phaser"
import { px } from "../utils/scale"

/** ParticleEffects 构造参数 */
export interface ParticleEffectsOptions {
  scene: Phaser.Scene
}

/**
 * 粒子特效
 *
 * 出牌 / 胜利时的视觉特效。非 Container，直接通过场景的 tween 创建和销毁粒子。
 */
export class ParticleEffects {
  private scene: Phaser.Scene

  constructor({ scene }: ParticleEffectsOptions) {
    this.scene = scene
  }

  playBomb(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const r = Phaser.Math.Between(px(2, this.scene), px(5, this.scene))
      const particle = this.scene.add.circle(x, y, r, 0xff4400)
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-px(100, this.scene), px(100, this.scene)),
        y: y + Phaser.Math.Between(-px(100, this.scene), px(100, this.scene)),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => particle.destroy(),
      })
    }
  }

  playWin(x: number, y: number) {
    for (let i = 0; i < 40; i++) {
      const color = Math.random() > 0.5 ? 0xffd700 : 0xff4444
      const r = Phaser.Math.Between(px(3, this.scene), px(6, this.scene))
      const p = this.scene.add.circle(x, y, r, color)
      this.scene.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(px(200, this.scene), px(400, this.scene)),
        x: x + Phaser.Math.Between(-px(150, this.scene), px(150, this.scene)),
        alpha: 0,
        duration: Phaser.Math.Between(500, 1000),
        delay: i * px(30, this.scene),
        onComplete: () => p.destroy(),
      })
    }
  }
}
