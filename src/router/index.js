import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from '@/supabase.js'

import LoginView from '@/views/LoginView.vue'
import ProfileSetupView from '@/views/ProfileSetupView.vue'
import HomeView from '@/views/HomeView.vue'
import StatsView from '@/views/StatsView.vue'
import AdviceView from '@/views/AdviceView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ProfileEditView from '@/views/ProfileEditView.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/profile-setup',
    name: 'ProfileSetup',
    component: ProfileSetupView,
    meta: { requiresAuth: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/advice',
    name: 'Advice',
    component: AdviceView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile-edit',
    name: 'ProfileEdit',
    component: ProfileEditView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else if (!to.meta.requiresAuth && session && to.path === '/login') {
    next('/home')
  } else {
    next()
  }
})

export default router
