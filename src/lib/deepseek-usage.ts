// ---- 定价（DeepSeek，单位 元 / 1M tokens） ----
export const PRICE_CACHE_HIT = 0.02 / 1_000_000
export const PRICE_CACHE_MISS = 1 / 1_000_000
export const PRICE_OUTPUT = 2 / 1_000_000

// ---- 类型 ----
export interface TokenUsage {
  prompt: number     // 输入总 tokens
  cached: number     // 缓存命中 tokens
  miss: number       // 缓存未命中 tokens
  completion: number // 输出 tokens
  total: number      // 总计
  cost: number       // 费用（美元）
}

/** 从 DeepSeek API 响应体中提取 token 用量并计算费用 */
export function extractTokenUsage(data: { usage?: Record<string, unknown> }): TokenUsage {
  const u = data.usage ?? {}
  const prompt = (u.prompt_tokens as number) ?? 0
  const cached =
    ((u.prompt_tokens_details as Record<string, number>)?.cached_tokens as number) ??
    (u.prompt_cache_hit_tokens as number) ??
    0
  const miss = Math.max(0, prompt - cached)
  const completion = (u.completion_tokens as number) ?? 0
  const total = (u.total_tokens as number) ?? 0
  const cost = miss * PRICE_CACHE_MISS + cached * PRICE_CACHE_HIT + completion * PRICE_OUTPUT

  return { prompt, cached, miss, completion, total, cost }
}

/** 累计两份用量 */
export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    prompt: a.prompt + b.prompt,
    cached: a.cached + b.cached,
    miss: a.miss + b.miss,
    completion: a.completion + b.completion,
    total: a.total + b.total,
    cost: a.cost + b.cost,
  }
}
