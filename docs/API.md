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
| `create_entry` | `{ rawText, persona }` | `{ entries, label, reply, aiSource }` |
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

