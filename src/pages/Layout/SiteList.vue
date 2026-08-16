<template>
  <div class="sites-container">
    <div
      class="site-block"
      v-for="item in sites"
      :key="item.name"
      @click="goto(item.url)"
    >
      <i :class="['bi', 'bi-' + item.icon]"></i>
      <span class="site-title" v-fit-text="{ minScale: 0.65 }">{{ item.name }}</span>
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
  /* minmax(0, 1fr)：1fr 等价 minmax(auto, 1fr)，auto 最小值会被长名称
     的 min-content 撑开，把整排卡片顶出容器 */
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

.site-block {
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
  color: #eee;
  font-size: 2rem;
}

.site-block i {
  flex-shrink: 0;
}

.site-block:hover {
  background: rgba(255, 255, 255, 0.1);
}

.site-title {
  font-size: 1rem;
  font-weight: bold;
  min-width: 0;
  /* 缩到最小字号仍放不下时的最后兜底 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .sites-container { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .sites-container { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 500px) {
  .sites-container { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>