<template>
  <div class="container">
    <div class="page-header">
      <div class="avatar">
        <img src="https://avatars.githubusercontent.com/u/67809394" alt="头像">
      </div>
      <div class="header-info">
        <div class="name">MoGuQAQ</div>
        <div class="bio">中国 · 全栈开发者 · 大数据 · Go · Java · Vue</div>
      </div>
      <div class="socials">
        <a
          v-for="item in socials"
          :key="item.name"
          class="social-block"
          :href="item.url"
          target="_blank"
        >
          <span class="icon-wrapper"><i :class="['bi', 'bi-' + item.icon]"></i></span>
          <span class="social-title">{{ item.name }}</span>
        </a>
      </div>
    </div>

    <div class="content">
      <div class="top-modules">
        <Hitokoto />
        <Clock />
      </div>
      <SiteList :sites="sites" />
    </div>
  </div>
</template>

<script setup>
import Hitokoto from '@/pages/Layout/Hitokoto.vue'
import Clock from '@/pages/Layout/Clock.vue'
import SiteList from '@/pages/Layout/SiteList.vue'

const sites = [
  { name: "博客", icon: 'bootstrap-fill', url: 'https://blog.moguq.top' },
]

const socials = [
  { name: "GitHub", icon: 'github', url: 'https://github.com/mogumc' },
]
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
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 1rem 1.5rem;
  border-radius: 12px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-info {
  flex: 1;
}

.name {
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
}

.bio {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.socials {
  display: flex;
  gap: 0.6rem;
}

.social-block {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #eee;
  text-decoration: none;
  transition: all 0.2s ease;
}

.social-block:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.icon-wrapper i {
  font-size: 1.1rem;
}

.social-block:hover .social-title {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) scale(1.05);
}

.social-title {
  position: absolute;
  bottom: -26px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: bold;
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s ease;
  white-space: nowrap;
  pointer-events: none;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.top-modules {
  display: flex;
  gap: 1rem;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    text-align: center;
  }

  .top-modules {
    flex-direction: column;
  }
}
</style>