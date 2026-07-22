<template>
  <div class="not-found">
    <div class="glass-card">
      <div class="error-code">404</div>
      <div class="error-msg">页面飞往了外星！</div>
      <p class="error-desc">你访问的页面不存在或已被移除</p>
      <router-link to="/" class="back-btn">
        <i class="bi bi-house-fill"></i> 返回首页
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  width: 100%;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem 4rem;
  text-align: center;
  color: #fff;
}

.error-code {
  font-size: 5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
  margin-bottom: 1rem;
}

.error-msg {
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
}

.error-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.25s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .glass-card {
    padding: 2rem;
  }
  .error-code {
    font-size: 3.5rem;
  }
}
</style>
