<template>
  <div class="tab-bar">
    <div v-for="tab in tabs" :key="tab.path"
      :class="['tab-item', { active: currentPath === tab.path }]"
      @click="router.push(tab.path)">
      <span class="icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/home', icon: '🏠', label: '饮食' },
  { path: '/stats', icon: '📊', label: '统计' },
  { path: '/advice', icon: '💡', label: '建议' },
  { path: '/profile', icon: '👤', label: '我的' },
]

const currentPath = computed(() => route.path)
</script>
