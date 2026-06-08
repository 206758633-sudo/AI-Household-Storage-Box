# 配置说明

## 小程序配置

文件：`mini_program/miniprogram/config/env.js`

```js
cloudEnvId: 'YOUR_CLOUD_ENV_ID'
```

将占位符替换为微信云开发环境 ID。

## 云函数环境变量

云函数：`storage_box_api`

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `LLM_API_KEY` | 是 | 无 | OpenAI 兼容模型 API Key |
| `LLM_MODEL` | 否 | `hunyuan-turbos-latest` | 模型名 |
| `LLM_BASE_URL` | 否 | `https://api.hunyuan.cloud.tencent.com/v1` | OpenAI 兼容接口地址 |
| `LLM_TIMEOUT_MS` | 否 | `3000` | AI 复核超时时间 |

不要把真实 Key 写入仓库。

兼容旧变量：`HUNYUAN_API_KEY`、`HUNYUAN_MODEL`、`HUNYUAN_BASE_URL`。
