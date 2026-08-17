<div align="center">

<img src="logo.png" width="120" alt="Komari-Home" />

# Komari-Home

**让你的探针变为你的个人主页！**

[![Komari](https://img.shields.io/badge/Komari-%3E%3D%201.3.0-blue)](https://github.com/komari-monitor/komari)
[![Vue](https://img.shields.io/badge/Vue-3.5-42b883)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-orange)](https://opensource.org/licenses/MIT)

[功能一览](#-功能一览) · [快速开始](#-安装) · [配置指南](docs.md) · [开发](#-开发)

<img src="preview.png" width="100%" alt="预览图" />

</div>

---

## 📖 项目介绍

Komari-Home 是基于 [Komari](https://github.com/komari-monitor/komari) 探针的**主题化个人主页**。它将服务器监控、网址导航、RSS 订阅、自定义 HTML 整合为一个统一的界面，所有内容通过 Komari 后台**动态配置**——无需修改代码，在管理面板即可完成全部自定义。

## ✨ 功能一览

| 模块 | 说明 |
|:---|:---|
| **个人信息** | 头像、昵称、简介、所在地、社交链接（hover 显示名称） |
| **一言 & 时钟** | 随机一言引用 + 实时时钟组件，可独立开关 |
| **RSS 订阅** | 自动解析 RSS/Atom 格式，最多展示 4 条 |
| **自定义 HTML** | 任意 HTML 片段，直接渲染在首页 |
| **快速链接** | 首页底部图标网格导航，响应式 2~5 列自适应 |
| **网址导航** | 独立页面，分类卡片展示，支持图标和描述 |
| **服务器监控** | 实时 CPU / 内存 / 网络 / 运行时间，分组筛选、排序、分页 |
| **节点详情** | 硬件信息、性能图表（SVG）、延迟热力图 |
| **月计费** | 可选显示每月成本统计与到期滚动提示 |
| **主题化** | 全部内容通过 `komari-theme.json` + 后台面板配置 |

## 🚀 安装

> 需要 Komari >= 1.3.0

**第一步** — 在 [Releases](https://github.com/mogumc/Komari-Home/releases) 下载最新版本的主题包 `komari-home-v{version}.zip`

**第二步** — 进入 Komari 后台 → **主题管理** → 上传主题包

**第三步** — 启用主题，在**主题设置面板**中填写个人信息与站点配置

_在官方源搜索 **Home** 即可找到本主题。_

> 💡 不知道 JSON 怎么填？查看 [配置指南](docs.md)，内含详细说明和 AI 提示词，复制粘贴即可生成。

## ⚙️ 配置速览

主题所有可配置项均在 `komari-theme.json` 中声明，安装后通过 Komari 后台的**主题设置面板**进行编辑。

| 配置项 | 类型 | 说明 |
|:---|:---:|:---|
| 头像链接 | 文本 | 头像图片 URL |
| 显示名称 | 文本 | 首页昵称 |
| 个人简介 | 文本 | 简短签名 |
| 所在地 | 文本 | 如：中国 · 上海 |
| 社交链接 | JSON | 头像右侧图标按钮，`name` / `icon` / `url` |
| 首页快速链接 | JSON | 首页底部网格导航，`name` / `icon` / `url` |
| 网址导航 | JSON | 导航页卡片列表，`name` / `icon` / `desc` / `url` |
| RSS 订阅 | 开关 + URL | RSS/Atom 订阅源 |
| 自定义 HTML | 富文本 | 任意 HTML 片段 |
| 背景图片 | 文本 | 全屏背景图 URL |
| 一言 / 时钟 | 开关 | 独立控制显示 |
| 监控排序 | 下拉 | 原顺序 / 分类 / 名字 |
| 每页行数 | 数字 | 服务器列表分页大小 |

> 📖 每项 JSON 的详细格式、示例和 AI 生成提示词请查看 → [配置指南](docs.md)

## 🛠 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（使用 mock 数据）
npm run dev

# 生产构建
npm run build
```

**技术栈**：Vue 3 + Vue Router 4 + Vite 7 · Bootstrap Icons · Komari JSON-RPC 2.0 API

## 📄 许可

[MIT License](https://opensource.org/licenses/MIT) — Copyright © 2025 MoGuQAQ
