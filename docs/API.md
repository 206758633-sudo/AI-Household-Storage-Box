# 云函数 API

统一云函数名：`storage_box_api`

调用格式：

```js
wx.cloud.callFunction({
  name: 'storage_box_api',
  data: {
    action: 'list_entries',
    payload: {}
  }
});
```

## Actions

| action | payload | 返回 |
|---|---|---|
| `list_entries` | `{}` | `{ entries }` |
| `create_entry` | `{ rawText, persona }` | `{ entries, entryId, label, reply, aiSource }` |
| `refine_entry` | `{ entryId }` | `{ entries, refined, label, reply }` |
| `delete_entry` | `{ entryId }` | `{ entries }` |
| `update_checkin` | `{ entryId }` | `{ entries, reply }` |
| `clear_entries` | `{}` | `{ entries }` |
| `get_monthly_report` | `{ persona }` | `{ report, summary }` |

## 错误格式

```json
{
  "ok": false,
  "message": "服务暂不可用"
}
```

## 速度策略

`create_entry` 只使用本地规则快速归档并立即返回。前端拿到 `entryId` 后再异步调用 `refine_entry`，由 AI 复核分类和字段。这样用户可以先看到卡片出现，不被模型响应速度阻塞。
