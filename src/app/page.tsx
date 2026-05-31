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

const games = [
  {
    title: "斗地主",
    desc: "和两个AI演一出牌局大戏",
    gradient: "from-[#FF6467] to-[#E7000B]",
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
      <main className="max-w-[1280px] mx-auto px-8 py-20">
        {/* Slogan — Figma: 60px Bold, centered */}
        <h1 className="text-center text-[60px] font-bold text-[#101828] leading-[60px]">
          一个人，也能玩得很热闹
        </h1>

        {/* 游戏卡片 — Figma: 3张卡片, gap 24px */}
        <div className="mt-16 flex gap-6">
          {games.map((game) => (
            <article
              key={game.title}
              className="flex-1 bg-white border border-[#E5E7EB] rounded-[14px] p-8"
            >
              {/* 图标 + 标签 */}
              <div className="flex items-center justify-between">
                <div className="size-16 flex items-center justify-center bg-[#FEF2F2] rounded-[10px]">
                  <div
                    className={`size-12 rounded-[10px] bg-gradient-to-br ${game.gradient}`}
                  />
                </div>
                <span className="px-3 h-6 flex items-center bg-[#F9FAFB] rounded-full text-xs text-[#99A1AF] leading-4">
                  敬请期待
                </span>
              </div>

              {/* 标题 — 20px Semi Bold */}
              <h2 className="mt-6 text-xl font-semibold text-[#101828] leading-7">
                {game.title}
              </h2>

              {/* 描述 — 14px Regular */}
              <p className="mt-3 text-sm text-[#4A5565] leading-5">
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
