<template>
  <div class="module">
    <h3><i class="bi bi-balloon-heart-fill"></i> 一言</h3>
    <p class="quote">{{ quoteText }}</p>
    <p class="quote-source" v-if="quoteAuthor">--- {{ quoteAuthor }}</p>
    <p class="quote-source" v-else>--- 未知</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const quoteText = ref('加载中...')
const quoteAuthor = ref('')

onMounted(() => {
  fetch('https://v1.hitokoto.cn/')
    .then(res => res.json())
    .then(data => {
      quoteText.value = data.hitokoto
      quoteAuthor.value = data.from
    })
    .catch(() => {
      quoteText.value = '获取失败'
      quoteAuthor.value = ''
    })
})
</script>

<style scoped>
.module {
  flex: 1;
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255, 0.1);
  padding: 1rem;
  text-align: center;
}

.quote {
  font-size: 1.1rem;
  font-style: italic;
  color: #ddd;
  margin: 0;
}

.quote-source {
  font-size: 0.9rem;
  color: #aaa;
  margin-top: 5px;
  text-align: right;
}
</style>