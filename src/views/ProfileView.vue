<template>
  <div class="profile-page">
    <!-- 顶部用户信息 -->
    <div class="profile-hero">
      <div class="avatar">{{ avatarText }}</div>
      <div class="user-info">
        <h2 @click="goEdit" class="nickname-link">
          {{ authStore.profile?.nickname || '用户' }} <span class="edit-icon">✏️</span>
        </h2>
        <p>{{ authStore.user?.email }}</p>
      </div>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </div>

    <div class="page-content">
      <!-- 体型数据卡 -->
      <div class="card body-card" v-if="authStore.profile?.weight">
        <div class="body-stat" v-for="item in bodyStats" :key="item.label">
          <span class="body-val" :style="{ color: item.color }">{{ item.val }}</span>
          <span class="body-label">{{ item.label }}</span>
        </div>
      </div>

      <!-- 未设置信息提示 -->
      <div class="card setup-tip" v-if="!authStore.profile?.height || !authStore.profile?.weight">
        <div class="tip-content">
          <span class="tip-icon">📝</span>
          <div class="tip-text">
            <p>完善个人信息可以获得更准确的饮食建议</p>
            <button class="btn btn-primary" @click="goEdit">立即完善</button>
          </div>
        </div>
      </div>

      <!-- 个人信息已简化，点击编辑查看详情 -->

      <!-- 数据统计 -->
      <div class="card">
        <h3 class="section-title">📊 我的数据</h3>
        <div class="my-stats">
          <div class="my-stat-item">
            <span class="my-stat-num">{{ totalDays }}</span>
            <span class="my-stat-label">记录天数</span>
          </div>
          <div class="my-stat-item">
            <span class="my-stat-num">{{ totalRecords }}</span>
            <span class="my-stat-label">饮食记录</span>
          </div>
          <div class="my-stat-item">
            <span class="my-stat-num">{{ totalCaloriesRecorded }}</span>
            <span class="my-stat-label">总摄入(kcal)</span>
          </div>
        </div>
      </div>

      <!-- 编辑入口 -->
      <div class="card edit-entry" @click="goEdit">
        <span>✏️ 编辑个人信息</span>
        <span class="arrow">›</span>
      </div>

      <!-- 关于 -->
      <div class="card about-card">
        <div class="about-item">
          <span>🥗 轻食记</span>
          <span class="about-val">v1.0.0</span>
        </div>
        <div class="about-item" @click="handleLogout" style="cursor:pointer;color:#EF5350">
          <span>🚪 退出登录</span>
          <span>›</span>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { calcBMI, calcBMR, calcTDEE, getBMICategory } from '@/utils/diet.js'
import { supabase } from '@/supabase.js'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const authStore = useAuthStore()

const totalDays = ref(0)
const totalRecords = ref(0)
const totalCaloriesRecorded = ref(0)

const avatarText = computed(() => {
  const n = authStore.profile?.nickname || authStore.user?.email || '?'
  return n.charAt(0).toUpperCase()
})

const genderText = computed(() => authStore.profile?.gender === 'female' ? '👩 女' : '👨 男')

const activityMap = {
  sedentary: '久坐不动',
  light: '轻度活动',
  moderate: '中度活动',
  active: '高度活动',
  very_active: '极度活跃'
}
const activityText = computed(() => activityMap[authStore.profile?.activity_level] || '-')

const goalMap = { lose: '🔻 减脂', maintain: '⚖️ 保持', gain: '🔺 增肌' }
const goalText = computed(() => goalMap[authStore.profile?.diet_goal] || '-')

const bodyStats = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height) return []
  const bmi = calcBMI(p.weight, p.height)
  const bmiCat = getBMICategory(bmi)
  const bmr = calcBMR(p.weight, p.height, p.age || 25, p.gender || 'male')
  return [
    { label: 'BMI', val: bmi.toFixed(1), color: bmiCat.color },
    { label: '体重 kg', val: p.weight, color: '#5C6BC0' },
    { label: '目标 kg', val: p.target_weight || '-', color: '#4CAF50' },
    { label: '基础代谢', val: Math.round(bmr), color: '#FF7043' },
  ]
})

function goEdit() {
  router.push('/profile-edit')
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function loadStats() {
  if (!authStore.user) return
  const { data } = await supabase
    .from('diet_records')
    .select('record_date, calories')
    .eq('user_id', authStore.user.id)
  if (data) {
    totalRecords.value = data.length
    totalCaloriesRecorded.value = data.reduce((s, r) => s + (r.calories || 0), 0)
    const days = new Set(data.map(r => r.record_date))
    totalDays.value = days.size
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.profile-page { min-height: 100vh; background: var(--bg-gray); }

.profile-hero {
  background: linear-gradient(135deg, #37474F, #546E7A);
  padding: 24px 20px 20px;
  padding-top: calc(24px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  gap: 14px;
  color: #fff;
}
.avatar {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}
.user-info { flex: 1; }
.user-info h2 { font-size: 18px; font-weight: 700; margin-bottom: 3px; }
.nickname-link { cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.nickname-link:hover { opacity: 0.9; }
.edit-icon { font-size: 14px; opacity: 0.7; }
.user-info p { font-size: 12px; opacity: 0.75; }
.logout-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.body-card {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
  padding: 16px 8px;
}
.body-stat { text-align: center; }
.body-val { display: block; font-size: 20px; font-weight: 700; margin-bottom: 3px; }
.body-label { font-size: 11px; color: var(--text-secondary); }

.setup-tip {
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  border: none;
  margin-bottom: 12px;
}
.tip-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tip-icon { font-size: 28px; }
.tip-text { flex: 1; }
.tip-text p { font-size: 13px; color: #1565C0; margin-bottom: 8px; }

.info-card { margin-bottom: 12px; }
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: var(--text-secondary); }
.info-value { font-size: 14px; font-weight: 500; }

.section-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; }

.my-stats { display: flex; justify-content: space-around; }
.my-stat-item { text-align: center; }
.my-stat-num { display: block; font-size: 22px; font-weight: 700; color: var(--primary-dark); }
.my-stat-label { font-size: 11px; color: var(--text-secondary); }

.edit-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 12px;
  color: var(--primary-dark);
  font-weight: 500;
}
.arrow { font-size: 18px; }

.about-card { padding: 0; margin-bottom: 12px; }
.about-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 14px; }
.about-item:last-child { border-bottom: none; }
.about-val { font-size: 13px; color: var(--text-secondary); }
</style>
