# 数据模型

集合：`entries`

所有记录共享字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `_openid` | string | 微信用户 openid |
| `type` | string | `countdown/checkin/ledger/asset/subscription/note` |
| `rawText` | string | 用户原话 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |
| `aiSource` | string | `hunyuan/local` |

## 类型字段

- `countdown`: `title/date/recurring/person/sub`
- `checkin`: `name/count/history/cat`
- `ledger`: `title/amount/cat/date`
- `asset`: `name/price/buyDate/needDate/cat/status`
- `subscription`: `name/cycle/price/billDate/cat`
- `note`: `text/mood/tags/date`

