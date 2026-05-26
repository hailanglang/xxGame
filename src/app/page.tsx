import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase.auth.getSession();

  return (
    <main style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>xxGame — Supabase 连接测试</h1>
      <h2>Supabase 状态</h2>
      {error ? (
        <p style={{ color: "red" }}>连接失败: {error.message}</p>
      ) : (
        <p style={{ color: "green" }}>已连接至 Supabase</p>
      )}
      <pre>{JSON.stringify({ connected: !error, error: error?.message }, null, 2)}</pre>
    </main>
  );
}
