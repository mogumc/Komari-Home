<template>
  <div class="sites-container">
    <div 
      class="site-block" 
      v-for="item in sites" 
      :key="item.name" 
      @click="goto(item.url)"
    >
      <i :class="['bi', 'bi-' + item.icon]"></i>
      <span class="site-title">{{ item.name }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  sites: {
    type: Array,
    required: true,
    default: () => []
  }
})

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
.sites-container {
  display: grid;
  flex-wrap: wrap;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.site-block {
  min-width: 140px;
  background: rgba(255, 255, 255, 0.06);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: center;
  color: #eee;
  font-size: 2rem;
}

.site-block:hover {
  background: rgba(255, 255, 255, 0.1);
}

.site-title {
  font-size: 1rem;
  font-weight: bold;
}

@media (max-width: 375px) {
  .sites-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>