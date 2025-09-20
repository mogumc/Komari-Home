<template>
  <div class="container">
    <div class="page-header">
      MoGuQAQ的网址集
    </div>
    <div class="center">
      <SiteList :sites="sites" />
    </div>
    <div style="height: 60px"></div>
    <Footer />
  </div>
</template>

<script setup>
import SiteList from '@/pages/Layout/SiteList.vue'
import Footer from '@/pages/Layout/Footer.vue'

const sites = [
  { name: "博客", icon: 'bootstrap-fill', url: 'https://blog.moguq.top' },
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
  box-sizing: border-box;
  gap: 1.5rem;
}

.page-header {
  width: 100%;
  max-width: 1200px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  border-radius: 12px;
  z-index: 9997;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.center {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>