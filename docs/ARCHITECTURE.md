# 架构说明

## 模块关系

```text
微信小程序 UI
  -> miniprogram/services/cloud-api.js
  -> wx.cloud.callFunction(storage_box_api)
  -> 云数据库 entries
  -> OpenAI 兼容 LLM 接口
```

## 分层

- `miniprogram/pages/index/`: 页面展示与用户交互。
- `miniprogram/services/`: 小程序端云函数适配器。
- `miniprogram/core/`: 纯业务规则、日期计算、月报统计和卡片视图模型。
- `cloud_functions/storage_box_api/`: 云函数后端，负责数据库读写、AI 调用和本地兜底归档。

## 关键边界

- 前端不保存腾讯云 AI Key。
- 云函数通过 `LLM_API_KEY` 环境变量调用 OpenAI 兼容模型。
- 新增记录先走本地关键词路由并立即返回，AI 只做后台复核。
- AI 失败或未配置 Key 时，记录仍由本地规则完成归档，保证主链可用。
- 小程序端云函数未配置或 2.5 秒内无响应时，自动切换到本地测试存储，避免开发者工具超时报错阻塞验证。
- 数据按微信 openid 隔离，集合为 `entries`。
