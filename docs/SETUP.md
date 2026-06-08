# 部署与启动

## 前置条件

- 微信开发者工具
- 已开通微信云开发环境
- 已开通腾讯云混元 API Key

## 步骤

1. 在微信开发者工具中导入 `mini_program/`。
2. 修改 `mini_program/miniprogram/config/env.js` 的 `cloudEnvId`。
3. 在云开发数据库中创建集合 `entries`。
4. 右键 `cloud_functions/storage_box_api`，安装依赖并上传部署。
5. 在云函数配置里设置 `HUNYUAN_API_KEY`。
6. 编译运行小程序。

## 本地测试

```bash
cd mini_program
npm test
```

