/**
 * v-fit-text —— 单行文本自适应缩小字号
 *
 * 用于卡片/胶囊里的名称等短文本：文字放不下时不截断，而是按比例缩小
 * 字号直到完整显示。元素需满足以下 CSS 前提：
 *   white-space: nowrap; overflow: hidden;（父容器需 min-width: 0，
 *   否则元素自身会被内容撑开，clientWidth 恒等于 scrollWidth）
 * 极端超长输入在最小字号下仍放不下时，由 overflow/text-overflow 兜底截断。
 *
 * 可选参数：v-fit-text 或 v-fit-text="0.6" 或 v-fit-text="{ minScale: 0.6 }"
 *   minScale 为最小缩放比例（相对样式表字号），默认 0.6。
 *
 * 重新测量的触发时机：宿主组件更新（文本变化）、元素尺寸变化
 * （ResizeObserver，覆盖视口/网格重排）、字体加载完成（webfont 换装
 * 会改变文本宽度）。
 */

const state = new WeakMap()

function applyFit(el, minScale) {
  // 先还原字号再取基准值，保证多次调用幂等
  el.style.fontSize = ''
  const base = parseFloat(getComputedStyle(el).fontSize)
  if (!base) return
  const min = base * minScale
  let size = base
  // 迭代收敛：缩小后重测，消化字宽取整误差；达到下限即停
  for (let i = 0; i < 8 && el.scrollWidth > el.clientWidth; i++) {
    size = Math.max(size * (el.clientWidth / el.scrollWidth), min)
    el.style.fontSize = size + 'px'
    if (size <= min) break
  }
}

export const fitText = {
  mounted(el, binding) {
    const ctrl = {
      minScale: 0.6,
      ro: null
    }
    ctrl.ro = new ResizeObserver(() => applyFit(el, ctrl.minScale))
    ctrl.ro.observe(el)
    document.fonts?.ready.then(() => applyFit(el, ctrl.minScale))
    state.set(el, ctrl)
    ctrl.minScale = readMinScale(binding)
    applyFit(el, ctrl.minScale)
  },
  updated(el, binding) {
    const ctrl = state.get(el)
    if (ctrl) {
      ctrl.minScale = readMinScale(binding)
      applyFit(el, ctrl.minScale)
    }
  },
  beforeUnmount(el) {
    const ctrl = state.get(el)
    if (ctrl) {
      ctrl.ro?.disconnect()
      state.delete(el)
    }
  }
}

function readMinScale(binding) {
  const v = binding.value
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && typeof v.minScale === 'number') return v.minScale
  return 0.6
}
