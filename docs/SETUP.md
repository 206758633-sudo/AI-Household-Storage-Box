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
5. 在云函数配置里设置 `LLM_API_KEY`。
6. 编译运行小程序。

## 本地测试

```bash
cd mini_program
npm test
```

## 开发者工具测试模式

如果 `miniprogram/config/env.js` 仍是 `YOUR_CLOUD_ENV_ID`，或云函数调用超时，小程序会自动使用本地测试存储。此模式可以验证页面、分类、打卡、删除和月报基础交互；完成云开发配置并重新部署云函数后，会自动走云端。
