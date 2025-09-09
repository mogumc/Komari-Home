<script setup>
  import Mask from '@/pages/mask.vue'
  import Foot from '@/pages/foot.vue'
</script>

<template>
  <body>
    <Mask />
    <div id="Con">
      <router-view />
    </div>
  </body>
  <footer>
    <Foot />
  </footer>
</template>

<style scoped>
 * {
      box-sizing: border-box;
  }

  body {
      margin: 0;
      padding: 0;
      min-height: 100dvh;
      font-family: "Segoe UI", sans-serif;
      background: url('https://t.alcy.cc/ycy/') no-repeat center center fixed;
      background-size: cover;
      color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
  
  body::before {
      content: "";
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: -1;
    }
</style>
