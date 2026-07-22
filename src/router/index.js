import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home/Home.vue'
import Websites from '@/pages/Home/Websites.vue'
import NotFound from '@/pages/Home/NotFound.vue'
import Komari from '@/pages/Home/Komari.vue'
import Instance from '@/pages/Home/Instance.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/web',
    name: 'web',
    component: Websites
  },
  {
    path: '/komari',
    name: 'komari',
    component: Komari
  },
  {
    path: '/komari/instance',
    name: 'instance',
    component: Instance
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router