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
      <div class="glass-card chart-card">
        <h4><i class="bi bi-cpu"></i> CPU <span class="chart-val">{{ cpuPercent }}%</span></h4>
        <div class="chart-svg" @mousemove="e => onChartHover(e, 'cpu')" @mouseleave="onChartLeave">
          <svg viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#66ccff" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#66ccff" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <path :d="chartArea(history.cpu, 100, 200, 60)" fill="url(#cpuG)"/>
            <path :d="chartLine(history.cpu, 100, 200, 60)" fill="none" stroke="#66ccff" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="sub-info">{{ nodeInfo.cpu_name || '-' }} 核心</div>
      </div>

      <!-- 内存 -->
      <div class="glass-card chart-card">
        <h4><i class="bi bi-memory"></i> 内存 <span class="chart-val">{{ memPercent }}%</span></h4>
        <div class="chart-svg" @mousemove="e => onChartHover(e, 'mem')" @mouseleave="onChartLeave">
          <svg viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="memG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <path :d="chartArea(history.mem, 100, 200, 60)" fill="url(#memG)"/>
            <path :d="chartLine(history.mem, 100, 200, 60)" fill="none" stroke="#a78bfa" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="sub-info">{{ formatBytes(memUsed) }} / {{ formatBytes(memTotal) }}</div>
      </div>

      <!-- 磁盘 -->
      <div class="glass-card chart-card">
        <h4><i class="bi bi-hdd-stack"></i> 磁盘 <span class="chart-val">{{ diskPercent }}%</span></h4>
        <div class="chart-svg" @mousemove="e => onChartHover(e, 'disk')" @mouseleave="onChartLeave">
          <svg viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="diskG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4fc3f7" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#4fc3f7" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <path :d="chartArea(history.disk, 100, 200, 60)" fill="url(#diskG)"/>
            <path :d="chartLine(history.disk, 100, 200, 60)" fill="none" stroke="#4fc3f7" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="sub-info">{{ formatBytes(diskUsed) }} / {{ formatBytes(diskTotal) }}</div>
      </div>

      <!-- 网络 -->
      <div class="glass-card chart-card">
        <h4><i class="bi bi-arrow-down-up"></i> 网络</h4>
        <div class="chart-svg" @mousemove="e => onChartHover(e, 'netTx')" @mouseleave="onChartLeave">
          <svg viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="netTxG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#66ccff" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#66ccff" stop-opacity="0.02"/>
              </linearGradient>
              <linearGradient id="netRxG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <path :d="chartArea(history.netTx, netMax, 200, 60)" fill="url(#netTxG)"/>
            <path :d="chartLine(history.netTx, netMax, 200, 60)" fill="none" stroke="#66ccff" stroke-width="1.5"/>
            <path :d="chartArea(history.netRx, netMax, 200, 60)" fill="url(#netRxG)"/>
            <path :d="chartLine(history.netRx, netMax, 200, 60)" fill="none" stroke="#a78bfa" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="sub-info">
          <span class="net-up">↑: {{ formatBytes(netTx) }}/s&nbsp;</span>
          <span class="net-down">↓: {{ formatBytes(netRx) }}/s</span>
          &nbsp;| TCP: {{ connections.tcp }} UDP: {{ connections.udp }}
        </div>
      </div>

      <!-- 进程数 -->
      <div class="glass-card chart-card">
        <h4><i class="bi bi-diagram-3"></i> 进程 <span class="chart-val">{{ processes }}</span></h4>
        <div class="chart-svg" @mousemove="e => onChartHover(e, 'proc')" @mouseleave="onChartLeave">
          <svg viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="procG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ff8a65" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#ff8a65" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <path :d="chartArea(history.proc, procMax, 200, 60)" fill="url(#procG)"/>
            <path :d="chartLine(history.proc, procMax, 200, 60)" fill="none" stroke="#ff8a65" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="sub-info load-row">
          <span v-for="(l, i) in loadAvg" :key="i">{{ l }}</span>
        </div>
      </div>

      <!-- 运行时间 -->
      <div class="glass-card chart-card uptime-card">
        <h4><i class="bi bi-clock-history"></i> 运行时间</h4>
        <div class="uptime-body">
          <div class="big-num small">{{ uptimeStr }}</div>
          <div class="sub-info" v-if="remainDays">剩余 {{ remainDays }}</div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="bi bi-hourglass-split"></i>
      <p>正在获取数据...</p>
    </div>

    <Teleport to="body">
      <div class="chart-tooltip" v-show="tooltip.show" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        {{ tooltip.text }}
      </div>
    </Teleport>

    <!-- 延迟柱状热点图 -->
    <div class="ping-section" v-if="heatmapData.rows.length">
      <div class="section-title">
        <span class="title-left"><i class="bi bi-activity"></i> 延迟监控</span>
        <div class="time-btns">
          <button :class="{ active: pingHours === 1 }" @click="changePingHours(1)">1h</button>
          <button :class="{ active: pingHours === 6 }" @click="changePingHours(6)">6h</button>
          <button :class="{ active: pingHours === 24 }" @click="changePingHours(24)">24h</button>
        </div>
      </div>
      <div class="ping-grid" :class="{ loading: pingLoading }">
        <div v-for="row in heatmapData.rows" :key="row.name" class="glass-card ping-card">
          <div class="ping-task-name">{{ row.name }}</div>
          <div class="heatmap">
            <div class="heatmap-bars">
              <div
                v-for="(cell, ci) in row.cells"
                :key="ci"
                class="heatmap-bar-wrap"
                :title="cell.value !== null ? cell.value + 'ms' : '无数据'"
              >
                <div class="heatmap-bar" :style="{ height: cell.height + '%', background: cell.color }"></div>
              </div>
            </div>
            <div class="heatmap-legend">
              <span>丢包</span><span class="legend-swatch" style="background:rgba(158,158,158,0.5)"></span>
              <span>&lt;30</span><span class="legend-swatch" style="background:rgba(76,175,80,0.8)"></span>
              <span>30-80</span><span class="legend-swatch" style="background:rgba(139,195,74,0.7)"></span>
              <span>80-150</span><span class="legend-swatch" style="background:rgba(255,235,59,0.7)"></span>
              <span>150-300</span><span class="legend-swatch" style="background:rgba(255,152,0,0.7)"></span>
              <span>&gt;300</span><span class="legend-swatch" style="background:rgba(244,67,54,0.8)"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
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
const pingLoading = ref(false)
const pingCache = ref({})

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
      pushHistory()
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
          pushHistory()
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

        const records = (data.records || []).map(r => ({
          value: r.value,
          time: r.created_at || r.time || ''
        }))

        return { id: task.id, name: task.name, records }
      } catch {
        return { id: task.id, name: task.name, records: [] }
      }
    })
  )
  pingTasks.value = results
}

async function changePingHours(h) {
  if (pingLoading.value) return
  pingHours.value = h
  // 命中缓存则直接切
  if (pingCache.value[h]) {
    pingTasks.value = pingCache.value[h]
    return
  }
  pingLoading.value = true
  await fetchPingData()
  pingCache.value[h] = pingTasks.value
  pingLoading.value = false
}

// ========== 柱状热点图 ==========
const PING_BAR_MAX = 300

function heatCellColor(val) {
  if (val < 0) return 'rgba(158,158,158,0.5)'
  if (val <= 30)  return 'rgba(76,175,80,0.8)'
  if (val <= 80)  return 'rgba(139,195,74,0.7)'
  if (val <= 150) return 'rgba(255,235,59,0.7)'
  if (val <= 300) return 'rgba(255,152,0,0.7)'
  return 'rgba(244,67,54,0.8)'
}

const heatmapData = computed(() => {
  if (!pingTasks.value.length) return { rows: [] }

  const now = Date.now()
  const hours = pingHours.value
  const bucketMs = hours <= 1 ? 5 * 60000 : hours <= 6 ? 30 * 60000 : 60 * 60000
  const bucketCount = Math.ceil((hours * 3600000) / bucketMs)

  const rows = pingTasks.value.map(task => {
    const buckets = new Array(bucketCount).fill(null).map(() => ({ sum: 0, count: 0 }))

    for (const r of task.records) {
      const t = new Date(r.time).getTime()
      const idx = Math.floor((t - (now - hours * 3600000)) / bucketMs)
      if (idx >= 0 && idx < bucketCount) {
        if (r.value >= 0) {
          buckets[idx].sum += r.value
          buckets[idx].count++
        }
      }
    }

    const cells = buckets.map(b => {
      if (b.count === 0) return { value: null, height: 2, color: 'rgba(255,255,255,0.04)' }
      const avg = Math.round(b.sum / b.count)
      const h = Math.min(100, Math.max(3, (avg / PING_BAR_MAX) * 100))
      return { value: avg, height: h, color: heatCellColor(avg) }
    })

    return { name: task.name, cells }
  })

  return { rows }
})

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
  return { tcp, udp, total: tcp + udp }
})
const processes = computed(() => metrics.value?.process ?? 0)

const netMax = computed(() => {
  const vals = [...history.netRx, ...history.netTx]
  if (!vals.length) return 1000
  const raw = Math.max(...vals)
  return raw > 0 ? raw * 1.3 : 1000
})

const procMax = computed(() => {
  if (!history.proc.length) return 120
  const max = Math.max(...history.proc, 1)
  return Math.max(120, max * 1.3)
})

// hover 提示
const tooltip = reactive({ show: false, x: 0, y: 0, text: '' })
let tooltipTimer = null

function onChartHover(e, key) {
  const arr = history[key]
  if (!arr || arr.length < 2) { tooltip.show = false; return }
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  const idx = Math.min(arr.length - 1, Math.max(0, Math.round(ratio * (arr.length - 1))))
  const val = arr[idx]
  tooltip.show = true
  tooltip.x = e.clientX - 20
  tooltip.y = e.clientY - 40
  if (key === 'cpu' || key === 'mem' || key === 'disk') {
    tooltip.text = val.toFixed(1) + '%'
  } else if (key === 'proc') {
    tooltip.text = Math.round(val) + ' 进程'
  } else if (key === 'netTx') {
    const txVal = history.netTx[idx]
    const rxVal = history.netRx[idx]
    tooltip.text = `↑ ${formatBytes(txVal)}/s  ↓ ${formatBytes(rxVal)}/s`
  }
  if (tooltipTimer) clearTimeout(tooltipTimer)
}

function onChartLeave() {
  tooltipTimer = setTimeout(() => { tooltip.show = false }, 100)
}

// 运行时间剩余天数
const remainDays = computed(() => {
  if (!nodeInfo.value?.expired_at) return null
  const d = new Date(nodeInfo.value.expired_at)
  const days = Math.ceil((d - Date.now()) / 86400000)
  if (days === -1 || days > 36500) return null
  if (days <= 0) return `已过期 ${Math.abs(days)} 天`
  return `${days} 天到期`
})

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

// ===== 曲线图 history =====
const MAX_POINTS = 60
const history = reactive({
  cpu: [], mem: [], disk: [],
  netRx: [], netTx: [], proc: []
})

function pushHistory() {
  if (!metrics.value) return
  const m = metrics.value
  const push = (arr, v, max) => { arr.push(v); if (arr.length > max) arr.shift() }
  push(history.cpu, Math.min(100, m.cpu ?? 0), MAX_POINTS)
  push(history.mem, memPercent.value, MAX_POINTS)
  push(history.disk, diskPercent.value, MAX_POINTS)
  push(history.netRx, m.net_in ?? 0, MAX_POINTS)
  push(history.netTx, m.net_out ?? 0, MAX_POINTS)
  push(history.proc, m.process ?? 0, MAX_POINTS)
}

// 在 connectAndPoll 的 poll 回调中调用 pushHistory()
// SVG 路径生成
function chartLine(arr, maxVal, w, h) {
  if (arr.length < 2) return ''
  const step = w / (arr.length - 1)
  return arr.map((v, i) => {
    const x = (i * step).toFixed(1)
    const y = (h - Math.min(1, v / (maxVal || 1)) * h).toFixed(1)
    return `${i === 0 ? 'M' : 'L'}${x} ${y}`
  }).join(' ')
}

function chartArea(arr, maxVal, w, h) {
  if (arr.length < 2) return ''
  const step = w / (arr.length - 1)
  const pts = arr.map((v, i) => {
    const x = (i * step).toFixed(1)
    const y = (h - Math.min(1, v / (maxVal || 1)) * h).toFixed(1)
    return `L${x} ${y}`
  }).join(' ').replace(/^L/, 'M')
  return `${pts} L${w.toFixed(1)},${h.toFixed(1)} L0,${h.toFixed(1)} Z`
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

/* 曲线图卡片 */
.chart-val {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
}

.chart-svg {
  position: relative;
  width: 100%;
  margin: 0.5rem 0;
  min-height: 10px;
}

.chart-card svg {
  width: 100%;
  height: 60px;
  display: block;
}

.chart-tooltip {
  position: fixed;
  z-index: 9999;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
}

.sub-info .net-up { color: #66ccff; }
.sub-info .net-down { color: #a78bfa; }

.sub-info.load-row {
  display: flex;
  gap: 1rem;
}
.sub-info.load-row span { color: rgba(255,255,255,0.6); }

.uptime-card {
  display: flex;
  flex-direction: column;
}

.uptime-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.uptime-body .sub-info {
  margin-top: auto;
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

.ping-grid.loading {
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.ping-card {
  padding: 0.8rem 1rem;
}

.ping-task-name {
  font-weight: bold;
  color: #fff;
  font-size: 0.9rem;
  margin-bottom: 0.6rem;
}

/* ===== 柱状热点图 ===== */
.heatmap {
  overflow: hidden;
}

.heatmap-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 48px;
  margin-bottom: 0.5rem;
}

.heatmap-bar-wrap {
  flex: 1;
  min-width: 2px;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.heatmap-bar {
  width: 100%;
  border-radius: 1px 1px 0 0;
  min-height: 2px;
  transition: transform 0.15s ease;
}

.heatmap-bar:hover {
  transform: scaleY(1.3);
  transform-origin: bottom;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  padding-top: 0.3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.legend-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
}

@media (max-width: 700px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
