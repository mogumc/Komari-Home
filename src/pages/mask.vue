<script setup>
function Try_load(){
    window.addEventListener('load', () => {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 400);
      }
    });
}
Try_load();
</script>

<template>
    <div id="loading" class="loading">正在加载...</div>
</template>

<style scoped>
  .loading {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      background: #111;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2rem;
      color: white;
      font-weight: bold;
      transition: opacity 0.4s ease;
    }
</style>