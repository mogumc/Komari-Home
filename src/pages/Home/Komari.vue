<template>
  <div class="komari-page">
    <div class="page-header">
      <div class="header-row">
        <div class="header-left">
          <i class="bi bi-cpu-fill"></i> 服务器监控
          <span class="status-dot" :class="wsConnected ? 'online' : 'offline'"></span>
        </div>
        <div class="group-filter" v-if="groupList.length > 1">
          <button class="group-scroll" v-if="groupScroll > 0" @click="groupScroll--">&lt;</button>
          <button
            v-for="g in visibleGroups"
            :key="g"
            class="group-btn"
            :class="{ active: activeGroup === g }"
            @click="activeGroup = g"
          >{{ g === '__all__' ? '全部' : g || '未分组' }}</button>
          <button class="group-scroll" v-if="groupScroll + 3 < groupList.length" @click="groupScroll++">&gt;</button>
        </div>
      </div>
      <div class="billing-row" v-if="billingEnabled">
        <span class="billing-label" v-if="costText">{{ costText }}</span>
        <span class="billing-sep" v-if="costText">|</span>
        <span class="billing-expire" v-if="expiringNodes.length === 0">没有服务器即将到期</span>
        <span class="billing-expire" v-else-if="expiringNodes.length === 1">
          {{ expireText(expiringNodes[0]) }}
        </span>
      <span class="billing-expire-wrap" v-else>
        <transition name="expire-slide" mode="out-in">
          <span class="billing-expire" :key="expireIndex">
            {{ expireText(expiringNodes[expireIndex]) }}
          </span>
        </transition>
      </span>
      </div>
    </div>

    <div class="card-grid min-320" ref="gridRef">
      <div
        v-for="node in paginatedNodes"
        :key="node.uuid"
        class="server-card"
        @click="goInstance(node.uuid)"
      >
        <div class="card-top">
          <span class="server-name">{{ node.name }}</span>
          <span class="server-status" :class="isOnline(node.uuid) ? 'on' : 'off'">
            {{ isOnline(node.uuid) ? '在线' : '离线' }}
          </span>
          <span v-if="parseExpire(node) && remainingDays(parseExpire(node)) !== -1" class="expire-days" :class="{ urgent: remainingDays(parseExpire(node)) <= 7 && remainingDays(parseExpire(node)) > 0, expired: remainingDays(parseExpire(node)) <= 0 }">
            <template v-if="remainingDays(parseExpire(node)) > 36500">长期有效</template>
            <template v-else>{{ remainingDays(parseExpire(node)) > 0 ? remainingDays(parseExpire(node)) + ' 天' : '已过期 ' + Math.abs(remainingDays(parseExpire(node))) + ' 天' }}</template>
          </span>
        </div>

        <div class="card-meta">
          <span><i class="bi bi-hdd"></i> {{ node.os || '未知' }}</span>
          <span><i class="bi bi-geo-alt"></i> {{ node.region || '未知' }}</span>
        </div>
        <div class="card-tags" v-if="getPriceLabel(node) || getTags(node).length">
          <span v-if="getPriceLabel(node)" class="price-label" :class="{ free: (node.price ?? 0) <= 0 }">{{ getPriceLabel(node) }}</span>
          <span class="tag-label" v-for="t in getTags(node)" :key="t">{{ t }}</span>
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

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="page === 1" @click="page = 1">&laquo;</button>
      <button class="page-btn" :disabled="page === 1" @click="page--">&lt;</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="page++">&gt;</button>
      <button class="page-btn" :disabled="page === totalPages" @click="page = totalPages">&raquo;</button>
    </div>

    <div v-if="!nodes.length" class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>暂无服务器数据</p>
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { rpcCall, createRpcSocket } from '@/utils/rpc'
import { useThemeSettings } from '@/composables/useThemeSettings'

const router = useRouter()
const nodes = ref([])
const liveData = reactive({})
const wsConnected = ref(false)
const activeGroup = ref('__all__')
const groupScroll = ref(0)
const page = ref(1)
const gridRef = ref(null)
const columnsPerRow = ref(3)
let socket = null
let pollTimer = null
let resizeObs = null

const { settings } = useThemeSettings()

// 分组列表：全部 + 各节点去重 group
const groupList = computed(() => {
  const set = new Set(['__all__'])
  for (const n of nodes.value) {
    const g = (n.group || '').trim()
    if (g) set.add(g)
  }
  return [...set]
})

// 可见分组（最多 3 个，受 groupScroll 控制）
const visibleGroups = computed(() => {
  return groupList.value.slice(groupScroll.value, groupScroll.value + 3)
})

// 解析节点 tags
function getTags(node) {
  return (node.tags || '').split(';').map(t => t.trim()).filter(Boolean)
}

// ========== Billing 解析（基于节点字段） ==========
// 计费周期简化为人类可读格式，-1 或 0 不显示周期
function formatCycle(days) {
  if (days <= 0) return ''
  const checks = [
    [365, '年'],
    [92, '季'],
    [30, '月'],
  ]
  for (const [base, label] of checks) {
    if (days % base === 0) {
      const n = days / base
      return n === 1 ? `/${label}` : `/${n}${label}`
    }
  }
  return `/${days}天`
}

// price: -1/0 免费，>0 显示 "￥33/月"
function formatPrice(node) {
  const p = node.price
  if (p === undefined || p === null) return null
  const cur = node.currency || '￥'
  if (p <= 0) return { label: '免费', monthly: 0, currency: cur }
  const cycle = formatCycle(node.billing_cycle || 30)
  return { label: `${cur}${p}${cycle}`, monthly: monthlyFrom(node), currency: cur }
}

// 月均成本：按 billing_cycle 折算
function monthlyFrom(node) {
  const p = node.price
  const days = node.billing_cycle || 30
  if (!p || p <= 0 || days <= 0) return 0
  return +(p / days * 30).toFixed(2)
}

function getPriceLabel(node) {
  const r = formatPrice(node)
  return r ? r.label : null
}

// 到期时间
function parseExpire(node) {
  return node.expired_at || null
}

function remainingDays(expireStr) {
  const d = new Date(expireStr)
  return Math.ceil((d - Date.now()) / 86400000)
}

// 到期文案
function expireText(ex) {
  if (ex.days > 0) return `服务器 ${ex.name} 还有 ${ex.days} 天到期`
  return `服务器 ${ex.name} 已经过期 ${Math.abs(ex.days)} 天`
}
const billingEnabled = computed(() => settings.value.komariBillingEnabled === true)

// 按币种分组的月成本（排除一次性付款 -1 天）
const monthlyCost = computed(() => {
  const map = {}
  for (const n of nodes.value) {
    const expire = parseExpire(n)
    if (expire && remainingDays(expire) === -1) continue
    const r = formatPrice(n)
    if (!r || r.monthly <= 0) continue
    map[r.currency] = (map[r.currency] || 0) + r.monthly
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([cur, amt]) => `${cur}${amt.toFixed(2)}`)
    .join(' ')
})

const costText = computed(() => {
  const parts = monthlyCost.value
  return parts ? `每月成本 ${parts}` : null
})

// 到期/过期列表：已过期不限时长，即将到期仅7天内，排除一次性(-1)和长期有效(>100年)
const expiringNodes = computed(() => {
  const result = []
  for (const n of nodes.value) {
    const expire = parseExpire(n)
    if (!expire) continue
    const days = remainingDays(expire)
    if (days === -1 || days > 36500) continue  // 一次性 / 长期有效
    if (days > 7) continue                       // 即将到期仅7天内
    result.push({ name: n.name, days })
  }
  result.sort((a, b) => a.days - b.days)
  return result
})

// 到期滚动索引
const expireIndex = ref(0)
let expireTimer = null

function startExpireCycle() {
  if (expireTimer) clearInterval(expireTimer)
  expireIndex.value = 0
  if (expiringNodes.value.length > 1) {
    expireTimer = setInterval(() => {
      expireIndex.value = (expireIndex.value + 1) % expiringNodes.value.length
    }, 6000)
  }
}

watch(expiringNodes, () => {
  startExpireCycle()
}, { immediate: true })

onUnmounted(() => {
  if (expireTimer) clearInterval(expireTimer)
})

// 排序配置
const sortBy = computed(() => settings.value.komariSortBy || '原顺序')
const onlineFirst = computed(() => settings.value.komariOnlineFirst !== false)

// 筛选 + 排序
const displayNodes = computed(() => {
  let list = [...nodes.value]

  // 分组筛选
  if (activeGroup.value !== '__all__') {
    list = list.filter(n => (n.group || '').trim() === activeGroup.value)
  }

  // 排序
  if (sortBy.value === '名字') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else if (sortBy.value === '分类') {
    list.sort((a, b) => (a.group || '').localeCompare(b.group || '') || (a.name || '').localeCompare(b.name || ''))
  } else {
    // 原顺序：按 weight 升序
    list.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
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

// 分页
const rowsPerPage = computed(() => {
  const v = parseInt(settings.value.komariRowsPerPage)
  return v > 0 ? v : 3
})
const itemsPerPage = computed(() => Math.max(1, rowsPerPage.value * columnsPerRow.value))
const totalPages = computed(() => Math.ceil(displayNodes.value.length / itemsPerPage.value) || 1)
const paginatedNodes = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return displayNodes.value.slice(start, start + itemsPerPage.value)
})

// 切换筛选/分组时重置页码
watch([activeGroup, () => settings.value.komariSortBy], () => {
  page.value = 1
})

onMounted(() => {
  fetchNodes()
  connectAndPoll()
  nextTick(() => {
    if (gridRef.value) {
      resizeObs = new ResizeObserver(entries => {
        const w = entries[0].contentRect.width
        columnsPerRow.value = Math.max(1, Math.floor((w + 16) / 336))
      })
      resizeObs.observe(gridRef.value)
    }
  })
})

onUnmounted(() => {
  if (socket) socket.close()
  if (pollTimer) clearInterval(pollTimer)
  if (resizeObs) resizeObs.disconnect()
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
  flex-direction: column;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 0.6rem 1.5rem;
  border-radius: 12px;
  gap: 0.4rem;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.8rem;
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

.group-filter {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: normal;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.group-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.group-btn.active {
  background: rgba(102, 204, 255, 0.2);
  border-color: rgba(102, 204, 255, 0.4);
  color: #66ccff;
}

.group-scroll {
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.group-scroll:hover {
  color: #fff;
}

/* ========== Billing ========== */
.billing-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
}

.billing-label {
  white-space: nowrap;
  flex-shrink: 0;
}

.billing-sep {
  color: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.billing-expire {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.billing-expire-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
  min-height: 1.3em;
  padding: 2px 0;
}

/* 上下滚动切换 */
.expire-slide-enter-active,
.expire-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.expire-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.expire-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 价格标签（融入 tags 区域） */
.price-label {
  font-size: 0.7rem;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(255, 183, 77, 0.12);
  color: #ffb74d;
  border: 1px solid rgba(255, 183, 77, 0.2);
  white-space: nowrap;
}

.price-label.free {
  background: rgba(76, 175, 80, 0.15);
  color: #81c784;
  border-color: rgba(76, 175, 80, 0.25);
}

/* 到期天数（卡片右上角 pill） */
.expire-days {
  font-size: 0.8rem;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  flex-shrink: 0;
}

.expire-days.urgent {
  background: rgba(255, 152, 0, 0.15);
  color: #ffb74d;
}

.expire-days.expired {
  background: rgba(244, 67, 54, 0.15);
  color: #e57373;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 0.5rem;
}

.tag-label {
  font-size: 0.7rem;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(102, 204, 255, 0.15);
  color: rgba(102, 204, 255, 0.8);
  border: 1px solid rgba(102, 204, 255, 0.2);
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
  align-items: center;
  gap: 8px;
  margin-bottom: 0.8rem;
}

.server-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.page-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0 0.5rem;
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
  .page-header {
    gap: 0.5rem;
  }

  .header-row {
    flex-direction: column;
    gap: 0.5rem;
    font-size: 1.3rem;
  }
}
</style>
