import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home/Home.vue'
import Websites from '@/pages/Home/Websites.vue'
import Music from '@/pages/Home/Music.vue'
import NotFound from '@/pages/Home/NotFound.vue'
import Komari from '@/pages/Home/Komari.vue'
import Instance from '@/pages/Home/Instance.vue'
import Ping from '@/pages/Home/Ping.vue'

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
    path: '/music',
    name: 'music',
    component: Music
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
    path: '/komari/ping',
    name: 'ping',
    component: Ping
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