import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "发现好玩家 — XXGame 游戏社区",
  description: "游戏有伴，拒绝凑数。加入 XXGame，发现志同道合的游戏玩家。",
  openGraph: {
    title: "XXGame — 游戏玩家社区",
    description: "发现好玩家，游戏有伴，拒绝凑数",
    type: "website",
  },
}

export default function HomePage() {
  return (
    <main>
      {/* Hero Section — Figma: 内容区1 (16:11), 1440x752px */}
      <section
        className="relative w-full h-[752px] flex items-center justify-center bg-[#D9D9D9]"
        aria-labelledby="hero-heading"
      >
        <div className="text-center">
          <h1
            id="hero-heading"
            className="text-[64px] leading-tight text-black whitespace-pre-line"
            style={{ fontFamily: "Song Myung, serif" }}
          >
            发现好玩家{"\n"}游戏有伴，拒绝凑数
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-md mx-auto">
            加入 XXGame，找到真正合拍的游戏搭档
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#E8392A] hover:bg-[#d02a1e] text-white px-8 h-12 text-base rounded-md"
            >
              <Link href="/interactions">探索社区</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="px-8 h-12 text-base rounded-md"
            >
              <Link href="/interactions/new">发布互动</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 特性简介 — SEO 长尾内容 */}
      <section className="max-w-[1200px] mx-auto py-20 px-6 space-y-12">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "找队友", desc: "按游戏、段位、时段精准匹配" },
            { title: "聊攻略", desc: "深度评测、最新资讯一手掌握" },
            { title: "交好友", desc: "基于游戏偏好的社区互动" },
          ].map((item) => (
            <article key={item.title} className="text-center p-8 bg-white rounded-xl">
              <h2 className="text-xl font-semibold mb-3">{item.title}</h2>
              <p className="text-gray-500">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
