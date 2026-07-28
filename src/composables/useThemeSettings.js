import { ref, onMounted } from 'vue'
import { rpcCall } from '@/utils/rpc'

const CACHE_KEY = 'komari_theme_settings'

// JSON 字符串字段，需要从 theme_settings 中自动 parse
const JSON_KEYS = ['socialLinks', 'homeSites', 'webSites']

// 模块级共享状态，同一页面多个组件共享一份数据
const settings = ref({})
const loading = ref(true)
let fetchPromise = null

function parseSettings(raw) {
  const result = { ...raw }
  JSON_KEYS.forEach(key => {
    const val = result[key]
    if (typeof val === 'string' && val.trim()) {
      try {
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) {
          result[key] = parsed
        }
      } catch {
        result[key] = []
      }
    }
    if (!Array.isArray(result[key])) {
      result[key] = []
    }
  })
  return result
}

function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      settings.value = parseSettings(JSON.parse(cached))
      loading.value = false
      return true
    }
  } catch {
    // 缓存损坏，忽略
  }
  return false
}

async function fetchSettings() {
  try {
    const data = await rpcCall('public:getPublicSettings')
    const raw = data.theme_settings || {}
    const parsed = parseSettings(raw)
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed))
    settings.value = parsed
  } catch {
    // 网络错误时保留缓存数据
  } finally {
    loading.value = false
    fetchPromise = null
  }
}

export function useThemeSettings() {
  onMounted(() => {
    const hasCache = loadFromCache()

    if (!fetchPromise) {
      fetchPromise = fetchSettings()
    }

    if (!hasCache) {
      fetchPromise.then(() => {
        loading.value = false
      })
    }
  })

  return { settings, loading }
}
