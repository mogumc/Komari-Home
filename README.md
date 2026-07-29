<div align="center">
  <h1>Komari-Home</h1>
  <h3>让你的探针变为你的个人主页！</h3>
  <img src="preview.png" width="100%" alt="预览图" />
</div>

---

### 🔧 项目介绍

基于 [Komari](https://github.com/komari-monitor/komari) 探针的主题化个人主页。将服务器监控、网址导航、RSS 订阅、自定义 HTML 整合为统一美观的界面，所有内容通过 Komari 后台**动态配置**。

### ✨ 功能

**首页**
- 个人信息：头像、昵称、简介、所在地、社交链接
- 一言引用 + 实时时钟（可独立开关）
- RSS 订阅（最多 4 条，自动解析 RSS/Atom）
- 自定义 HTML 模块
- 快速链接导航

**网址导航**
- 分类卡片展示，支持图标和描述

**服务器监控**
- 实时 CPU / 内存 / 网络 / 运行时间
- 按分组筛选 + 标签展示
- 排序：原顺序 / 按名称 / 按分组，支持在线靠前
- 自适应分页（后台配置行数）
- 单节点详情：硬件信息、性能指标、延迟监控

**主题化**
- 全部内容通过 `komari-theme.json` 声明动态配置
- 支持 Komari >= 1.0.5 的 managed 配置面板
- 数据通过 `/api/rpc2` JSON-RPC 2.0 接口获取

### ⚙️ 安装

1. 在 Komari 后台 → 主题 → 上传 `komari-home-v{version}-{hash}.zip`
2. 启用主题
3. 在主题设置面板填入个人信息与站点配置

### 🚀 开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建
```

### 🛠 技术栈

- Vue 3 + Vue Router 4 + Vite 7
- Bootstrap Icons
- Komari JSON-RPC 2.0 API

### 📄 许可

[MIT License](https://opensource.org/licenses/MIT)
