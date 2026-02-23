import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import HomeView from '../views/HomeView.vue'
import TrackedView from '../views/TrackedView.vue'

const router = createRouter({
  history: createWebHistory('/StarCG-Market-Extension/'),
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
