<template>
  <div class="komari-page">
    <div class="page-header">
      <i class="bi bi-cpu-fill"></i> 服务器监控
      <span class="status-dot" :class="wsConnected ? 'online' : 'offline'"></span>
    </div>

    <div class="server-grid">
      <div
        v-for="node in nodes"
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { rpcCall, createRpcSocket } from '@/utils/rpc'

const router = useRouter()
const nodes = ref([])
const liveData = reactive({})
const wsConnected = ref(false)
let socket = null
let pollTimer = null

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
    // common:getNodes 无 uuid 时返回 {[uuid]: Client}
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      nodes.value = Object.values(data)
    } else if (Array.isArray(data)) {
      nodes.value = data
    }
  } catch {}
}

function connectAndPoll() {
  socket = createRpcSocket()

  const poll = () => {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.call('common:getNodesLatestStatus', {}, 8000)
      .then(data => {
        wsConnected.value = true
        // common:getNodesLatestStatus 返回 {[uuid]: NodeStatus}
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

  // 初始轮询
  const checkOpen = () => {
    if (socket.readyState === WebSocket.OPEN) {
      wsConnected.value = true
      poll()
      pollTimer = setInterval(poll, 3000)
    } else {
      setTimeout(checkOpen, 300)
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
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
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
}
</style>
