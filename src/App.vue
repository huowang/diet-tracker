<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <transition name="fade">
    <div v-if="toast.show" class="toast">{{ toast.msg }}</div>
  </transition>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const toast = reactive({ show: false, msg: '' })

onMounted(() => {
  authStore.init()
})

// 全局 toast
window.$toast = (msg, duration = 2000) => {
  toast.msg = msg
  toast.show = true
  setTimeout(() => { toast.show = false }, duration)
}
</script>
