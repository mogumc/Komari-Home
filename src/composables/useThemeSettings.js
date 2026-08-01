import { ref, onMounted } from 'vue'
import { rpcCall } from '@/utils/rpc'

const CACHE_KEY = 'komari_theme_settings'

// JSON 字符串字段，需要从 theme_settings 中自动 parse
const JSON_KEYS = ['socialLinks', 'homeSites', 'webSites']

// public:getPublicSettings 返回的顶层站点字段
const SITE_KEYS = ['sitename', 'disable_password_login', 'oauth_enable', 'oauth_provider']

function parseJSONField(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val !== 'string' || !val.trim()) return []

  // 键名加引号 name: → "name":
  const normalized = val.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')

  try {
    const r = JSON.parse(normalized)
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

// 模块级共享状态，同一页面多个组件共享一份数据
const settings = ref({})
const loading = ref(true)
let fetchPromise = null

function parseSettings(raw) {
  const result = { ...raw }
  JSON_KEYS.forEach(key => {
    result[key] = parseJSONField(result[key])
  })
  return result
}

function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      settings.value = JSON.parse(cached)
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
    // 站点级顶层字段也存入缓存，避免各组件重复请求
    SITE_KEYS.forEach(key => {
      if (data[key] !== undefined) {
        parsed[key] = data[key]
      }
    })
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed))
    settings.value = parsed
  } catch {
    // 网络错误时保留缓存数据
  } finally {
    loading.value = false
    fetchPromise = null
  }
}

// 模块初始化时同步加载缓存，确保组件首次渲染就有数据
loadFromCache()

export function useThemeSettings() {
  onMounted(() => {
    if (!fetchPromise) {
      fetchPromise = fetchSettings()
    }
  })

  return { settings, loading }
}
