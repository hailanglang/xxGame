import Phaser from "phaser"

/** 基准设计宽度 */
export const BASE_WIDTH = 1280

/** 基于当前摄像机宽度与基准宽度的比例系数 */
export function scaleFactor(scene: Phaser.Scene): number {
  return scene.cameras.main.width / BASE_WIDTH
}

/** 按比例缩放像素值 (四舍五入) */
export function px(v: number, scene: Phaser.Scene): number {
  return Math.round(v * scaleFactor(scene))
}
