<template>
  <div id="app">
    <!-- 背景 -->
    <div class="background"></div>

    <!-- 遮罩层 -->
    <Mask />

    <!-- 主内容 -->
    <div class="main-content">
      <router-view />
    </div>

    <!-- 页脚 -->
    <footer>
      <Foot />
    </footer>
  </div>
</template>

<script setup>
import Mask from '@/pages/mask.vue'
import Foot from '@/pages/foot.vue'
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Segoe UI", sans-serif;
  position: relative;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://t.alcy.cc/ycy/') no-repeat center center fixed;
  background-size: cover;
  z-index: -2;
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

#app::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  z-index: -1;
}

footer {
  position: relative;
  z-index: 1;
}
</style>
