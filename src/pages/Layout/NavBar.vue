<template>
  <nav class="navbar" :class="{ hidden: navHidden }">
    <div class="nav-inner">
      <router-link to="/" class="nav-brand">
        <span class="brand-title">{{ siteName }}</span>
        <span class="brand-sep"></span>
        <span class="brand-sub">Komari Monitor</span>
      </router-link>
      <div class="nav-links">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <i :class="['bi', item.icon]"></i>
          <span>{{ item.label }}</span>
        </router-link>
        <a v-if="loggedIn" href="/admin" class="nav-item">
          <i class="bi bi-gear-fill"></i>
          <span>后台</span>
        </a>
        <a v-else class="nav-item" @click.prevent="showLogin = true">
          <i class="bi bi-box-arrow-in-right"></i>
          <span>登录</span>
        </a>
      </div>
    </div>
  </nav>

  <!-- 登录弹窗 -->
  <Teleport to="body">
    <div v-if="showLogin" class="modal-mask" @click.self="showLogin = false">
      <div class="modal-box">
        <div class="modal-header">
          <span>登录</span>
          <a class="modal-close" @click="showLogin = false"><i class="bi bi-x-lg"></i></a>
        </div>

        <div class="modal-body">
          <div v-if="!disablePasswordLogin" class="login-form">
            <input v-model="username" type="text" placeholder="用户名" class="login-input" :disabled="loginLoading" @keyup.enter="doLogin" />
            <input v-model="password" type="password" placeholder="密码" class="login-input" :disabled="loginLoading" @keyup.enter="doLogin" />
            <input v-if="require2FA" v-model="twoFac" type="text" placeholder="两步验证码" class="login-input" :disabled="loginLoading" @keyup.enter="doLogin" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button class="login-btn" @click="doLogin" :disabled="loginLoading || !username || !password">
              {{ loginLoading ? '登录中...' : '登录' }}
            </button>
          </div>

          <div v-if="oauthEnable" class="oauth-section">
            <div v-if="!disablePasswordLogin" class="oauth-divider"><span>或</span></div>
            <a href="/api/oauth" class="oauth-btn">
              <i :class="['bi', oauthIcon]"></i>
              通过 {{ oauthProviderLabel }} 登录
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { rpcCall } from '@/utils/rpc'

const route = useRoute()
const navHidden = ref(false)
const siteName = ref('Komari Home')
const loggedIn = ref(false)
const showLogin = ref(false)
const username = ref('')
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)
const require2FA = ref(false)
const twoFac = ref('')
const disablePasswordLogin = ref(false)
const oauthEnable = ref(false)
const oauthProvider = ref('')
let lastScrollY = 0

const navItems = [
  { path: '/', label: '首页', icon: 'bi-house-fill' },
  { path: '/web', label: '网址', icon: 'bi-grid-fill' },
  { path: '/komari', label: '监控', icon: 'bi-cpu-fill' },
]

const oauthIcon = computed(() => {
  const map = { github: 'bi-github', google: 'bi-google', gitlab: 'bi-gitlab' }
  return map[oauthProvider.value] || 'bi-shield-lock'
})

const oauthProviderLabel = computed(() => {
  const map = { github: 'GitHub', google: 'Google', gitlab: 'GitLab' }
  return map[oauthProvider.value] || oauthProvider.value
})

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  if (path === '/komari') return route.path === '/komari' || route.path === '/komari/instance'
  return route.path === path
}

function onScroll() {
  const y = window.scrollY
  if (y > lastScrollY && y > 60) {
    navHidden.value = true
  } else {
    navHidden.value = false
  }
  lastScrollY = y
}

function doLogin() {
  if (!username.value || !password.value) {
    loginError.value = '请输入用户名和密码'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username.value,
      password: password.value,
      ...(require2FA.value && twoFac.value ? { '2fa_code': twoFac.value } : {})
    })
  })
    .then(async res => {
      const data = await res.json()
      if (res.status === 200) {
        loggedIn.value = true
        showLogin.value = false
        window.location.href = '/admin'
      } else {
        if (data.message === '2FA code is required') {
          require2FA.value = true
          return
        }
        loginError.value = data.message || '登录失败'
      }
    })
    .catch(() => { loginError.value = '网络错误' })
    .finally(() => { loginLoading.value = false })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })

  rpcCall('public:getPublicSettings')
    .then(d => {
      if (d.sitename) siteName.value = d.sitename
      disablePasswordLogin.value = !!d.disable_password_login
      oauthEnable.value = !!d.oauth_enable
      oauthProvider.value = d.oauth_provider || ''
    })
    .catch(() => {})

  rpcCall('public:getMe')
    .then(data => {
      loggedIn.value = data.logged_in === true
    })
    .catch(() => {})
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease, background 0.3s ease;
}

.navbar.hidden {
  transform: translateY(-100%);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.5rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0;
  color: #fff;
  text-decoration: none;
  min-width: 0;
}

.nav-brand:hover {
  opacity: 0.85;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-sep {
  width: 2px;
  height: 14px;
  background: rgba(255, 255, 255, 0.4);
  margin: 0 10px;
  flex-shrink: 0;
}

.brand-sub {
  font-size: 0.85rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.25s ease;
  cursor: pointer;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

/* 登录弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  width: 90%;
  max-width: 360px;
  background: rgba(30, 30, 36, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #eee;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
}

.modal-close {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s;
}

.modal-close:hover {
  color: #fff;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.login-input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.login-input:focus {
  border-color: rgba(102, 204, 255, 0.5);
}

.login-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.login-error {
  font-size: 0.8rem;
  color: #f87171;
  margin: 0;
}

.login-btn {
  padding: 0.6rem;
  border-radius: 8px;
  border: none;
  background: rgba(102, 204, 255, 0.2);
  color: #66ccff;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  background: rgba(102, 204, 255, 0.3);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.oauth-section {
  margin-top: 0.5rem;
}

.oauth-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.8rem;
}

.oauth-divider::before,
.oauth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #eee;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
}

.oauth-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

@media (max-width: 600px) {
  .nav-inner {
    padding: 0.5rem 1rem;
  }

  .brand-sep,
  .brand-sub {
    display: none;
  }

  .nav-item span {
    display: none;
  }

  .nav-item {
    padding: 0.5rem 0.7rem;
    font-size: 1.1rem;
  }
}
</style>
