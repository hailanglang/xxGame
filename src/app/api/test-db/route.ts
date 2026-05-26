import { prisma } from "@/lib/prisma"

export async function GET() {
  const results: string[] = []

  try {
    // 1. 查询 users 行数
    const userCount = await prisma.user.count()
    results.push(`users 表: ${userCount} 条记录`)

    // 2. 插入测试用户
    const testPhone = `1380000${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`
    const newUser = await prisma.user.create({
      data: { phone: testPhone, nickname: "test-" + testPhone.slice(-4) },
    })
    results.push(`插入成功: id=${newUser.id}, phone=${newUser.phone}`)

    // 3. 更新
    const updated = await prisma.user.update({
      where: { id: newUser.id },
      data: { nickname: "test-updated" },
    })
    results.push(`更新成功: nickname=${updated.nickname}`)

    // // 4. 删除
    await prisma.user.delete({ where: { id: newUser.id } })
    results.push("删除成功")
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), results }, { status: 500 })
  }

  return Response.json({ ok: true, results })
}
