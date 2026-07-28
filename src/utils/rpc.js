// JSON-RPC 2.0 客户端 — 支持 POST 和 WebSocket 两种模式

let requestId = 0

/**
 * POST 模式：发送单次 JSON-RPC 请求
 * @param {string} method - RPC 方法名
 * @param {object} params - 参数对象
 * @returns {Promise<any>} 返回 result
 */
export function rpcCall(method, params = {}) {
  const id = ++requestId
  return fetch('/api/rpc2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id })
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) throw new Error(data.error.message || 'RPC error')
      return data.result
    })
}

/**
 * WebSocket 模式：建立持久连接，支持请求-响应匹配和超时
 * @returns {{ call: Function, close: Function }}
 */
export function createRpcSocket() {
  let innerId = 0
  const pending = new Map()

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${location.host}/api/rpc2`)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id)
        pending.delete(data.id)
        if (data.error) reject(new Error(data.error.message || 'RPC error'))
        else resolve(data.result)
      }
    } catch {}
  }

  return {
    /**
     * 通过 WebSocket 发送 RPC 请求
     * @param {string} method
     * @param {object} params
     * @param {number} timeout - 超时毫秒，默认 10000
     */
    call(method, params = {}, timeout = 10000) {
      return new Promise((resolve, reject) => {
        const id = ++innerId
        pending.set(id, { resolve, reject })
        ws.send(JSON.stringify({ jsonrpc: '2.0', method, params, id }))
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id)
            reject(new Error(`RPC timeout: ${method}`))
          }
        }, timeout)
      })
    },

    close() {
      ws.close()
    },

    get readyState() {
      return ws.readyState
    }
  }
}
