export default async function Home() {
  let result: { ok?: boolean; results?: string[]; error?: string } = {}
  let fetchError = ""

  try {
    // 直接调用本地 API 路由测试 Prisma
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    console.log('baseUrl', baseUrl)
    const res = await fetch(`${baseUrl}/api/test-db`, { cache: "no-store" })
    console.log('res', res)
    result = await res.json()
    console.log('result', result)
  } catch (e) {
    fetchError = String(e)
    console.log('e error', e)
  }

  return (
    <main style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>Prisma 数据库测试</h1>
      <h2>API: /api/test-db</h2>
      {fetchError ? (
        <p style={{ color: "red" }}>请求失败: {fetchError}</p>
      ) : result.ok ? (
        <>
          <p style={{ color: "green" }}>数据库操作成功!</p>
          <ul>
            {result.results?.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ color: "red" }}>失败: {result.error}</p>
      )}
      <pre>{JSON.stringify({ ok: result.ok, error: result.error, results: result.results }, null, 2)}</pre>
    </main>
  )
}
