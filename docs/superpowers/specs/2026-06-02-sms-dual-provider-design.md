# SMS Dual Provider Design

**Date:** 2026-06-02

## Summary

在 `src/lib/sms.ts` 中新增阿里云 `SendSmsVerifyCode` 渠道，与现有 Unisms 并列。调用方通过 `provider` 参数选择渠道，接口统一。

## Interface

```ts
sendSmsCode(options: {
  phone: string
  code?: string                    // unisms 必传，aliyun 不需要
  provider?: "unisms" | "aliyun"   // 默认 "unisms"
}): Promise<string>                 // 返回验证码
```

- `provider` 默认 `"unisms"`，现有调用处无需改动
- unisms：返回调用方传入的 `code`
- aliyun：调用 `SendSmsVerifyCode`，从 `ReturnVerifyCode` 取回验证码返回
- 两个渠道的差异完全由 `sms.ts` 内部消化

## File Structure

```
src/lib/sms.ts          # 公开接口 sendSmsCode()，负责路由分发
src/lib/sms-unisms.ts   # Unisms 实现（现有逻辑移入）
src/lib/sms-aliyun.ts   # 阿里云 SendSmsVerifyCode 实现
```

## Aliyun Configuration

凭据使用默认凭据链（环境变量 `ALIBABA_CLOUD_ACCESS_KEY_ID` / `ALIBABA_CLOUD_ACCESS_KEY_SECRET`），无需代码指定。

额外业务配置通过环境变量：

```env
ALIBABA_CLOUD_SMS_SIGN_NAME="xxGame"
ALIBABA_CLOUD_SMS_TEMPLATE_CODE="SMS_XXXXXXX"
```

## Verification Flow

两个渠道的验证流程一致：调用方拿到返回的 code → 存 DB → 用户输入后本地 DB 比对。不依赖阿里云 `CheckSmsVerifyCode`。

## Error Handling

两类 SDK 的异常统一抛出，由调用方 try/catch 处理。
