// src/game/doudizhu/ui/ParticleEffects.ts
import Phaser from "phaser"

export class ParticleEffects {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  playBomb(x: number, y: number) {
    // 炸弹特效：红色火花
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0xff4400)
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => particle.destroy(),
      })
    }
  }

  playWin(x: number, y: number) {
    // 胜利特效：金色烟花
    for (let i = 0; i < 40; i++) {
      const color = Math.random() > 0.5 ? 0xffd700 : 0xff4444
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), color)
      this.scene.tweens.add({
        targets: p,
        y: y - Phaser.Math.Between(200, 400),
        x: x + Phaser.Math.Between(-150, 150),
        alpha: 0,
        duration: Phaser.Math.Between(500, 1000),
        delay: i * 30,
        onComplete: () => p.destroy(),
      })
    }
  }
}
