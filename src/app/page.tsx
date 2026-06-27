import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "发现好玩家 — XXGame 游戏社区",
  description: "游戏有伴，拒绝凑数。加入 XXGame，发现志同道合的游戏玩家。",
  openGraph: {
    title: "XXGame — 游戏玩家社区",
    description: "发现好玩家，游戏有伴，拒绝凑数",
    type: "website",
  },
}

interface GameCard {
  title: string
  desc: string
  /** 图标渐变色（斗地主/飞行棋/猜拳使用） */
  gradient?: string
  /** 图标区域文字（仅 2048 使用） */
  iconText?: string
  /** 是否可玩 */
  playable?: boolean
  /** 可玩时的跳转链接 */
  href?: string
}

const games: GameCard[] = [
  {
    title: "斗地主",
    desc: "和两个AI演一出牌局大戏",
    iconText: "斗地主",
    playable: true,
    href: "/game/doudizhu",
  },
  {
    title: "2048",
    desc: "合并数字方块，挑战最高分！",
    iconText: "2048",
    playable: true,
    href: "/game/2048",
  },
  {
    title: "飞行棋",
    desc: "掷骰子听AI唠嗑，谁先到终点？",
    gradient: "from-[#FF8904] to-[#FB2C36]",
  },
  {
    title: "猜拳",
    desc: `每次出拳都遇见不同"人格"`,
    gradient: "from-[#FDC700] to-[#FB2C36]",
  },
]

export default function HomePage() {
  return (
    <>
      <main className="mx-auto max-w-[1280px] px-8 py-24">
        {/* Slogan — Figma: 60px Bold, centered */}
        <h1 className="text-center text-[60px] font-bold text-[#101828] leading-[60px]">
          一个人，也能玩得很热闹
        </h1>

        {/* 游戏卡片 — 2×2 grid, 间距加大 */}
        <div className="mt-20 grid grid-cols-2 gap-16 max-w-[900px] mx-auto">
          {games.map((game) => (
            <article
              key={game.title}
              className="flex flex-col bg-white border border-[#E5E7EB] rounded-[14px] p-10"
            >
              {/* 图标 + 标签 */}
              <div className="flex items-center justify-between">
                <div className="size-[72px] flex items-center justify-center rounded-[10px] bg-[#FEF2F2]">
                  {game.iconText ? (
                    <span className="text-xl font-bold text-[#FB2C36] leading-7">
                      {game.iconText}
                    </span>
                  ) : (
                    <div
                      className={`size-14 rounded-[10px] bg-gradient-to-br ${game.gradient}`}
                    />
                  )}
                </div>

                {game.playable ? (
                  <Link
                    href={game.href!}
                    className="flex items-center p-4 h-7 rounded-full bg-[#FB2C36] text-white text-lg leading-4 hover:opacity-90 transition-opacity"
                  >
                    立即体验
                  </Link>
                ) : (
                  <span className="flex items-center p-4 h-7 rounded-full bg-[#F9FAFB] text-lg text-[#99A1AF] leading-4">
                    敬请期待
                  </span>
                )}
              </div>

              {/* 标题 — 20px Semi Bold */}
              <h2 className="mt-8 text-xl font-semibold text-[#101828] leading-7">
                {game.title}
              </h2>

              {/* 描述 — 14px Regular */}
              <p className="mt-4 text-sm text-[#4A5565] leading-5">
                {game.desc}
              </p>
            </article>
          ))}
        </div>
      </main>

      {/* Footer — Figma: border-top, centered */}
      <footer className="border-t border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-8 h-[84px] flex items-center justify-center">
          <p className="text-sm text-[#6A7282] leading-5">
            版权所有 © 2023-2026 All Rights Reserved
          </p>
        </div>
      </footer>
    </>
  )
}
