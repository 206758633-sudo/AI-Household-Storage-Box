# AI Household Storage Box

AI 生活收纳盒项目仓库。

## 项目简介

一个微信小程序版生活记录收纳盒：用户只需要说一句话，系统用微信云开发持久化记录，并通过腾讯云混元 AI 或本地规则把内容归到倒数、打卡、记账、资产、订阅、随手记六类。

## 快速开始

1. 使用微信开发者工具导入 `mini_program/`。
2. 将 `mini_program/miniprogram/config/env.js` 中的 `YOUR_CLOUD_ENV_ID` 替换为你的云开发环境 ID。
3. 创建云数据库集合 `entries`。
4. 在云函数 `storage_box_api` 配置环境变量 `HUNYUAN_API_KEY`。
5. 上传并部署 `mini_program/cloud_functions/storage_box_api/`。

## 功能列表

- 一句话输入，自动归档到 6 类生活记录。
- 微信云数据库持久化，按用户 openid 隔离。
- 腾讯云混元 AI 归档，失败时本地规则兜底。
- 首页全部频道、状态筛选、类目侧边栏、详情删除、打卡 +1。
- 生活月报统计与 AI 总结兜底。

## 配置说明

详见 `docs/CONFIGURATION.md`。

## 目录结构

- `mini_program/`: 小程序开发相关代码文件。
- `prototype/`: 高保真交互原型文件。
- `docs/prd/`: 产品需求文档。
- `docs/handoff/`: AI 构建包与工程交接文档。
- `docs/vibe_coding_toolkit/`: Vibe Coding 工作流与协作规范文件。
- `docs/API.md`: 云函数 API 说明。
- `docs/DATA_MODEL.md`: 云数据库数据模型。

## 测试

```bash
cd mini_program
npm test
```

## 变更日志

详见 `docs/CHANGELOG.md`。
