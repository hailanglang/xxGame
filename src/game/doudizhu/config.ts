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
  scene: [BootScene, MenuScene, DealingScene, PlayScene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
