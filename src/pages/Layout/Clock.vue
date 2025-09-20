<template>
  <div class="module">
    <h3><i class="bi bi-clock-fill"></i> 时钟</h3>
    <div class="date">{{ date }}</div>
    <div class="clock">{{ time }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const time = ref('--:--:--')
const date = ref('--')

const updateClock = () => {
  const now = new Date()
  time.value = now.toLocaleTimeString()
  date.value = now.toLocaleDateString()
}

onMounted(() => {
  updateClock()
  setInterval(updateClock, 1000)
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

.date {
  font-size: 0.9rem;
  color: #bbb;
  font-weight: normal;
}

.clock {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ccc;
}
</style>