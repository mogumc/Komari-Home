<template>
  <div class="rss-module" v-if="items.length || loading">
    <h3 class="rss-title" v-if="feedTitle">
      <i class="bi bi-rss-fill"></i> {{ feedTitle }}
    </h3>
    <div class="rss-items">
      <a
        v-for="item in items"
        :key="item.link"
        :href="item.link"
        target="_blank"
        class="rss-item"
      >
        <span class="rss-item-title">{{ item.title }}</span>
        <span class="rss-item-time">{{ formatTime(item.pubDate) }}</span>
      </a>
    </div>
    <div v-if="error" class="rss-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  url: { type: String, default: '' }
})

const items = ref([])
const feedTitle = ref('')
const loading = ref(true)
const error = ref('')

function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

async function fetchRss(url) {
  if (!url) return
  loading.value = true
  error.value = ''

  try {
    // 优先通过 rss2json 代理（解决跨域）
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
    const data = await res.json()
    if (data.status === 'ok') {
      feedTitle.value = data.feed?.title || ''
      items.value = (data.items || []).slice(0, 4)
      return
    }
    throw new Error(data.message || 'parse error')
  } catch {
    // rss2json 失败，尝试直接请求 + DOMParser
    try {
      const res = await fetch(url)
      const text = await res.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')

      // RSS 2.0
      const channel = doc.querySelector('channel')
      if (channel) {
        feedTitle.value = channel.querySelector('title')?.textContent || ''
        const entries = channel.querySelectorAll('item')
        items.value = Array.from(entries).slice(0, 4).map(el => ({
          title: el.querySelector('title')?.textContent || '',
          link: el.querySelector('link')?.textContent || '',
          pubDate: el.querySelector('pubDate')?.textContent || ''
        }))
        return
      }

      // Atom
      const feed = doc.querySelector('feed')
      if (feed) {
        feedTitle.value = feed.querySelector('title')?.textContent || ''
        const entries = feed.querySelectorAll('entry')
        items.value = Array.from(entries).slice(0, 4).map(el => ({
          title: el.querySelector('title')?.textContent || '',
          link: el.querySelector('link')?.getAttribute('href') || '',
          pubDate: el.querySelector('updated')?.textContent || el.querySelector('published')?.textContent || ''
        }))
        return
      }

      throw new Error('unsupported format')
    } catch (e) {
      error.value = 'RSS 加载失败'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.url) fetchRss(props.url)
})

onMounted(() => {
  if (props.url) fetchRss(props.url)
})

watch(() => props.url, (val) => {
  if (val) fetchRss(val)
})
</script>

<style scoped>
.rss-module {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.2rem;
}

.rss-title {
  color: #fff;
  font-size: 1rem;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rss-title i {
  color: #eee;
}

.rss-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rss-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: color 0.2s;
}

.rss-item:last-child {
  border-bottom: none;
}

.rss-item:hover {
  color: #fff;
}

.rss-item-title {
  flex: 1;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 1rem;
}

.rss-item-time {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  flex-shrink: 0;
}

.rss-error {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}
</style>
