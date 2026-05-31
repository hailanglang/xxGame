# Code Review: api() fetch wrapper + 图片上传重构

**日期:** 2026-05-31  
**范围:** `git diff HEAD` — 4 个文件 + 1 个新增文件  
**评分:** 14 findings (3 HIGH, 5 MEDIUM, 6 LOW)

---

## HIGH

### 1. 图片重复上传 — FileUpload 的 onValueChange 触发两次

**文件:** `src/components/cover-image-upload.tsx:61`, `src/components/ui/file-upload.tsx:294-298,600-604`

FileUpload 每次选择文件时，`ADD_FILES` reducer 无条件调用一次 `onValueChange`，随后的 controlled-mode 回调又调用一次。`handleFilesChange` 每次调用都执行真实上传，导致每张图上传两次。

**触发:** 用户选 3 张图 → 6 次上传请求 → 3 张孤立图片残留服务器。

**修复建议:**  
- [ ] 将 `value={[]}` 改为 `value={undefined}` 退出 controlled 模式，或使用 `useMemo(() => [], [])` 稳定引用。

---

### 2. api() 在非 JSON 响应上抛出 SyntaxError

**文件:** `src/lib/api-client.ts:28`, `src/app/interactions/page.tsx:33`

`res.json()` 无 try/catch 保护。服务端返回 204 / HTML 错误页时抛出 `SyntaxError`。`interactions/page.tsx` 无 `.catch()` 导致 unhandled rejection。

**触发:** API 返回空 body → SyntaxError → 列表静默失败，永远显示"还没有内容"。

**修复建议:**  
- [ ] api() 内部 try/catch res.json()，返回统一错误结构；interactions/page 添加 .catch()。

---

### 3. value={[]} 导致 FileUpload 的 maxFiles 校验失效

**文件:** `src/components/cover-image-upload.tsx:61`, `src/components/ui/file-upload.tsx:442-452,513-516`

`value={[]}` 每次渲染创建新引用 → 触发 FileUpload 的 `useEffect` → `SET_FILES []` 清空内部计数 → `store.files.size` 始终为 0 → `maxFiles` 强制失效。

**触发:** 用户可无限上传图片绕过 maxFiles=9 限制。

**修复建议:**  
- [ ] 将 `value={[]}` 改为 `value={undefined}`，退出 FileUpload 的 controlled 模式。

---

## MEDIUM

### 4. 上传期间删除图片存在竞态条件

**文件:** `src/components/cover-image-upload.tsx:44`

`removeUrl` 删除图片后，已发起的 `handleFilesChange` 闭包仍持有旧的 `currentUrls` 快照，完成时会用包含已删除 URL 的数组覆盖。

**触发:** 上传中删除旧图 → 上传完成 → 已删除的图片重新出现在列表中。

**修复建议:**  
- [ ] 使用 `useRef` 保存最新 urls，或使用函数式更新 `setUrls(prev => ...)`。

---

### 5. 无 AbortController，卸载后仍在上传

**文件:** `src/components/cover-image-upload.tsx:28`

无中止机制，组件卸载后上传请求继续执行，调用 `setUrls`/`onValueChange` 报 React warning，服务器收到无用上传。

**触发:** 选图后立即导航离开 → 组件卸载 → 上传继续 → console warning + 服务器浪费。

**修复建议:**  
- [ ] useEffect cleanup 中使用 AbortController 取消请求。

---

### 6. interactions/page.tsx 无错误处理

**文件:** `src/app/interactions/page.tsx:33`

`api()` 调用仅 `.then()` 无 `.catch()`，API 失败时静默失败。

**触发:** 网络错误 → unhandled rejection → 空白列表 → 无错误提示。

**修复建议:**  
- [ ] 添加 `.catch()` 设置 error 状态，展示错误提示 + 重试按钮。

---

### 7. 提交按钮在 form 外部

**文件:** `src/app/interactions/new/page.tsx:129,142`

底部操作栏在 `<form>` 标签外部，键盘 Enter 无法提交表单。

**触发:** 用户在输入框按 Enter → 无反应 → 只能鼠标点击提交。

**修复建议:**  
- [ ] 使用 `<button form="..." type="submit">` 关联表单，或将底部栏移入 form。

---

### 8. 登录成功后不清除表单

**文件:** `src/components/login-dialog.tsx:64`

`onOpenChange(false)` 关闭弹窗但不清除 `phone`/`code` 状态。

**触发:** 登出后重新打开弹窗 → 旧手机号和验证码仍显示 → 隐私问题。

**修复建议:**  
- [ ] 关闭/登录成功后 `setPhone("")` + `setCode("")`。

---

## LOW

### 9. 上传失败静默跳过，无用户反馈

**文件:** `src/components/cover-image-upload.tsx:40`

空 `catch {}` 跳过失败，用户不知某张图丢失。

**修复建议:**  
- [ ] toast 提示或错误计数，告知用户哪些文件上传失败。

---

### 10. 嵌套 try/catch 外层为死代码

**文件:** `src/components/login-dialog.tsx:46,68`

内层 catch 已处理所有错误且不 rethrow，外层 catch 永远不可达。

**修复建议:**  
- [ ] 合并为单层 try/catch。

---

### 11. 纯空格 title/content 可通过验证

**文件:** `src/app/interactions/new/page.tsx:27`

`!title` 对空格字符串为 false，空白文章可通过验证。

**修复建议:**  
- [ ] 使用 `!title.trim()` / `!content.trim()`。

---

### 12. nextCursor 设置后从未使用

**文件:** `src/app/interactions/page.tsx:30`

`setNextCursor` 被调用但组件中无分页/加载更多逻辑。

**修复建议:**  
- [ ] 移除或实现分页功能。

---

### 13. 分类 tab 按钮无 onClick

**文件:** `src/app/interactions/page.tsx:47`

按钮渲染为可交互但无事件处理，`active` 标志硬编码。

**修复建议:**  
- [ ] 添加 `useState` 管理当前 tab，实现分类筛选。

---

### 14. 文章卡片始终渲染 3 个图片位

**文件:** `src/app/interactions/page.tsx:92`

`Array.from({ length: 3 })` 硬编码，0/1/2 张图时出现空灰色方块。

**修复建议:**  
- [ ] 根据 `post.images.length` 动态渲染，或无图片时不渲染占位。
