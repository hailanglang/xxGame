// src/game/doudizhu/ui/PlayerAvatar.ts
import Phaser from "phaser"
import { px } from "../utils/scale"

/** PlayerAvatar 构造参数 */
export interface PlayerAvatarOptions {
  scene: Phaser.Scene
  x: number
  y: number
  /** 头像中显示的单字符 (我 / 张 / 李) */
  avatarChar: string
  /** 显示名称 (你（农民）/ AI 张三 / AI 李四) */
  displayName: string
  /** 剩余牌数 */
  cardCount: number
  /** 是否为地主 */
  isLandlord: boolean
  /** 布局方向 */
  layout?: "left" | "right"
}

/**
 * 玩家信息组件
 *
 * 匹配 Figma 设计：圆形单字符头像 + 角色名称（"你（农民）"/ "AI 张三"）+ 剩余牌数。
 * 支持两种布局方向：
 *   - "left" (默认)：头像在左，名称+牌数在右
 *   - "right"：头像在右，名称+牌数在左
 */
export class PlayerAvatar extends Phaser.GameObjects.Container {
  private cardCountText: Phaser.GameObjects.Text
  private avatarBg: Phaser.GameObjects.Graphics
  private avatarChar: Phaser.GameObjects.Text
  private landlordBadge: Phaser.GameObjects.Text | null = null
  private layout: "left" | "right"

  constructor({ scene, x, y, avatarChar, displayName, cardCount, isLandlord, layout = "left" }: PlayerAvatarOptions) {
    super(scene, x, y)

    this.layout = layout

    const avatarR = px(20, scene)         // 头像半径
    const gap = px(8, scene)               // 头像与文字的间距

    // 头像圆形背景
    this.avatarBg = scene.add.graphics()
    this.avatarBg.fillStyle(isLandlord ? 0xd4a017 : 0x555555, 1)
    this.avatarBg.fillCircle(0, 0, avatarR)
    this.add(this.avatarBg)

    // 头像字符
    this.avatarChar = scene.add.text(0, 0, avatarChar, {
      fontSize: `${px(18, scene)}px`,
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5)
    this.add(this.avatarChar)

    // 名称 — 包含角色描述
    const nameText = scene.add.text(
      layout === "left" ? avatarR + gap : -(avatarR + gap),
      0,
      displayName,
      {
        fontSize: `${px(13, scene)}px`,
        color: "#ffffff",
      },
    ).setOrigin(layout === "left" ? 0 : 1, 0.5)
    this.add(nameText)

    // 牌数
    this.cardCountText = scene.add.text(
      layout === "left" ? avatarR + gap : -(avatarR + gap),
      px(14, scene),
      `剩 ${cardCount} 张`,
      {
        fontSize: `${px(11, scene)}px`,
        color: "#aaaaaa",
      },
    ).setOrigin(layout === "left" ? 0 : 1, 0.5)
    this.add(this.cardCountText)

    // 地主徽章
    if (isLandlord) {
      this.landlordBadge = scene.add.text(
        0,
        -avatarR - px(8, scene),
        "地主",
        {
          fontSize: `${px(10, scene)}px`,
          color: "#ffffff",
          backgroundColor: "#d4a017",
          padding: { x: px(3, scene), y: px(1, scene) },
        },
      ).setOrigin(0.5)
      this.add(this.landlordBadge)
    }

    scene.add.existing(this)
  }

  setCardCount(n: number) {
    this.cardCountText.setText(`剩 ${n} 张`)
  }

  setLandlord(isLandlord: boolean) {
    if (isLandlord && !this.landlordBadge) {
      const avatarR = px(20, this.scene)
      this.landlordBadge = this.scene.add.text(
        0,
        -avatarR - px(8, this.scene),
        "地主",
        {
          fontSize: `${px(10, this.scene)}px`,
          color: "#ffffff",
          backgroundColor: "#d4a017",
          padding: { x: px(3, this.scene), y: px(1, this.scene) },
        },
      ).setOrigin(0.5)
      this.add(this.landlordBadge)
    } else if (!isLandlord && this.landlordBadge) {
      this.landlordBadge.destroy()
      this.landlordBadge = null
    }
  }
}
