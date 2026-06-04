import type { TokenUsage } from "@/lib/deepseek-usage"

interface Props {
  /** 最近一次请求的用量（null 表示还没请求过） */
  lastUsage: TokenUsage | null
  /** 累计用量 */
  totalUsage: TokenUsage
}

/** Token 用量展示面板 —— 显示本轮和累计的 tokens 消耗与费用 */
export default function TokenUsagePanel({ lastUsage, totalUsage }: Props) {
  if (!lastUsage && totalUsage.total <= 0) return null

  return (
    <div
      className="mt-auto flex flex-col gap-1 rounded-md bg-gray-50 p-2 text-[10px] leading-tight"
      style={{ color: "#6A7282" }}
    >
      {lastUsage && (
        <div className="flex justify-between">
          <span>
            本轮: 输出token: {lastUsage.completion}，输入token {lastUsage.prompt}，输入缓存
            {lastUsage.cached}
          </span>
          <span>{lastUsage.cost.toFixed(6)}元</span>
        </div>
      )}
      <div className="flex justify-between border-t border-gray-200 pt-1">
        <span>
          累计: ↑{totalUsage.completion} ↓{totalUsage.prompt}
        </span>
        <span>{totalUsage.cost.toFixed(5)}元</span>
      </div>
    </div>
  )
}
