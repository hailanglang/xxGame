# 2048 AI 助手功能设计文档

**路由**: `/game/2048`
**日期**: 2026-06-03
**状态**: 已确认

---

## 概述

在 2048 游戏页面右侧添加 AI 助手面板，用户可输入 DeepSeek API Key，获取 AI 对当前棋局的下步移动建议。支持手动触发和自动建议两种模式，对话历史在面板下方展示。

## 文件结构

```
src/
├── app/game/2048/page.tsx          # 引入 <GameAiPanel>，传入 board 和 score
└── components/
    └── game-2048-ai-panel.tsx      # AI 面板组件（新建）
```

## 组件结构 (game-2048-ai-panel.tsx)

```
┌─────────────────────────┐
│ 🔑 API Key 输入框       │  ← 密码模式，localStorage 持久化
│ [✓] 自动建议            │  ← 开关，开启后每步自动请求
│ [获取建议] 按钮          │  ← 手动触发
├─────────────────────────┤
│ 🤖 AI 建议              │  ← 最新一条建议，方向 + 理由
│  推荐: → (向右)         │
│  原因: 可合并 2 和 2    │
├─────────────────────────┤
│ 📜 对话历史              │  ← 滚动列表，含每一步的棋盘 + 建议
│  第 1 步: ↑ (向上) ...  │
│  第 2 步: → (向右) ...  │
└─────────────────────────┘
```

## 组件状态

```ts
// 输入 & 配置
apiKey: string              // DeepSeek API Key (localStorage 持久化)
autoMode: boolean           // 自动建议开关 (localStorage 持久化)

// 对话
messages: AiMessage[]       // 对话历史 [{board, suggestion, direction}]
loading: boolean            // 请求中（按钮禁用 + 加载指示）
error: string | null        // 错误信息（API Key 无效、网络错误等）

// 建议结果（最新一条）
currentSuggestion: {
  direction: Direction      // 推荐方向
  reason: string            // 理由
} | null
```

## Prompt 模板

固定格式，将 `TileBoard` 序列化为 4×4 数字矩阵发给 DeepSeek：

```
你是一个 2048 游戏 AI 助手，请分析当前棋局并给出最佳移动方向。
只回复 JSON 格式，不要任何其他文字：
{"direction": "up|down|left|right", "reason": "中文理由，一句话"}

当前棋盘（4×4，0=空格）：
[0,2,0,0]
[0,4,2,0]
[0,0,0,4]
[2,0,0,0]

当前分数: 24
```

## DeepSeek API 调用

- **端点**: `https://api.deepseek.com/v1/chat/completions`
- **模型**: `deepseek-chat`
- **认证**: `Authorization: Bearer {apiKey}`
- **格式**: 兼容 OpenAI Chat Completions API
- **超时**: 10 秒
- **错误处理**:
  - 401 → "API Key 无效，请检查"
  - 429 → "请求过于频繁，请稍后重试"
  - 网络错误 → "网络连接失败，请检查网络"
  - 解析错误 → "AI 返回格式异常，请重试"

## 与 page.tsx 的集成

在 `page.tsx` 的 JSX 中，棋盘右侧添加 `<GameAiPanel>` 组件：

```tsx
<div className="flex gap-6">
  <div>{/* 棋盘区域 */}</div>
  <GameAiPanel board={board} score={score} />
</div>
```

props:
```ts
interface GameAiPanelProps {
  board: TileBoard | null
  score: number
}
```

## 边界情况

- **API Key 为空**: "获取建议"按钮禁用，输入框 placeholder 提示
- **board 为 null**: 等待初始化完成，不触发 AI 请求
- **自动模式下首次渲染**: board 有值时不自动请求（避免开局就请求）
- **快速连续移动**: 使用 AbortController 取消上一次未完成的请求
- **localStorage 不可用**: try-catch 静默降级
- **JSON 解析失败**: 显示 "AI 返回格式异常" 并展示原始文本
