<template>
  <footer>
    <div class="fixed-blur-footer">
      <span>
        Copyright&nbsp;©&nbsp;2025 
        <a href="https://www.moguq.top" target="_blank">MoGuQAQ</a>
      </span>
    </div>
  </footer>
</template>

<style scoped>
.fixed-blur-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255, 0.1);
  padding: 1rem;
  text-align: center;
}

.fixed-blur-footer a {
  color: #fff;
  text-decoration: none;
  margin-left: 5px;
}

.fixed-blur-footer a:hover {
  color: #409EFF;
}
</style>