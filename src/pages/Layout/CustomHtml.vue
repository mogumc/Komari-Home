<template>
  <div class="custom-html" v-if="html" v-html="html"></div>
</template>

<script setup>
defineProps({
  html: { type: String, default: '' }
})
</script>

<style scoped>
.custom-html {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.2rem;
  color: #eee;
}
</style>
