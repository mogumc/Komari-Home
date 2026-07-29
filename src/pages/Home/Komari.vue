<template>
  <div class="komari-page">
    <div class="page-header">
      <div class="header-left">
        <i class="bi bi-cpu-fill"></i> 服务器监控
        <span class="status-dot" :class="wsConnected ? 'online' : 'offline'"></span>
      </div>
      <div class="tag-filter" v-if="tagList.length > 1">
        <button class="tag-scroll" v-if="tagScroll > 0" @click="tagScroll--">&lt;</button>
        <button
          v-for="(t, i) in visibleTags"
          :key="t"
          class="tag-btn"
          :class="{ active: activeTag === t }"
          @click="activeTag = t"
        >{{ t === '__all__' ? '全部' : t }}</button>
        <button class="tag-scroll" v-if="tagScroll + 3 < tagList.length" @click="tagScroll++">&gt;</button>
      </div>
    </div>

    <div class="server-grid">
      <div
        v-for="node in displayNodes"
        :key="node.uuid"
        class="server-card"
        @click="goInstance(node.uuid)"
      >
        <div class="card-top">
          <span class="server-name">{{ node.name }}</span>
          <span class="server-status" :class="isOnline(node.uuid) ? 'on' : 'off'">
            {{ isOnline(node.uuid) ? '在线' : '离线' }}
          </span>
        </div>

        <div class="card-meta">
          <span><i class="bi bi-hdd"></i> {{ node.os || '未知' }}</span>
          <span><i class="bi bi-geo-alt"></i> {{ node.region || '未知' }}</span>
        </div>

        <div class="card-metrics" v-if="liveData[node.uuid]">
          <div class="metric">
            <div class="metric-label">CPU</div>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: cpuUsage(node.uuid) + '%' }"></div>
            </div>
            <div class="metric-val">{{ cpuUsage(node.uuid) }}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">内存</div>
            <div class="metric-bar">
              <div class="metric-fill mem" :style="{ width: memUsage(node.uuid) + '%' }"></div>
            </div>
            <div class="metric-val">{{ memUsage(node.uuid) }}%</div>
          </div>
        </div>

        <div class="card-metrics placeholder" v-else>
          <span class="no-data">{{ isOnline(node.uuid) ? '等待数据...' : '节点离线' }}</span>
        </div>

        <div class="card-footer" v-if="liveData[node.uuid]">
          <span><i class="bi bi-arrow-down-up"></i> {{ formatNet(liveData[node.uuid]) }}</span>
          <span><i class="bi bi-clock"></i> {{ formatUptime(liveData[node.uuid]) }}</span>
        </div>
      </div>
    </div>

    <div v-if="!nodes.length" class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>暂无服务器数据</p>
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { rpcCall, createRpcSocket } from '@/utils/rpc'
import { useThemeSettings } from '@/composables/useThemeSettings'

const router = useRouter()
const nodes = ref([])
const liveData = reactive({})
const wsConnected = ref(false)
const activeTag = ref('__all__')
const tagScroll = ref(0)
let socket = null
let pollTimer = null

const { settings } = useThemeSettings()

// 标签列表：全部 + 各节点去重 tag
const tagList = computed(() => {
  const set = new Set(['__all__'])
  for (const n of nodes.value) {
    const tags = (n.tags || '').split(';').map(t => t.trim()).filter(Boolean)
    tags.forEach(t => set.add(t))
  }
  return [...set]
})

// 可见标签（最多 3 个，受 tagScroll 控制）
const visibleTags = computed(() => {
  return tagList.value.slice(tagScroll.value, tagScroll.value + 3)
})

// 排序配置
const sortBy = computed(() => settings.value.komariSortBy || '原顺序')
const onlineFirst = computed(() => settings.value.komariOnlineFirst !== false)

// 筛选 + 排序
const displayNodes = computed(() => {
  let list = [...nodes.value]

  // 标签筛选
  if (activeTag.value !== '__all__') {
    list = list.filter(n => {
      const tags = (n.tags || '').split(';').map(t => t.trim())
      return tags.includes(activeTag.value)
    })
  }

  // 排序
  if (sortBy.value === '名字') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else if (sortBy.value === '分类') {
    list.sort((a, b) => (a.group || '').localeCompare(b.group || '') || (a.name || '').localeCompare(b.name || ''))
  }

  // 在线靠前
  if (onlineFirst.value) {
    list.sort((a, b) => {
      const aOn = isOnline(a.uuid) ? 0 : 1
      const bOn = isOnline(b.uuid) ? 0 : 1
      return aOn - bOn
    })
  }

  return list
})

onMounted(() => {
  fetchNodes()
  connectAndPoll()
})

onUnmounted(() => {
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)
})

async function fetchNodes() {
  try {
    const data = await rpcCall('common:getNodes')
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      nodes.value = Object.values(data)
    } else if (Array.isArray(data)) {
      nodes.value = data
    }
  } catch {}
}

function connectAndPoll() {
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)

  socket = createRpcSocket()

  const poll = () => {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.call('common:getNodesLatestStatus', {}, 8000)
      .then(data => {
        wsConnected.value = true
        if (data && typeof data === 'object') {
          for (const [uuid, status] of Object.entries(data)) {
            liveData[uuid] = status
          }
        }
      })
      .catch(() => {
        wsConnected.value = false
      })
  }

  let checkAttempts = 0
  const checkOpen = () => {
    if (socket.readyState === WebSocket.OPEN) {
      wsConnected.value = true
      poll()
      pollTimer = setInterval(poll, 3000)
    } else if (checkAttempts < 30) {
      checkAttempts++
      setTimeout(checkOpen, 300)
    } else {
      connectAndPoll()
    }
  }
  checkOpen()
}

function isOnline(uuid) {
  const d = liveData[uuid]
  return d ? d.online === true : false
}

function cpuUsage(uuid) {
  const d = liveData[uuid]
  if (!d) return 0
  return Math.min(100, Math.round(d.cpu ?? 0))
}

function memUsage(uuid) {
  const d = liveData[uuid]
  if (!d) return 0
  const used = d.ram ?? 0
  const total = d.ram_total ?? 0
  if (!total) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

function formatNet(d) {
  const up = d.net_out ?? 0
  const down = d.net_in ?? 0
  return `↑ ${formatBytes(up)}/s  ↓ ${formatBytes(down)}/s`
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}

function formatUptime(d) {
  const up = d.uptime ?? 0
  if (!up) return '-'
  const days = Math.floor(up / 86400)
  const hours = Math.floor((up % 86400) / 3600)
  if (days > 0) return `${days}天${hours}时`
  const mins = Math.floor((up % 3600) / 60)
  return `${hours}时${mins}分`
}

function goInstance(uuid) {
  router.push({ path: '/komari/instance', query: { uuid } })
}
</script>

<style scoped>
.komari-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  gap: 1.5rem;
}

.page-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 0.6rem 1.5rem;
  border-radius: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online {
  background: #4caf50;
  box-shadow: 0 0 6px #4caf50;
}

.status-dot.offline {
  background: #f44336;
}

.tag-filter {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: normal;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tag-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.tag-btn.active {
  background: rgba(102, 204, 255, 0.2);
  border-color: rgba(102, 204, 255, 0.4);
  color: #66ccff;
}

.tag-scroll {
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.tag-scroll:hover {
  color: #fff;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  width: 100%;
}

.server-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.2rem;
  cursor: pointer;
  transition: all 0.25s ease;
  color: #eee;
}

.server-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-3px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.server-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
}

.server-status {
  font-size: 0.8rem;
  padding: 2px 10px;
  border-radius: 12px;
}

.server-status.on {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.server-status.off {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.card-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
}

.card-meta i {
  margin-right: 4px;
}

.card-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 0.8rem;
}

.card-metrics.placeholder {
  align-items: center;
  padding: 0.5rem 0;
}

.no-data {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
}

.metric {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  width: 32px;
}

.metric-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: #66ccff;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.metric-fill.mem {
  background: #a78bfa;
}

.metric-val {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  width: 36px;
  text-align: right;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.6rem;
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 3rem;
  font-size: 1.1rem;
}

.empty-state i {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

@media (max-width: 700px) {
  .server-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: 0.5rem;
    font-size: 1.3rem;
  }
}
</style>
