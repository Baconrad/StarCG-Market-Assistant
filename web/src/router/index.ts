import { createRouter, createWebHistory } from 'vue-router'

// 使用 lazy loading 載入頁面元件
const LandingView = () => import('../views/LandingView.vue')
const HomeView = () => import('../views/HomeView.vue')
const TrackedView = () => import('../views/TrackedView.vue')

const router = createRouter({
  history: createWebHistory('/StarCG-Market-Assistant/'),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/market',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tracked',
      name: 'tracked',
      component: TrackedView,
    },
  ],
})

export default router
