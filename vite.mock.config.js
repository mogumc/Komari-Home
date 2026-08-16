// 临时测试配置：拦截 /api/rpc2 返回模拟主题设置，用于验证长文本渲染。验证后删除。
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const themeSettings = {
  displayName: '测试用户',
  location: '上海',
  bio: '这是一段个人简介',
  enableHomeSites: true,
  enableHitokoto: false,
  enableClock: false,
  enableRssFeed: false,
  enableCustomHtml: false,
  socialLinks: [],
  avatarUrl: '',
  homeSites: [
    { name: 'GitHub', icon: 'github', url: 'https://github.com' },
    { name: '这是一个相当长的站点名称测试用', icon: 'link-45deg', url: 'https://example.com' },
    { name: '博客', icon: 'journal-text', url: 'https://example.com' },
    { name: 'Extremely Long Latin Website Name', icon: 'globe2', url: 'https://example.com' },
    { name: '短', icon: 'star', url: 'https://example.com' },
    { name: '再一个比较长的中文名称看看效果', icon: 'cloud', url: 'https://example.com' }
  ],
  webSites: [
    { name: 'GitHub', desc: '代码托管与协作平台', icon: 'github', url: 'https://github.com' },
    { name: '这是一个非常非常长的网址导航站点名称用来测试自动缩小字体', desc: '这是一段很长的简介，用来验证 bio 现在允许分行显示，超长内容不会再被省略号截断，其中还包含一个很长的链接 https://example.com/a/very/long/path/segment/to/ensure/wrapping 也应该正常换行。', icon: 'link-45deg', url: 'https://example.com' },
    { name: '短', desc: '短简介', icon: 'globe2', url: 'https://example.com' }
  ]
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'mock-rpc',
      configureServer(server) {
        server.middlewares.use('/api/rpc2', (req, res) => {
          let body = ''
          req.on('data', (c) => { body += c })
          req.on('end', () => {
            let id = 1
            try { id = JSON.parse(body).id } catch {}
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: { theme_settings: themeSettings, sitename: 'Komari 测试站' }
            }))
          })
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
