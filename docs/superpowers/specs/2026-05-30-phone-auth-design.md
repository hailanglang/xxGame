# 手机号验证码登录/注册 API 设计

## 概要

用户通过手机号 + 短信验证码进行注册和登录，自动合一。服务端校验成功后返回 JWT Token，通过 httpOnly cookie 传递。

## API 端点

### `POST /api/auth/verify-code`

**请求：**

```json
{ "phone": "13800138000", "code": "123456" }
```

**成功响应（200）：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "phone": "13800138000",
    "nickname": "用户_0123456789",
    "role": "user"
  }
}
```

**失败响应：**

| 状态码 | 场景 |
|--------|------|
| 400 | 参数缺失或格式错误 |
| 401 | 验证码错误或已过期 |
| 500 | 服务端异常 |

## 处理流程

1. 查询该 phone 最新一条 `used=false` 且 `expiresAt > now()` 的记录
2. 无记录 → 401 "请先获取验证码"
3. 比对 code → 不匹配 → 401 "验证码错误"
4. 匹配 → 标记 `used = true`
5. `user.upsert(phone)`：不存在则创建（nickname=`用户_` + 10 位随机数）
6. 签发 JWT（payload: `{ userId, phone, role }`，exp: 7d）
7. 返回 user 信息和 token
8. 返回 user 信息

## 技术选型

| 项 | 选择 | 说明 |
|----|------|------|
| JWT 库 | `jose` | Edge Runtime 兼容，Next.js 推荐 |
| Token 传递 | `Authorization: Bearer <token>` header | 前端存储并手动携带 |
| Secret | `JWT_SECRET` 环境变量 | `.env.local` 中配置 |
| 有效期 | 7 天 | |
| 算法 | HS256 | 对称加密，仅服务端持有密钥 |

## 安全

- 验证码用完立即标记，防止复用
- 验证码 5 分钟过期
- 生产环境通过 unisms 发送，开发环境固定 123456

## 前端对接

- 登录成功后 API 返回 `token`，前端存 localStorage
- 后续请求手动添加 `Authorization: Bearer <token>` header
- 通过 `GET /api/auth/me` 获取当前用户（后续实现）
- 登出：清除 localStorage
