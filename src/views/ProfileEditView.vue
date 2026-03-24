<template>
  <div class="profile-edit-page">
    <!-- 顶部导航 -->
    <div class="nav-header">
      <button class="back-btn" @click="goBack">‹</button>
      <h1 class="nav-title">编辑个人信息</h1>
      <div style="width:40px"></div>
    </div>

    <div class="page-content">
      <!-- 头像 -->
      <div class="avatar-section">
        <div class="avatar-large">{{ avatarText }}</div>
        <p class="avatar-tip">点击昵称区域修改</p>
      </div>

      <!-- 基本信息 -->
      <div class="card">
        <h3 class="section-title">👤 基本信息</h3>
        <div class="input-group">
          <label>昵称</label>
          <input v-model="form.nickname" type="text" placeholder="您的昵称" />
        </div>
        <div class="gender-row">
          <label>性别</label>
          <div class="gender-btns">
            <button :class="['gender-btn', { active: form.gender === 'male' }]" @click="form.gender = 'male'">👨 男</button>
            <button :class="['gender-btn', { active: form.gender === 'female' }]" @click="form.gender = 'female'">👩 女</button>
          </div>
        </div>
        <div class="row-inputs">
          <div class="input-group flex1">
            <label>年龄</label>
            <input v-model.number="form.age" type="number" placeholder="年龄" />
          </div>
          <div class="input-group flex1">
            <label>身高 (cm)</label>
            <input v-model.number="form.height" type="number" placeholder="身高" />
          </div>
        </div>
        <div class="row-inputs">
          <div class="input-group flex1">
            <label>当前体重 (kg)</label>
            <input v-model.number="form.weight" type="number" placeholder="体重" />
          </div>
          <div class="input-group flex1">
            <label>目标体重 (kg)</label>
            <input v-model.number="form.target_weight" type="number" placeholder="目标体重" />
          </div>
        </div>
      </div>

      <!-- 目标设定 -->
      <div class="card">
        <h3 class="section-title">🎯 目标设定</h3>
        <div class="input-group">
          <label>活动量</label>
          <select v-model="form.activity_level">
            <option value="sedentary">久坐不动（办公室工作）</option>
            <option value="light">轻度活动（每周运动1-3次）</option>
            <option value="moderate">中度活动（每周运动3-5次）</option>
            <option value="active">高度活动（每周运动6-7次）</option>
            <option value="very_active">极度活跃（体力劳动/运动员）</option>
          </select>
        </div>
        <div class="input-group">
          <label>饮食目标</label>
          <div class="goal-btns">
            <button v-for="g in goalOptions" :key="g.value"
              :class="['goal-btn', { active: form.diet_goal === g.value }]"
              @click="form.diet_goal = g.value">
              {{ g.emoji }}<br/><span>{{ g.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <button class="btn btn-primary btn-block" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '💾 保存' }}
      </button>

      <button class="btn btn-secondary btn-block" @click="goBack" style="margin-top:8px">
        返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)

const goalOptions = [
  { value: 'lose', emoji: '🔻', label: '减脂' },
  { value: 'maintain', emoji: '⚖️', label: '保持' },
  { value: 'gain', emoji: '🔺', label: '增肌' },
]

const form = reactive({
  nickname: '',
  gender: 'male',
  age: null,
  height: null,
  weight: null,
  target_weight: null,
  activity_level: 'sedentary',
  diet_goal: 'maintain'
})

const avatarText = computed(() => {
  const n = form.nickname || authStore.user?.email || '?'
  return n.charAt(0).toUpperCase()
})

function loadForm() {
  const p = authStore.profile
  if (!p) {
    // profile 还没加载，尝试获取
    authStore.fetchProfile()
    return
  }
  Object.keys(form).forEach(k => { if (p[k] !== undefined) form[k] = p[k] })
}

// 监听 profile 变化，加载数据
watch(() => authStore.profile, (newProfile) => {
  if (newProfile) {
    Object.keys(form).forEach(k => { if (newProfile[k] !== undefined) form[k] = newProfile[k] })
  }
}, { immediate: true })

function goBack() {
  router.push('/profile')
}

async function handleSave() {
  saving.value = true
  try {
    const res = await authStore.updateProfile({ ...form })
    if (res.success) {
      window.$toast?.('保存成功 ✅')
      setTimeout(() => router.push('/profile'), 500)
    } else {
      alert(`保存失败: ${res.error || '请重试'}`)
    }
  } catch (e) {
    alert(`保存异常: ${e.message}`)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadForm()
})
</script>

<style scoped>
.profile-edit-page { min-height: 100vh; background: var(--bg-gray); }

.nav-header {
  background: #fff;
  padding: 14px 16px;
  padding-top: calc(14px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 28px;
  color: var(--primary-dark);
  cursor: pointer;
}
.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.avatar-section {
  text-align: center;
  padding: 20px;
}
.avatar-large {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #42A5F5, #1976D2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 auto 8px;
}
.avatar-tip {
  font-size: 12px;
  color: var(--text-secondary);
}

.section-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; }

.gender-row { margin-bottom: 14px; }
.gender-row > label { font-size: 13px; color: var(--text-secondary); font-weight: 500; display: block; margin-bottom: 8px; }
.gender-btns { display: flex; gap: 10px; }
.gender-btn { flex: 1; padding: 10px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.gender-btn.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary-dark); font-weight: 500; }

.row-inputs { display: flex; gap: 12px; margin-bottom: 12px; }
.flex1 { flex: 1; }

.goal-btns { display: flex; gap: 10px; }
.goal-btn { flex: 1; padding: 10px 4px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; font-size: 13px; cursor: pointer; transition: all 0.2s; text-align: center; line-height: 1.4; }
.goal-btn span { font-size: 12px; }
.goal-btn.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary-dark); font-weight: 500; }
</style>
