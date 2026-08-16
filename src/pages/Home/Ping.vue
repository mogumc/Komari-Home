<template>
  <div class="ping-page">
    <div class="page-header">
      <i class="bi bi-activity"></i> 延迟监控
    </div>

    <!-- 任务列表 -->
    <div class="task-list" v-if="tasks.length">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        :class="{ selected: selectedTask === task.id }"
        @click="selectTask(task)"
      >
        <div class="task-name">{{ task.name }}</div>
        <div class="task-meta">
          <span><i class="bi bi-arrow-repeat"></i> {{ task.interval || '-' }}s</span>
          <span><i class="bi bi-hdd-network"></i> {{ (task.nodes || []).length }} 节点</span>
        </div>
      </div>
    </div>

    <!-- 延迟数据 -->
    <div class="ping-results" v-if="selectedTask">
      <div class="results-header">
        <span>{{ selectedTaskName }} - 最近 {{ hours }}h</span>
        <div class="time-btns">
          <button :class="{ active: hours === 1 }" @click="changeHours(1)">1h</button>
          <button :class="{ active: hours === 6 }" @click="changeHours(6)">6h</button>
          <button :class="{ active: hours === 24 }" @click="changeHours(24)">24h</button>
        </div>
      </div>

      <div class="card-grid min-300">
        <div v-for="node in pingNodes" :key="node.uuid" class="node-ping-card">
          <div class="node-ping-top">
            <span class="node-name">{{ node.name }}</span>
            <span class="ping-val" :class="pingClass(node.avg)">
              {{ node.avg >= 0 ? node.avg + ' ms' : '丢包' }}
            </span>
          </div>
          <div class="ping-bar-container">
            <div
              class="ping-bar-fill"
              :class="pingClass(node.avg)"
              :style="{ width: barWidth(node.avg) + '%' }"
            ></div>
          </div>
          <div class="ping-stats">
            <span>最小: {{ node.min >= 0 ? node.min + 'ms' : '-' }}</span>
            <span>最大: {{ node.max >= 0 ? node.max + 'ms' : '-' }}</span>
            <span>丢包: {{ node.loss }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!tasks.length" class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>暂无 Ping 任务</p>
    </div>

    <div style="height: 60px"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const tasks = ref([])
const selectedTask = ref(null)
const selectedTaskName = ref('')
const hours = ref(1)
const pingNodes = ref([])

onMounted(() => {
  fetchTasks()
})

function fetchTasks() {
  fetch('/api/task/ping')
    .then(res => res.json())
    .then(data => {
      const list = data.data || data || []
      tasks.value = Array.isArray(list) ? list : []
      if (tasks.value.length) {
        selectTask(tasks.value[0])
      }
    })
    .catch(() => {})
}

function selectTask(task) {
  selectedTask.value = task.id
  selectedTaskName.value = task.name
  fetchPingRecords(task.id)
}

function changeHours(h) {
  hours.value = h
  if (selectedTask.value) fetchPingRecords(selectedTask.value)
}

function fetchPingRecords(taskId) {
  fetch(`/api/records/ping?task_id=${taskId}&hours=${hours.value}`)
    .then(res => res.json())
    .then(data => {
      const records = data.data || data.records || []
      const summaries = data.summaries || data.nodes || []

      if (summaries.length) {
        pingNodes.value = summaries.map(s => ({
          uuid: s.uuid || s.node_uuid || '',
          name: s.name || s.node_name || s.uuid || '未知',
          avg: Math.round(s.avg ?? s.average ?? -1),
          min: Math.round(s.min ?? -1),
          max: Math.round(s.max ?? -1),
          loss: Math.round(s.loss ?? s.packet_loss ?? 0)
        }))
      } else if (records.length) {
        pingNodes.value = aggregateRecords(records)
      } else {
        pingNodes.value = []
      }
    })
    .catch(() => { pingNodes.value = [] })
}

function aggregateRecords(records) {
  const map = {}
  for (const r of records) {
    const key = r.uuid || r.node_uuid || 'unknown'
    if (!map[key]) {
      map[key] = { uuid: key, name: r.name || r.node_name || key, values: [], losses: 0, total: 0 }
    }
    map[key].total++
    const val = r.latency ?? r.value ?? -1
    if (val < 0) {
      map[key].losses++
    } else {
      map[key].values.push(val)
    }
  }

  return Object.values(map).map(m => {
    const vals = m.values
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : -1
    const min = vals.length ? Math.round(Math.min(...vals)) : -1
    const max = vals.length ? Math.round(Math.max(...vals)) : -1
    const loss = m.total ? Math.round((m.losses / m.total) * 100) : 0
    return { uuid: m.uuid, name: m.name, avg, min, max, loss }
  })
}

function pingClass(avg) {
  if (avg < 0) return 'lost'
  if (avg < 50) return 'good'
  if (avg < 150) return 'medium'
  return 'bad'
}

function barWidth(avg) {
  if (avg < 0) return 100
  return Math.min(100, (avg / 300) * 100)
}
</script>

<style scoped>
.ping-page {
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
}

.task-list {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
}

.task-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  transition: all 0.25s ease;
  color: #eee;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.1);
}

.task-card.selected {
  background: rgba(102, 204, 255, 0.12);
  border-color: rgba(102, 204, 255, 0.3);
}

.task-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.task-meta {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  gap: 12px;
}

.ping-results {
  width: 100%;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  margin-bottom: 1rem;
  font-size: 1rem;
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

.node-ping-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem 1.2rem;
  color: #eee;
}

.node-ping-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.node-name {
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
</style>
