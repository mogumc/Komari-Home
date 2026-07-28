<template>
  <div class="container">
    <div class="page-header">
      <i class="bi bi-grid-fill"></i> 网址导航
    </div>

    <div class="card-grid">
      <div
        v-for="item in settings.webSites"
        :key="item.name"
        class="site-card"
        @click="goto(item.url)"
      >
        <div class="card-icon">
          <i :class="['bi', 'bi-' + item.icon]"></i>
        </div>
        <div class="card-body">
          <div class="card-name">{{ item.name }}</div>
          <div class="card-desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>

    <div v-if="!settings.webSites || !settings.webSites.length" class="empty-hint">
      暂无导航站点，请在管理后台配置
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { useThemeSettings } from '@/composables/useThemeSettings'

const { settings } = useThemeSettings()

const goto = (url) => {
  const newTab = window.open(url, '_blank')
  if (newTab) {
    newTab.focus()
  } else {
    alert('跳转被浏览器拦截,请允许页面跳转')
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  gap: 1.5rem;
}

.page-header {
  width: 100%;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

.site-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.2rem;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.site-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-3px);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #66ccff;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 1.05rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  padding: 2rem;
}

@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
