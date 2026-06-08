# mini_program

微信小程序工程目录。

## 目录

- `miniprogram/`: 小程序前端源码。
- `cloud_functions/`: 微信云开发云函数源码。
- `package.json`: 本地测试脚本。

## 配置

1. 在微信开发者工具中导入本目录。
2. 将 `miniprogram/config/env.js` 中的 `cloudEnvId` 改为你的云开发环境 ID。
3. 在云函数 `storage_box_api` 的环境变量中配置 `LLM_API_KEY`。
4. 上传并部署云函数。

AI Key 不要写入前端文件或 Git 仓库。旧变量 `HUNYUAN_API_KEY` 仍兼容，但新配置优先使用 `LLM_API_KEY`。
