import Phaser from "phaser"
import { BootScene } from "./scenes/BootScene"
import { MenuScene } from "./scenes/MenuScene"
import { DealingScene } from "./scenes/DealingScene"
import { PlayScene } from "./scenes/PlayScene"
import { ResultScene } from "./scenes/ResultScene"

export const doudizhuConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#1a6b3c",
  parent: undefined, // 由 GameCanvas 在运行时设置
  scene: [
    BootScene,     // 预加载：生成占位贴图
    MenuScene,     // 主菜单：标题 + 开始按钮
    DealingScene,  // 发牌动画 + 叫地主
    PlayScene,     // 核心游戏：出牌、AI、计时
    ResultScene,   // 结算：胜负展示 + 重玩
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
