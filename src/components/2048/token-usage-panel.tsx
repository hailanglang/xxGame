import type { TokenUsage } from "@/lib/deepseek-usage"

interface Props {
  lastUsage: TokenUsage | null
  totalUsage: TokenUsage
}

/** Token 用量展示 */
export default function TokenUsagePanel({ lastUsage, totalUsage }: Props) {
  if (!lastUsage && totalUsage.total <= 0) return null

  return (
    <div
      className="flex flex-col gap-1 pb-2 text-xs leading-tight"
      style={{ color: "#99A1AF", borderBottom: "0.666px solid #F3F4F6" }}
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
      <div className="flex justify-between">
        <span>
          累计: {totalUsage.completion} | {totalUsage.prompt}
        </span>
        <span>{totalUsage.cost.toFixed(5)}元</span>
      </div>
    </div>
  )
}
