<template>
  <div class="instance-page">
    <div class="page-header">
      <router-link to="/komari" class="back-link"><i class="bi bi-arrow-left"></i></router-link>
      <span>{{ nodeName || '服务器详情' }}</span>
      <span class="status-badge" :class="online ? 'on' : 'off'">{{ online ? '在线' : '离线' }}</span>
    </div>

    <!-- 硬件信息 -->
    <div class="hardware-grid" v-if="nodeInfo.cpu_name">
      <div class="glass-card hw-card">
        <h4><i class="bi bi-cpu"></i> 处理器</h4>
        <div class="hw-val">{{ nodeInfo.cpu_name || '-' }}</div>
        <div class="sub-info">{{ nodeInfo.cpu_cores || 0 }} 逻辑核心{{ nodeInfo.cpu_physical_cores ? ' / ' + nodeInfo.cpu_physical_cores + ' 物理核心' : '' }}</div>
      </div>
      <div class="glass-card hw-card">
        <h4><i class="bi bi-motherboard"></i> 系统</h4>
        <div class="hw-val">{{ nodeInfo.os || '-' }}</div>
        <div class="sub-info">{{ nodeInfo.arch || '-' }}{{ nodeInfo.virtualization ? ' · ' + nodeInfo.virtualization : '' }}</div>
      </div>
      <div class="glass-card hw-card" v-if="nodeInfo.gpu_name">
        <h4><i class="bi bi-gpu-card"></i> GPU</h4>
        <div class="hw-val">{{ nodeInfo.gpu_name }}</div>
      </div>
    </div>

    <div class="detail-grid" v-if="metrics">
      <!-- CPU -->
      <div class="glass-card">
        <h4><i class="bi bi-cpu"></i> CPU</h4>
        <div class="big-num">{{ cpuPercent }}%</div>
        <div class="sub-info">{{ nodeInfo.cpu_name || '-' }} 核心</div>
      </div>

      <!-- 内存 -->
      <div class="glass-card">
        <h4><i class="bi bi-memory"></i> 内存</h4>
        <div class="big-num">{{ memPercent }}%</div>
        <div class="sub-info">{{ formatBytes(memUsed) }} / {{ formatBytes(memTotal) }}</div>
      </div>

      <!-- 磁盘 -->
      <div class="glass-card">
        <h4><i class="bi bi-hdd-stack"></i> 磁盘</h4>
        <div class="big-num">{{ diskPercent }}%</div>
        <div class="sub-info">{{ formatBytes(diskUsed) }} / {{ formatBytes(diskTotal) }}</div>
      </div>

      <!-- 网络 -->
      <div class="glass-card">
        <h4><i class="bi bi-arrow-down-up"></i> 网络</h4>
        <div class="net-row">
          <span><i class="bi bi-arrow-up"></i> {{ formatBytes(netTx) }}/s</span>
          <span><i class="bi bi-arrow-down"></i> {{ formatBytes(netRx) }}/s</span>
        </div>
        <div class="sub-info">连接数: {{ connections }}</div>
      </div>

      <!-- 负载 -->
      <div class="glass-card">
        <h4><i class="bi bi-speedometer2"></i> 系统负载</h4>
        <div class="load-row">
          <span v-for="(l, i) in loadAvg" :key="i">{{ l }}</span>
        </div>
        <div class="sub-info">进程: {{ processes }}</div>
      </div>

      <!-- 运行时间 -->
      <div class="glass-card">
        <h4><i class="bi bi-clock-history"></i> 运行时间</h4>
        <div class="big-num small">{{ uptimeStr }}</div>
        <div class="sub-info">{{ nodeInfo.os || '未知系统' }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="bi bi-hourglass-split"></i>
      <p>正在获取数据...</p>
    </div>

    <!-- Ping 延迟 -->
    <div class="ping-section" v-if="pingTasks.length">
      <div class="section-title">
        <span class="title-left"><i class="bi bi-activity"></i> 延迟监控</span>
        <div class="time-btns">
          <button :class="{ active: pingHours === 1 }" @click="changePingHours(1)">1h</button>
          <button :class="{ active: pingHours === 6 }" @click="changePingHours(6)">6h</button>
          <button :class="{ active: pingHours === 24 }" @click="changePingHours(24)">24h</button>
        </div>
      </div>
      <div class="ping-grid">
        <div v-for="task in pingTasks" :key="task.id" class="glass-card ping-card">
          <div class="ping-top">
            <span class="ping-task-name">{{ task.name }}</span>
            <span class="ping-val" :class="pingClass(task.avg)">
              {{ task.avg >= 0 ? task.avg + ' ms' : '丢包' }}
            </span>
          </div>
          <div class="ping-bar-container">
            <div class="ping-bar-fill" :class="pingClass(task.avg)" :style="{ width: pingBarWidth(task.avg) + '%' }"></div>
          </div>
          <div class="ping-stats">
            <span>最小: {{ task.min >= 0 ? task.min + 'ms' : '-' }}</span>
            <span>最大: {{ task.max >= 0 ? task.max + 'ms' : '-' }}</span>
            <span>丢包: {{ task.loss }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { rpcCall, createRpcSocket } from '@/utils/rpc'

const route = useRoute()
const uuid = route.query.uuid || ''
const nodeName = ref('')
const nodeInfo = ref({})
const metrics = ref(null)
const online = ref(false)

let socket = null
let pollTimer = null

onMounted(() => {
  fetchNodeInfo()
  fetchRecent()
  connectAndPoll()
  fetchPingData()
})

onUnmounted(() => {
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)
})

const pingTasks = ref([])
const pingHours = ref(1)

async function fetchNodeInfo() {
  if (!uuid) return
  try {
    const node = await rpcCall('common:getNodes', { uuid })
    if (node) {
      nodeName.value = node.name || ''
      nodeInfo.value = node
    }
  } catch {}
}

async function fetchRecent() {
  if (!uuid) return
  try {
    const data = await rpcCall('common:getNodeRecentStatus', { uuid })
    if (data.records && data.records.length) {
      const latest = data.records[data.records.length - 1]
      metrics.value = latest
      online.value = true
    }
  } catch {}
}

function connectAndPoll() {
  if (!uuid) return
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)

  socket = createRpcSocket()

  const poll = () => {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.call('common:getNodesLatestStatus', { uuid }, 8000)
      .then(data => {
        const status = data && data.online !== undefined ? data : (data && data[uuid])
        if (status) {
          metrics.value = status
          online.value = status.online === true
        }
      })
      .catch(() => {})
  }

  let checkAttempts = 0
  const checkOpen = () => {
    if (socket.readyState === WebSocket.OPEN) {
      poll()
      pollTimer = setInterval(poll, 3000)
    } else if (checkAttempts < 30) {
      checkAttempts++
      setTimeout(checkOpen, 300)
    } else {
      // 连接超时，重建
      connectAndPoll()
    }
  }
  checkOpen()
}

async function fetchPingData() {
  if (!uuid) return
  try {
    const tasks = await rpcCall('public:getPublicPingTasks')
    if (!Array.isArray(tasks)) return
    const relevant = tasks.filter(t => t.clients && t.clients.includes(uuid))
    if (!relevant.length) return
    await fetchPingRecords(relevant)
  } catch {}
}

async function fetchPingRecords(tasks) {
  const results = await Promise.all(
    tasks.map(async (task) => {
      try {
        const data = await rpcCall('public:getPingRecords', {
          uuid,
          task_id: String(task.id),
          hours: String(pingHours.value)
        })

        let avg = -1, min = -1, max = -1, loss = 0

        // 优先使用 tasks 数组中的聚合统计
        if (data.tasks && data.tasks.length) {
          const t = data.tasks[0]
          if (t.avg !== undefined) avg = Math.round(t.avg)
          if (t.min !== undefined) min = Math.round(t.min)
          if (t.max !== undefined) max = Math.round(t.max)
          if (t.loss !== undefined) loss = Math.round(t.loss)
        } else if (data.basic_info && data.basic_info.length) {
          const b = data.basic_info[0]
          if (b.min !== undefined) min = Math.round(b.min)
          if (b.max !== undefined) max = Math.round(b.max)
          if (b.loss !== undefined) loss = Math.round(b.loss)
        }

        // 如果没有 avg 但有 records，手动计算
        if (avg < 0 && data.records && data.records.length) {
          const vals = data.records
            .map(r => r.value)
            .filter(v => v >= 0)
          if (vals.length) {
            avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          }
        }

        return { id: task.id, name: task.name, avg, min, max, loss }
      } catch {
        return { id: task.id, name: task.name, avg: -1, min: -1, max: -1, loss: 100 }
      }
    })
  )
  pingTasks.value = results
}

function changePingHours(h) {
  pingHours.value = h
  fetchPingData()
}

function pingClass(avg) {
  if (avg < 0) return 'lost'
  if (avg < 50) return 'good'
  if (avg < 150) return 'medium'
  return 'bad'
}

function pingBarWidth(avg) {
  if (avg < 0) return 100
  return Math.min(100, (avg / 300) * 100)
}

const cpuPercent = computed(() => {
  if (!metrics.value) return 0
  return Math.min(100, Math.round(metrics.value.cpu ?? 0))
})

const memUsed = computed(() => metrics.value?.ram ?? 0)
const memTotal = computed(() => metrics.value?.ram_total ?? 0)
const memPercent = computed(() => {
  if (!memTotal.value) return 0
  return Math.round((memUsed.value / memTotal.value) * 100)
})

const diskUsed = computed(() => metrics.value?.disk ?? 0)
const diskTotal = computed(() => metrics.value?.disk_total ?? 0)
const diskPercent = computed(() => {
  if (!diskTotal.value) return 0
  return Math.round((diskUsed.value / diskTotal.value) * 100)
})

const netRx = computed(() => metrics.value?.net_in ?? 0)
const netTx = computed(() => metrics.value?.net_out ?? 0)
const connections = computed(() => {
  const tcp = metrics.value?.connections ?? 0
  const udp = metrics.value?.connections_udp ?? 0
  return tcp + udp
})
const processes = computed(() => metrics.value?.process ?? 0)

const loadAvg = computed(() => {
  if (!metrics.value) return ['-', '-', '-']
  return [
    (metrics.value.load ?? 0).toFixed(2),
    (metrics.value.load5 ?? 0).toFixed(2),
    (metrics.value.load15 ?? 0).toFixed(2)
  ]
})

const uptimeStr = computed(() => {
  const up = metrics.value?.uptime ?? 0
  if (!up) return '-'
  const days = Math.floor(up / 86400)
  const hours = Math.floor((up % 86400) / 3600)
  const mins = Math.floor((up % 3600) / 60)
  if (days > 0) return `${days}天 ${hours}时 ${mins}分`
  return `${hours}时 ${mins}分`
})

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}
</script>

<style scoped>
.instance-page {
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
  justify-content: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 12px;
}

.back-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 1.2rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #fff;
}

.status-badge {
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: normal;
}

.status-badge.on {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.status-badge.off {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.hardware-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

.hw-card {
}

.hw-val {
  font-size: 1.05rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.2rem;
  color: #eee;
}

.glass-card h4 {
  margin-bottom: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.glass-card h4 i {
  margin-right: 6px;
}

.big-num {
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.3rem;
}

.big-num.small {
  font-size: 1.3rem;
}

.sub-info {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.net-row {
  display: flex;
  gap: 1.5rem;
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 0.3rem;
}

.net-row i {
  margin-right: 4px;
}

.load-row {
  display: flex;
  gap: 1.5rem;
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 0.3rem;
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

.ping-section {
  width: 100%;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.section-title i {
  margin-right: 8px;
}

.time-btns {
  display: flex;
  gap: 4px;
}

.time-btns button {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.time-btns button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.time-btns button.active {
  background: rgba(102, 204, 255, 0.15);
  border-color: rgba(102, 204, 255, 0.3);
  color: #66ccff;
}

.ping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.ping-card {
  padding: 1rem 1.2rem;
}

.ping-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.ping-task-name {
  font-weight: bold;
  color: #fff;
}

.ping-val {
  font-size: 1.1rem;
  font-weight: bold;
}

.ping-val.good { color: #4caf50; }
.ping-val.medium { color: #ff9800; }
.ping-val.bad { color: #f44336; }
.ping-val.lost { color: #9e9e9e; }

.ping-bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.6rem;
}

.ping-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.ping-bar-fill.good { background: #4caf50; }
.ping-bar-fill.medium { background: #ff9800; }
.ping-bar-fill.bad { background: #f44336; }
.ping-bar-fill.lost { background: #9e9e9e; }

.ping-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 700px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
