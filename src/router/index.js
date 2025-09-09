import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/pages/home.vue'

const routes = [
  { path: '/', component: Home, meta: { menuIndex: '1' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

import { useMenuStore } from '../stores/menuStore'
 
router.beforeEach((to, from, next) => {
  const menuStore = useMenuStore()
  const menuIndex = to.meta.menuIndex || '1'
  menuStore.setActiveMenu(menuIndex)
  next()
})
export default router