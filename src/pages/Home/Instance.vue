<template>
  <div class="instance-page">
    <div class="page-header">
      <router-link to="/komari" class="back-link"><i class="bi bi-arrow-left"></i></router-link>
      <span>{{ nodeName || '服务器详情' }}</span>
      <span class="status-badge" :class="online ? 'on' : 'off'">{{ online ? '在线' : '离线' }}</span>
    </div>

    <div class="detail-grid" v-if="metrics">
      <!-- CPU -->
      <div class="glass-card">
        <h4><i class="bi bi-cpu"></i> CPU</h4>
        <div class="big-num">{{ cpuPercent }}%</div>
        <div class="sub-info">{{ nodeInfo.cpu || '-' }} 核心</div>
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
        <i class="bi bi-activity"></i> 延迟监控
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

const route = useRoute()
const uuid = route.query.uuid || ''
const nodeName = ref('')
const nodeInfo = ref({})
const metrics = ref(null)
const online = ref(false)

let ws = null
let wsTimer = null

onMounted(() => {
  fetchNodeInfo()
  fetchRecent()
  connectWs()
  fetchPingData()
})

onUnmounted(() => {
  if (ws) ws.close()
  if (wsTimer) clearInterval(wsTimer)
})

const pingTasks = ref([])
const pingHours = ref(1)

function fetchPingData() {
  fetch('/api/task/ping')
    .then(res => res.json())
    .then(data => {
      const list = data.data || data || []
      if (!Array.isArray(list)) return
      const relevant = list.filter(t => (t.nodes || []).some(n => (n.uuid || n) === uuid))
      if (relevant.length) {
        fetchPingRecords(relevant)
      }
    })
    .catch(() => {})
}

function fetchPingRecords(tasks) {
  Promise.all(
    tasks.map(task =>
      fetch(`/api/records/ping?task_id=${task.id}&uuid=${uuid}&hours=${pingHours.value}`)
        .then(res => res.json())
        .then(data => {
          const records = data.data || data.records || []
          const summaries = data.summaries || data.nodes || []
          let avg = -1, min = -1, max = -1, loss = 0

          if (summaries.length) {
            const s = summaries[0]
            avg = Math.round(s.avg ?? s.average ?? -1)
            min = Math.round(s.min ?? -1)
            max = Math.round(s.max ?? -1)
            loss = Math.round(s.loss ?? s.packet_loss ?? 0)
          } else if (records.length) {
            const vals = []
            let losses = 0
            for (const r of records) {
              const v = r.latency ?? r.value ?? -1
              if (v < 0) losses++
              else vals.push(v)
            }
            if (vals.length) {
              avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
              min = Math.round(Math.min(...vals))
              max = Math.round(Math.max(...vals))
            }
            loss = records.length ? Math.round((losses / records.length) * 100) : 0
          }

          return { id: task.id, name: task.name, avg, min, max, loss }
        })
        .catch(() => ({ id: task.id, name: task.name, avg: -1, min: -1, max: -1, loss: 100 }))
    )
  ).then(results => {
    pingTasks.value = results
  })
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

function fetchNodeInfo() {
  fetch('/api/nodes')
    .then(res => res.json())
    .then(data => {
      const list = data.data || []
      const node = list.find(n => n.uuid === uuid)
      if (node) {
        nodeName.value = node.name
        nodeInfo.value = node
      }
    })
    .catch(() => {})
}

function fetchRecent() {
  if (!uuid) return
  fetch(`/api/recent/${uuid}`)
    .then(res => res.json())
    .then(data => {
      if (data.data && data.data.length) {
        const latest = data.data[data.data.length - 1]
        metrics.value = latest
        online.value = true
      }
    })
    .catch(() => {})
}

function connectWs() {
  if (!uuid) return
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${location.host}/api/clients`)

  ws.onopen = () => {
    ws.send(`get ${uuid}`)
    wsTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(`get ${uuid}`)
    }, 3000)
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      const payload = msg.data || msg
      if (payload.online) {
        online.value = payload.online.includes(uuid)
      }
      if (payload.data && payload.data[uuid]) {
        metrics.value = payload.data[uuid]
      }
    } catch {}
  }

  ws.onclose = () => setTimeout(connectWs, 5000)
  ws.onerror = () => ws.close()
}

const cpuPercent = computed(() => {
  if (!metrics.value) return 0
  return Math.min(100, Math.round(metrics.value.cpu?.usage ?? 0))
})

const memUsed = computed(() => metrics.value?.ram?.used ?? 0)
const memTotal = computed(() => metrics.value?.ram?.total ?? 0)
const memPercent = computed(() => {
  if (!memTotal.value) return 0
  return Math.round((memUsed.value / memTotal.value) * 100)
})

const diskUsed = computed(() => metrics.value?.disk?.used ?? 0)
const diskTotal = computed(() => metrics.value?.disk?.total ?? 0)
const diskPercent = computed(() => {
  if (!diskTotal.value) return 0
  return Math.round((diskUsed.value / diskTotal.value) * 100)
})

const netRx = computed(() => metrics.value?.network?.down ?? 0)
const netTx = computed(() => metrics.value?.network?.up ?? 0)
const connections = computed(() => {
  const c = metrics.value?.connections
  if (!c) return 0
  return (c.tcp ?? 0) + (c.udp ?? 0)
})
const processes = computed(() => metrics.value?.process ?? 0)

const loadAvg = computed(() => {
  const load = metrics.value?.load
  if (!load) return ['-', '-', '-']
  return [
    (load.load1 ?? 0).toFixed(2),
    (load.load5 ?? 0).toFixed(2),
    (load.load15 ?? 0).toFixed(2)
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
