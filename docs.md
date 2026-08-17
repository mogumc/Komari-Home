# Komari-Home 配置指南

本文档详细说明主题设置面板中需要用 JSON 填写的配置项，并提供 AI 提示词帮助零基础用户快速生成配置。

---

## 目录

- [图标说明](#图标说明)
- [社交链接 (socialLinks)](#社交链接-sociallinks)
- [首页快速链接 (homeSites)](#首页快速链接-homesites)
- [网址导航 (webSites)](#网址导航-websites)
- [AI 提示词](#ai-提示词)

---

## 图标说明

所有 JSON 配置中的 `icon` 字段均使用 [Bootstrap Icons](https://icons.getbootstrap.com/) 图标名称。

**如何查找图标：**

1. 打开 [https://icons.getbootstrap.com/](https://icons.getbootstrap.com/)
2. 搜索或浏览找到想要的图标
3. 复制图标名称（去掉 `bi-` 前缀）

例如：图标 `<i class="bi bi-github"></i>` 的名称为 `github`

**常用图标速查：**

| 名称        |     图标标识     | 适用场景                     |
| :---------- | :--------------: | :--------------------------- |
| GitHub      |    `github`    | 代码仓库                     |
| Twitter / X |  `twitter-x`  | 社交媒体                     |
| Telegram    |   `telegram`   | 即时通讯                     |
| Discord     |   `discord`   | 社群                         |
| YouTube     |   `youtube`   | 视频平台                     |
| Bilibili    | `play-circle` | B 站（无官方图标，可用替代） |
| 邮箱        |   `envelope`   | Email                        |
| 博客        | `journal-text` | 个人博客                     |
| 网站        |    `globe2`    | 通用网站                     |
| 链接        |  `link-45deg`  | 通用链接                     |
| RSS         |     `rss`     | RSS 订阅                     |
| Steam       |    `steam`    | 游戏平台                     |
| 微信        |    `wechat`    | 微信                         |
| 支付宝      |    `alipay`    | 支付宝                       |
| 云          |    `cloud`    | 云服务                       |
| 星星        |     `star`     | 收藏/推荐                    |

---

## 社交链接 (socialLinks)

显示在首页头部头像**右侧**，以小图标按钮形式展示，鼠标悬停显示名称。

**位置**：主题设置面板 → 「社交链接 (JSON)」

### 数据结构

```json
[
  {
    "name": "显示名称",
    "icon": "图标标识",
    "url": "https://完整链接"
  }
]
```

| 字段     |  类型  | 必填 | 说明                                         |
| :------- | :----: | :--: | :------------------------------------------- |
| `name` | 字符串 |  ✅  | 鼠标悬停时显示的 Tooltip 文字                |
| `icon` | 字符串 |  ✅  | Bootstrap Icons 图标名称（不含`bi-` 前缀） |
| `url`  | 字符串 |  ✅  | 点击后跳转的完整 URL                         |

### 示例

```json
[
  { "name": "GitHub", "icon": "github", "url": "https://github.com/yourname" },
  { "name": "Twitter", "icon": "twitter-x", "url": "https://x.com/yourname" },
  { "name": "邮箱", "icon": "envelope", "url": "mailto:you@example.com" },
  { "name": "Telegram", "icon": "telegram", "url": "https://t.me/yourname" }
]
```

---

## 首页快速链接 (homeSites)

显示在首页**底部**，以网格卡片形式展示，响应式 2~5 列自适应布局。点击卡片在新标签页打开链接。

**位置**：主题设置面板 → 「首页快速链接」→ 先打开**启用**开关，再填写「链接列表 (JSON)」

### 数据结构

与社交链接完全相同：

```json
[
  {
    "name": "显示名称",
    "icon": "图标标识",
    "url": "https://完整链接"
  }
]
```

| 字段     |  类型  | 必填 | 说明                                         |
| :------- | :----: | :--: | :------------------------------------------- |
| `name` | 字符串 |  ✅  | 卡片上显示的网站名称                         |
| `icon` | 字符串 |  ✅  | Bootstrap Icons 图标名称（不含`bi-` 前缀） |
| `url`  | 字符串 |  ✅  | 点击后跳转的完整 URL                         |

> **与社交链接的区别**：`socialLinks` 是头像旁的小图标按钮（hover 显示名称），`homeSites` 是首页底部的卡片网格（始终显示名称）。

### 示例

```json
[
  { "name": "GitHub", "icon": "github", "url": "https://github.com" },
  { "name": "个人博客", "icon": "journal-text", "url": "https://blog.example.com" },
  { "name": "Google", "icon": "google", "url": "https://google.com" },
  { "name": "YouTube", "icon": "youtube", "url": "https://youtube.com" },
  { "name": "知乎", "icon": "question-circle", "url": "https://zhihu.com" },
  { "name": "Gmail", "icon": "envelope", "url": "https://mail.google.com" }
]
```

---

## 网址导航 (webSites)

显示在**网址导航页面**（导航栏「网址导航」入口），以卡片列表形式展示，每个卡片包含图标、名称和描述。

**位置**：主题设置面板 → 「网址导航」→「链接列表 (JSON)」

### 数据结构

比前两者多一个 `desc` 字段：

```json
[
  {
    "name": "显示名称",
    "icon": "图标标识",
    "desc": "简短描述",
    "url": "https://完整链接"
  }
]
```

| 字段     |  类型  | 必填 | 说明                                         |
| :------- | :----: | :--: | :------------------------------------------- |
| `name` | 字符串 |  ✅  | 卡片标题                                     |
| `icon` | 字符串 |  ✅  | Bootstrap Icons 图标名称（不含`bi-` 前缀） |
| `desc` | 字符串 |  ✅  | 卡片描述文字                                 |
| `url`  | 字符串 |  ✅  | 点击后跳转的完整 URL                         |

### 示例

```json
[
  { "name": "GitHub", "icon": "github", "desc": "代码托管与协作平台", "url": "https://github.com" },
  { "name": "V2EX", "icon": "chat-dots", "desc": "创意工作者的社区", "url": "https://v2ex.com" },
  { "name": "Cloudflare", "icon": "cloud", "desc": "CDN 与网络安全服务", "url": "https://cloudflare.com" },
  { "name": "Notion", "icon": "file-earmark-text", "desc": "一体化协作与笔记工具", "url": "https://notion.so" }
]
```

---

## AI 提示词

如果你不熟悉 JSON 格式，可以复制下面的提示词发送给任意 AI 助手（ChatGPT、Claude、Gemini、Kimi 等），只需把【】内的内容替换成你自己的信息即可。

### 提示词 1：生成社交链接 (socialLinks)

```
请帮我生成一段 Komari-Home 主题的「社交链接」JSON 配置。

格式要求：输出一个 JSON 数组，每个元素必须且仅包含 name、icon、url 三个字段，不要添加任何其他字段。icon 使用 Bootstrap Icons 图标名（不含 bi- 前缀）。仅输出 JSON，不要任何额外说明。

严格参照以下示例的格式输出，只替换内容，不要改变字段名和结构：

[
  { "name": "GitHub", "icon": "github", "url": "https://github.com/demo" },
  { "name": "邮箱", "icon": "envelope", "url": "mailto:demo@example.com" }
]

我的社交账号信息如下（仅根据以下列表生成，示例仅作格式参考，不要包含示例中的数据）：
- 【GitHub】: 【https://github.com/yourname】
- 【Twitter/X】: 【https://x.com/yourname】
- 【邮箱】: 【you@example.com】
- 【Telegram】: 【https://t.me/yourname】
```

### 提示词 2：生成首页快速链接 (homeSites)

```
请帮我生成一段 Komari-Home 主题的「首页快速链接」JSON 配置。

格式要求：输出一个 JSON 数组，每个元素必须且仅包含 name、icon、url 三个字段，不要添加任何其他字段。icon 使用 Bootstrap Icons 图标名（不含 bi- 前缀）。仅输出 JSON，不要任何额外说明。

严格参照以下示例的格式输出，只替换内容，不要改变字段名和结构：

[
  { "name": "GitHub", "icon": "github", "url": "https://github.com" },
  { "name": "个人博客", "icon": "journal-text", "url": "https://blog.demo.com" },
  { "name": "Gmail", "icon": "envelope", "url": "https://mail.google.com" }
]

以下是我需要的完整网站列表（仅根据以下列表生成，示例仅作格式参考，不要包含示例中的数据）：
- 【GitHub】→【https://github.com】
- 【Google】→【https://google.com】
- 【个人博客】→【https://blog.example.com】
- 【YouTube】→【https://youtube.com】
- 【知乎】→【https://zhihu.com】
- 【Gmail】→【https://mail.google.com】
```

### 提示词 3：生成网址导航 (webSites)

```
请帮我生成一段 Komari-Home 主题的「网址导航」JSON 配置。

格式要求：输出一个 JSON 数组，每个元素必须且仅包含 name、icon、desc、url 四个字段，不要添加任何其他字段。icon 使用 Bootstrap Icons 图标名（不含 bi- 前缀）。仅输出 JSON，不要任何额外说明。

严格参照以下示例的格式输出，只替换内容，不要改变字段名和结构：

[
  { "name": "GitHub", "icon": "github", "desc": "代码托管与协作平台", "url": "https://github.com" },
  { "name": "Cloudflare", "icon": "cloud", "desc": "CDN 与网络安全服务", "url": "https://cloudflare.com" }
]

以下是我需要的完整导航站点列表（仅根据以下列表生成，示例仅作格式参考，不要包含示例中的数据）：
- 【GitHub】- 【代码托管平台】- 【https://github.com】
- 【V2EX】- 【创意工作者社区】- 【https://v2ex.com】
- 【Cloudflare】- 【CDN 与网络安全】- 【https://cloudflare.com】
- 【Notion】- 【协作笔记工具】- 【https://notion.so】
```

### 提示词 4：一次性生成全部配置

```
我正在使用 Komari-Home 个人主页主题，请帮我一次性生成以下三份 JSON 配置。每份仅输出纯 JSON，不要额外说明。所有字段名必须与示例完全一致，不要添加或修改任何字段名。

1.「社交链接」— JSON 数组，每项含 name / icon / url
   示例：[{ "name": "GitHub", "icon": "github", "url": "https://github.com/demo" }]
   我的社交账号如下（仅根据此列表生成）：【GitHub: https://github.com/yourname, Twitter: https://x.com/yourname, 邮箱: you@example.com】

2.「首页快速链接」— JSON 数组，每项含 name / icon / url
   示例：[{ "name": "GitHub", "icon": "github", "url": "https://github.com" }, { "name": "博客", "icon": "journal-text", "url": "https://blog.demo.com" }]
   我需要的完整网站列表如下（仅根据此列表生成）：【GitHub, Google, YouTube, 个人博客 https://blog.example.com, Gmail】

3.「网址导航」— JSON 数组，每项含 name / icon / desc / url
   示例：[{ "name": "GitHub", "icon": "github", "desc": "代码托管平台", "url": "https://github.com" }]
   我需要的完整导航站点列表如下（仅根据此列表生成）：【GitHub 代码托管, V2EX 技术社区, Cloudflare CDN服务, Notion 笔记工具】

icon 全部使用 Bootstrap Icons 图标名（不含 bi- 前缀），从 https://icons.getbootstrap.com 中选择最匹配的图标。
```

---

## 常见问题

**Q：JSON 粘贴后报错？**
A：确保是合法的 JSON 格式。常见错误：末尾多了逗号、使用了中文引号 `""` 而非英文引号 `""`、字段名没有加引号。可以使用 [JSON 校验工具](https://jsonlint.com/) 在线检查。

**Q：图标不显示？**
A：检查 `icon` 字段是否填写了正确的 Bootstrap Icons 名称（不含 `bi-` 前缀）。到 [icons.getbootstrap.com](https://icons.getbootstrap.com/) 确认图标是否存在。

**Q：快速链接不显示？**
A：确认「启用」开关已打开，且 JSON 数组不为空 `[]`。

**Q：社交链接和快速链接的 JSON 格式一样吗？**
A：是的，两者结构完全相同（`name` / `icon` / `url`），区别仅在于展示位置和样式不同。
