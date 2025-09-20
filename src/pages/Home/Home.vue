<template>
  <MainLayout>
    <template #left>
      <div class="left">
        <div class="avatar">
          <img src="https://avatars.githubusercontent.com/u/67809394" alt="头像">
        </div>
        <div class="contact-info">
          <p><img width="200" height="25" src="https://glitch-art.vercel.app/api/simple?word=Hi%20I'm%20MoGuQAQ&font=Doto" /></p>
          <p>中国 · 全栈开发者</p>
          <p>大数据 · Go · Java · Vue</p>
        </div>
        <SiteList :sites="socials" />
      </div>
    </template>

    <template #right>
      <div class="right">
        <div class="top-modules">
          <Hitokoto />
          <Clock />
        </div>
        <SiteList :sites="sites" />
        <div style="height: 60px"></div>
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/pages/Layout/Layout.vue'
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
.left {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 3px solid white;
  overflow: hidden;
  margin-bottom: 1rem;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-info {
  background: rgba(255, 255, 255, 0.08);
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255, 0.1);
  width: 100%;
}

.contact-info p {
  margin: 0.3rem 0;
  color: white;
}

.right {
  flex: 2;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.top-modules {
  display: flex;
  gap: 1rem;
}

@media (max-width: 375px) {
  .top-modules {
    flex-direction: column;
  }
}
</style>