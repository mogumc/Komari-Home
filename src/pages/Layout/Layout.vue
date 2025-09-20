<template>
  <div class="container">
    <slot name="left"></slot>
    <slot name="right"></slot>
    <Footer />
  </div>
</template>

<script setup>
import Footer from './Footer.vue'
</script>

<style scoped>
.container {
  display: flex;
  width: 90%;
  max-width: 1200px;
  gap: 2rem;
  padding: 2rem;
  box-sizing: border-box;
  flex-wrap: wrap;
}
</style>