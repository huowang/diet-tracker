<template>
  <div class="auth-page">
    <div class="auth-hero">
      <div class="hero-icon">🥗</div>
      <h1 class="app-name">轻食记</h1>
      <p class="app-desc">记录饮食，管理身材</p>
    </div>

    <div class="auth-card card">
      <div class="auth-tabs">
        <button :class="['tab-btn', { active: mode === 'login' }]" @click="mode = 'login'">登录</button>
        <button :class="['tab-btn', { active: mode === 'register' }]" @click="mode = 'register'">注册</button>
      </div>

      <transition name="slide-up" mode="out-in">
        <div v-if="mode === 'login'" key="login">
          <div class="input-group">
            <label>邮箱</label>
            <input v-model="form.email" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="input-group">
            <label>密码</label>
            <div class="pwd-wrap">
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码" />
              <span class="pwd-eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</span>
            </div>
          </div>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
          <button class="btn btn-primary btn-block" :disabled="authStore.loading" @click="handleLogin">
            {{ authStore.loading ? '登录中...' : '登录' }}
          </button>
        </div>

        <div v-else key="register">
          <div class="input-group">
            <label>昵称</label>
            <input v-model="form.nickname" type="text" placeholder="给自己起个昵称" />
          </div>
          <div class="input-group">
            <label>邮箱</label>
            <input v-model="form.email" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="input-group">
            <label>密码</label>
            <div class="pwd-wrap">
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="至少6位密码" />
              <span class="pwd-eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</span>
            </div>
          </div>
          <div class="input-group">
            <label>确认密码</label>
            <input v-model="form.confirmPwd" :type="showPwd ? 'text' : 'password'" placeholder="再次输入密码" />
          </div>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
          <button class="btn btn-primary btn-block" :disabled="authStore.loading" @click="handleRegister">
            {{ authStore.loading ? '注册中...' : '立即注册' }}
          </button>
        </div>
      </transition>
    </div>

    <p class="auth-tip">注册即代表同意用户协议与隐私政策</p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('login')
const showPwd = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  password: '',
  confirmPwd: '',
  nickname: ''
})

async function handleLogin() {
  errorMsg.value = ''
  if (!form.email || !form.password) {
    errorMsg.value = '请填写邮箱和密码'
    return
  }
  const res = await authStore.login(form.email, form.password)
  if (res.success) {
    window.$toast?.('登录成功 🎉')
    router.push('/home')
  } else {
    errorMsg.value = '邮箱或密码错误，请重试'
  }
}

async function handleRegister() {
  errorMsg.value = ''
  if (!form.nickname || !form.email || !form.password) {
    errorMsg.value = '请填写所有必填项'
    return
  }
  if (form.password.length < 6) {
    errorMsg.value = '密码至少6位'
    return
  }
  if (form.password !== form.confirmPwd) {
    errorMsg.value = '两次密码不一致'
    return
  }
  const res = await authStore.register(form.email, form.password, form.nickname)
  if (res.success) {
    if (res.needsSetup) {
      window.$toast?.('注册成功，请完善个人信息 🎉')
      router.push('/profile-setup')
    } else {
      window.$toast?.('登录成功 🎉')
      router.push('/home')
    }
  } else {
    if (res.error?.includes('already')) {
      errorMsg.value = '该邮箱已被注册'
    } else {
      errorMsg.value = res.error || '注册失败，请重试'
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #E8F5E9 0%, #F1F8E9 40%, #fff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 20px;
}

.auth-hero {
  text-align: center;
  margin-bottom: 32px;
}
.hero-icon { font-size: 60px; margin-bottom: 8px; }
.app-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-dark);
  letter-spacing: 2px;
}
.app-desc {
  color: var(--text-secondary);
  margin-top: 6px;
  font-size: 14px;
}

.auth-card {
  width: 100%;
  padding: 24px 20px;
}

.auth-tabs {
  display: flex;
  border-bottom: 2px solid var(--border);
  margin-bottom: 20px;
}
.tab-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 10px 0;
  font-size: 16px;
  color: var(--text-hint);
  cursor: pointer;
  font-weight: 500;
  position: relative;
  transition: color 0.2s;
}
.tab-btn.active {
  color: var(--primary);
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 20%;
  width: 60%;
  height: 2px;
  background: var(--primary);
  border-radius: 1px;
}

.pwd-wrap {
  position: relative;
}
.pwd-wrap input { padding-right: 40px; }
.pwd-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 16px;
}

.error-msg {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}

.auth-tip {
  margin-top: 20px;
  color: var(--text-hint);
  font-size: 12px;
  text-align: center;
}
</style>
