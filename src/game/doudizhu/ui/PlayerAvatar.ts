// src/game/doudizhu/ui/PlayerAvatar.ts
import Phaser from "phaser"
import { px } from "../utils/scale"

/**
 * 玩家信息组件
 *
 * 显示玩家头像圆点、昵称、手牌数量，以及地主标识徽章。
 *
 * @param scene      所属 Phaser 场景
 * @param x          x 坐标
 * @param y          y 坐标
 * @param name       玩家昵称
 * @param isLandlord 是否为地主
 */
export class PlayerAvatar extends Phaser.GameObjects.Container {
  private nameText: Phaser.GameObjects.Text
  private cardCountText: Phaser.GameObjects.Text
  private avatarBg: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, isLandlord: boolean) {
    super(scene, x, y)

    this.avatarBg = scene.add.graphics()
    this.avatarBg.fillStyle(isLandlord ? 0xd4a017 : 0x333333, 1)
    this.avatarBg.fillCircle(0, 0, px(24, scene))
    this.add(this.avatarBg)

    this.nameText = scene.add.text(px(30, scene), px(-10, scene), name, {
      fontSize: `${px(14, scene)}px`,
      color: "#ffffff",
    })
    this.add(this.nameText)

    this.cardCountText = scene.add.text(px(30, scene), px(8, scene), "17 张", {
      fontSize: `${px(12, scene)}px`,
      color: "#cccccc",
    })
    this.add(this.cardCountText)

    // 地主标志
    if (isLandlord) {
      const badge = scene.add.text(0, px(-30, scene), "地主", {
        fontSize: `${px(11, scene)}px`,
        color: "#ffffff",
        backgroundColor: "#d4a017",
        padding: { x: px(4, scene), y: px(2, scene) },
      }).setOrigin(0.5)
      this.add(badge)
    }

    scene.add.existing(this)
  }

  setCardCount(n: number) {
    this.cardCountText.setText(`${n} 张`)
  }
}
