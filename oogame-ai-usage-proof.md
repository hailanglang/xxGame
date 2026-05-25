# OOGame 前端岗 · AI 编程工具使用证明报告

## 0 元信息
- 生成时间：2026-05-25 10:10 (UTC+8)
- 脱敏级别：1（强脱敏）
- 报告由哪个工具生成：Claude Code
- 操作系统：Windows 11 Pro (MINGW64_NT-10.0-26100)

## 1 总览快照
| 工具 | 首次使用 | 累计天数 | 活跃天数 | 会话总数 | 近30天会话 | 最近活跃 | 项目数 |
|---|---|---|---|---|---|---|---|
| Claude Code | 2026-05-24 | 2 | 2 | 7 | 7 | 2026-05-25 | 2 |
| Codex | 2026-05-24 | 2 | 1 | 5 | 5 | 2026-05-24 | 3 |

## 2 Claude Code 明细

- **使用时长**：首次启动 2026-05-24，累计 2 个自然日，其中 2 天有活动记录（含首次启动日及 7 个会话记录日）
- **活跃度**：7 个会话，估算交互轮次约 264 轮（基于会话 JSONL 总行数）；近 30 天 7 个会话，近 7 天 7 个会话；最近活跃于 2026-05-25
- **广度**：2 个项目上下文（1 个前端工程项目 + 1 个全局/个人目录上下文）
- **配置成熟度**：
  - 全局 CLAUDE.md：未检测到
  - 项目级 CLAUDE.md 数量：0
  - 自定义 slash 命令数：0
  - 自定义子 agent 数：0
  - MCP server 配置数：0
  - 已安装 plugins/skills 数：1（官方插件市场已安装）
  - hooks 配置数：0
  - 全局 settings.json：存在（17 行，含环境变量与模型配置，已配置中文界面、暗色主题）

## 3 Codex 明细

- **使用时长**：首次会话 2026-05-24，累计 2 个自然日，其中 1 天有会话活动
- **活跃度**：5 个会话，估算交互轮次约 54 轮（基于会话 JSONL 总行数）；近 30 天 5 个会话，近 7 天 5 个会话；最近活跃于 2026-05-24
- **广度**：3 个项目目录（均为 ad-hoc 聊天上下文）
- **配置成熟度**：
  - 全局 AGENTS.md：存在但为空（0 字节，已创建但未编写内容）
  - 项目级 AGENTS.md 数量：0
  - 自定义 prompts 数：0（prompts 目录不存在）
  - MCP server 配置数：1（Node.js REPL 运行时类）
  - 已安装 plugins 数：4（文档、表格、演示文稿、浏览器类）
  - hooks 配置数：0
  - 模型配置：已配置第三方模型提供商及推理模型

## 4 工作流自述（候选人手写）
> 请描述 1–2 个最近真实用 AI agent 完成的任务——背景、你怎么拆解、agent 在哪里出错、你怎么发现并纠正、最终结果。
> 每个任务标注一条可对应的会话元数据（日期 + 项目代号）。
>
> 【占位——候选人提交前补全】

## 5 数据来源与方法

### 实际扫描的路径清单

| 路径 | 状态 | 说明 |
|---|---|---|
| `~/.claude.json` | 存在 | 3008 字节，含 numStartups、firstStartTime、projects 等元数据 |
| `~/.claude/.claude.json` | 未检测到 | — |
| `~/.claude/projects/` | 存在 | 含 2 个项目子目录，共 7 个 .jsonl 会话文件 |
| `~/.claude/commands/*.md` | 未检测到 | 目录不存在 |
| `~/.claude/agents/*.md` | 未检测到 | 目录不存在 |
| `~/.claude/plugins/` | 存在 | 含 known_marketplaces.json，已安装 1 个官方市场 |
| `~/.claude/skills/` | 未检测到 | 目录不存在 |
| `~/.claude/settings.json` | 存在 | 603 字节，含 env、语言、主题等配置 |
| `~/.claude/CLAUDE.md` | 未检测到 | 文件不存在 |
| 项目级 `CLAUDE.md`（已登记项目） | 未检测到 | 已登记项目根目录无此文件 |
| 项目级 `.claude/`（已登记项目） | 存在 | 含 settings.local.json（权限配置） |
| 项目级 `.mcp.json`（已登记项目） | 未检测到 | 文件不存在 |
| `~/.codex/config.toml` | 存在 | 2075 字节，含 model、mcp_servers、plugins、profiles 等 |
| `~/.codex/history.jsonl` | 未检测到 | 文件不存在 |
| `~/.codex/sessions/` | 存在 | 含 2026/05/24 子目录，共 5 个 rollout-*.jsonl |
| `~/.codex/prompts/` | 未检测到 | 目录不存在 |
| `~/.codex/AGENTS.md` | 存在 | 0 字节，已创建但为空 |
| 项目级 `AGENTS.md`（Codex 已登记项目） | 未检测到 | 各项目目录均无此文件 |

### 各指标的统计方法说明

- **首次使用**：Claude Code 取自 `~/.claude.json` 中 `firstStartTime` 字段；Codex 取最早会话文件名中的时间戳
- **累计天数**：首次使用日期至报告生成日期的自然日跨度（含首尾）
- **活跃天数**：去重统计有会话记录（或首次启动）的自然日数量
- **会话总数**：Claude Code 统计 `~/.claude/projects/` 下所有 `.jsonl` 文件数量；Codex 统计 `~/.codex/sessions/` 下所有 `rollout-*.jsonl` 文件数量
- **估算交互轮次**：Claude Code 取所有会话 JSONL 文件的总行数；Codex 取所有 rollout JSONL 文件的总行数（每行对应一次交互事件）
- **近 30 天 / 近 7 天会话数**：与会话总数相同（全部会话均发生在最近 2 天内）
- **项目数**：Claude Code 统计 `~/.claude/projects/` 下的子目录数量；Codex 统计 `config.toml` 中 `[projects]` 段的条目数
- **配置各项**：通过检查对应路径是否存在及内容规模确定
- **MCP server 数量**：Claude Code 检查 `~/.claude.json` 中 `mcpServers` 字段；Codex 检查 `config.toml` 中 `[mcp_servers]` 段

## 6 候选人确认
- [ ] 我已逐段审阅本报告，确认不含密钥、凭证、雇主敏感信息
- [ ] 报告数据由本机真实扫描生成，未伪造
- 签名 / 日期：

## 附 · 机读摘要
```json
{
  "claude_code": {
    "first_use": "2026-05-24",
    "total_days": 2,
    "active_days": 2,
    "sessions": 7,
    "sessions_30d": 7,
    "projects": 2,
    "claude_md": false,
    "project_claude_md": 0,
    "custom_commands": 0,
    "subagents": 0,
    "mcp_servers": 0,
    "plugins_skills": 1,
    "hooks": 0
  },
  "codex": {
    "first_use": "2026-05-24",
    "total_days": 2,
    "active_days": 1,
    "sessions": 5,
    "sessions_30d": 5,
    "projects": 3,
    "agents_md": false,
    "project_agents_md": 0,
    "custom_prompts": 0,
    "mcp_servers": 1,
    "hooks": 0
  },
  "desensitization_level": 1,
  "generated_at": "2026-05-25T02:10:00.000Z"
}
```
