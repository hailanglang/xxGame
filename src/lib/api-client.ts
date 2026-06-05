import { useUserStore } from "@/stores/user-store"

type ApiBody = Record<string, unknown> | FormData

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: ApiBody
}

export async function api<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = useUserStore.getState().token
  const { body, headers, ...rest } = options

  const isFormData = body instanceof FormData

  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw data
  return data
}

// ---- DeepSeek API ----
import { extractTokenUsage, type TokenUsage } from "@/lib/deepseek-usage"

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
const DEEPSEEK_MODEL = "deepseek-chat"

export async function dsApi(
  apiKey: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  signal?: AbortSignal,
): Promise<{ content: string; usage: TokenUsage }> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages, temperature: 0.3, max_tokens: 128 }),
    signal,
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error("API Key 无效，请检查")
    if (res.status === 429) throw new Error("请求过于频繁，请稍后重试")
    throw new Error(`API 错误 (${res.status})`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error("AI 返回为空，请重试")

  return { content, usage: extractTokenUsage(data) }
}
