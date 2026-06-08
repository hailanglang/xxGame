import { prisma } from "../src/lib/prisma"

async function seed() {
  // 创建工作区
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "yingshi" },
    create: { name: "影视工作区", slug: "yingshi", description: "影视相关讨论" },
    update: {},
  })
  const ws2 = await prisma.workspace.upsert({
    where: { slug: "youxi" },
    create: { name: "游戏讨论区", slug: "youxi", description: "热门游戏讨论" },
    update: {},
  })

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { phone: "13800000000" },
    create: { phone: "13800000000", nickname: "测试玩家" },
    update: {},
  })

  // 创建测试文章
  const posts = [
    {
      title: "电影《我想静静的》圆满杀青文化艺术",
      content: "2025年3月26日17时23分，由安化XX影视文化传播《我想静静的》在石门市XX影视拍摄基地宣告圆满杀青！XX影院文化传媒将以更高的制作水平打造出更优质的影视作品...",
      workspaceId: ws1.id,
    },
    {
      title: "赛博朋克2077 深度评测",
      content: "经过200小时的游戏时间，我认为赛博朋克2077是近年来最具野心的开放世界RPG之一。夜之城的细节令人惊叹，每一个角落都有故事...",
      workspaceId: ws2.id,
    },
    {
      title: "LOL新赛季上分攻略",
      content: "S15赛季已经更新，本次改动重点关注野区经济和龙魂机制。以下是我整理的十条上分秘籍，每一条都经过实战验证...",
      workspaceId: ws2.id,
    },
    {
      title: "Valorant 新英雄技能解析",
      content: "Riot Games 正式公布了下一个特工的全技能详情。这位来自韩国的决斗者将彻底改变当前版本的战术格局...",
      workspaceId: ws2.id,
    },
    {
      title: "原神 4.0 枫丹探索指南",
      content: "枫丹地区的水下探索机制是整个游戏最大的创新点。本指南覆盖所有隐藏宝箱位置、世界任务触发条件和水下战斗技巧...",
      workspaceId: ws2.id,
    },
  ]

  for (const post of posts) {
    await prisma.post.create({
      data: {
        ...post,
        authorId: user.id,
        status: "published",
        summary: post.content.slice(0, 80) + "...",
      },
    })
  }

  console.log("种子数据已创建: 2 个工作区, 1 个用户, 5 篇文章")
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
