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
      <!-- 提醒完善信息 -->
      <div class="card setup-tip" v-if="!authStore.profile?.height || !authStore.profile?.weight">
        <div class="tip-content">
          <span class="tip-icon">📝</span>
          <div class="tip-text">
            <p>完善个人信息可以获得更准确的饮食建议</p>
            <button class="btn btn-primary btn-sm" @click="goEdit">立即完善</button>
          </div>
        </div>
      </div>

      <!-- 今日饮食摘要 -->
      <div class="card today-summary">
        <div class="card-header">
          <h3>🍽️ 今日饮食</h3>
          <span class="date">{{ todayStr }}</span>
        </div>
        <div class="summary-stats">
          <div class="summary-item">
            <span class="summary-val" :style="{ color: todayIntakeColor }">{{ todayCalories }}</span>
            <span class="summary-label">摄入(kcal)</span>
          </div>
          <div class="summary-item">
            <span class="summary-val">{{ todayTarget }}</span>
            <span class="summary-label">目标(kcal)</span>
          </div>
          <div class="summary-item">
            <span class="summary-val" :style="{ color: remaining >= 0 ? '#4CAF50' : '#EF5350' }">
              {{ remaining >= 0 ? remaining : Math.abs(remaining) }}
            </span>
            <span class="summary-label">{{ remaining >= 0 ? '剩余(kcal)' : '超量(kcal)' }}</span>
          </div>
        </div>
        <!-- 三餐摄入进度 -->
        <div class="meal-bars">
          <div class="meal-bar-item" v-for="meal in mealSummary" :key="meal.type">
            <span class="meal-bar-label">{{ meal.emoji }} {{ meal.label }}</span>
            <div class="meal-bar-track">
              <div class="meal-bar-fill" :style="{ width: meal.percent + '%', background: meal.color }"></div>
            </div>
            <span class="meal-bar-val">{{ meal.calories }}kcal</span>
          </div>
        </div>
      </div>

      <!-- 身材数据 -->
      <div class="card body-card" v-if="authStore.profile?.weight && authStore.profile?.height">
        <div class="card-header">
          <h3>📏 身材数据</h3>
          <span class="bmi-badge" :style="{ background: bmiInfo.bgColor, color: bmiInfo.color }">
            {{ bmiInfo.label }}
          </span>
        </div>
        <div class="body-grid">
          <div class="body-item">
            <span class="body-item-val">{{ bmi.toFixed(1) }}</span>
            <span class="body-item-label">BMI</span>
          </div>
          <div class="body-item">
            <span class="body-item-val">{{ authStore.profile.weight }}</span>
            <span class="body-item-label">体重(kg)</span>
          </div>
          <div class="body-item">
            <span class="body-item-val">{{ authStore.profile.height }}</span>
            <span class="body-item-label">身高(cm)</span>
          </div>
          <div class="body-item">
            <span class="body-item-val">{{ authStore.profile.target_weight || '-' }}</span>
            <span class="body-item-label">目标(kg)</span>
          </div>
        </div>
        <div class="weight-progress">
          <div class="weight-progress-track">
            <div class="weight-progress-fill" :style="{ width: weightProgressWidth + '%' }"></div>
            <div class="weight-progress-marker" :style="{ left: weightProgressWidth + '%' }">
              <span class="marker-val">{{ authStore.profile.weight }}</span>
            </div>
          </div>
          <div class="weight-labels">
            <span>偏瘦</span>
            <span>标准</span>
            <span>偏胖</span>
          </div>
        </div>
      </div>

      <!-- 本周统计 -->
      <div class="card week-stats">
        <div class="card-header">
          <h3>📊 本周统计</h3>
        </div>
        <div class="week-chart">
          <div class="week-bar" v-for="day in weekData" :key="day.label">
            <div class="week-bar-track">
              <div class="week-bar-fill" :style="{ height: day.percent + '%', background: day.color }"></div>
            </div>
            <span class="week-bar-label">{{ day.label }}</span>
            <span class="week-bar-val">{{ day.calories }}</span>
          </div>
        </div>
        <div class="week-summary">
          <div class="week-summary-item">
            <span class="val">{{ weekAvgCalories }}</span>
            <span class="label">日均摄入</span>
          </div>
          <div class="week-summary-item">
            <span class="val">{{ weekDays }}</span>
            <span class="label">记录天数</span>
          </div>
          <div class="week-summary-item">
            <span class="val">{{ weekChange >= 0 ? '+' : '' }}{{ weekChange }}%</span>
            <span class="label">vs上周</span>
          </div>
        </div>
      </div>

      <!-- 累计数据 -->
      <div class="card">
        <div class="card-header">
          <h3>📈 累计数据</h3>
        </div>
        <div class="total-stats">
          <div class="total-item">
            <span class="total-icon">📅</span>
            <div class="total-info">
              <span class="total-val">{{ totalDays }}</span>
              <span class="total-label">记录天数</span>
            </div>
          </div>
          <div class="total-item">
            <span class="total-icon">🍴</span>
            <div class="total-info">
              <span class="total-val">{{ totalRecords }}</span>
              <span class="total-label">饮食记录</span>
            </div>
          </div>
          <div class="total-item">
            <span class="total-icon">🔥</span>
            <div class="total-info">
              <span class="total-val">{{ totalCaloriesRecorded }}</span>
              <span class="total-label">总摄入(kcal)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="card action-card">
        <div class="action-item" @click="goEdit">
          <span class="action-icon">👤</span>
          <span class="action-text">编辑个人信息</span>
          <span class="action-arrow">›</span>
        </div>
        <div class="action-item" @click="router.push('/advice')">
          <span class="action-icon">💡</span>
          <span class="action-text">健康建议</span>
          <span class="action-arrow">›</span>
        </div>
        <div class="action-item" @click="router.push('/stats')">
          <span class="action-icon">📉</span>
          <span class="action-text">数据统计</span>
          <span class="action-arrow">›</span>
        </div>
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
import { calcBMI, calcBMR, calcTDEE, getBMICategory, formatDate, formatDateCN } from '@/utils/diet.js'
import { supabase } from '@/supabase.js'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const authStore = useAuthStore()

const totalDays = ref(0)
const totalRecords = ref(0)
const totalCaloriesRecorded = ref(0)
const todayCalories = ref(0)
const todayRecords = ref([])
const weekRecords = ref([])

const todayStr = computed(() => formatDateCN(new Date()))

const todayTarget = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height || !p?.age) return 2000
  const bmr = calcBMR(p.weight, p.height, p.age, p.gender || 'male')
  let tdee = calcTDEE(bmr, p.activity_level || 'sedentary')
  if (p.diet_goal === 'lose') tdee -= 500
  if (p.diet_goal === 'gain') tdee += 300
  return Math.round(tdee)
})

const remaining = computed(() => todayTarget.value - todayCalories.value)

const todayIntakeColor = computed(() => {
  const r = todayCalories.value / todayTarget.value
  if (r < 0.7) return '#42A5F5'
  if (r <= 1.1) return '#4CAF50'
  if (r <= 1.3) return '#FFA726'
  return '#EF5350'
})

const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐', emoji: '🌅', color: '#FFB74D' },
  { value: 'lunch', label: '午餐', emoji: '🌞', color: '#4FC3F7' },
  { value: 'dinner', label: '晚餐', emoji: '🌙', color: '#9575CD' },
  { value: 'snack', label: '加餐', emoji: '🍎', color: '#81C784' }
]

const mealSummary = computed(() => {
  return MEAL_TYPES.map(m => {
    const records = todayRecords.value.filter(r => r.meal_type === m.value)
    const calories = records.reduce((s, r) => s + (r.calories || 0), 0)
    const percent = todayTarget.value > 0 ? Math.min(100, Math.round(calories / todayTarget.value * 100)) : 0
    return { ...m, calories, percent }
  })
})

const bmi = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height) return 0
  return calcBMI(p.weight, p.height)
})

const bmiInfo = computed(() => getBMICategory(bmi.value))

const weightProgressWidth = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height) return 50
  return Math.min(100, Math.max(0, (bmi.value - 15) / 20 * 100))
})

const weekData = computed(() => {
  const days = ['一', '二', '三', '四', '五', '六', '日']
  const today = new Date()
  const week = []
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)
    const dayRecords = weekRecords.value.filter(r => r.record_date === dateStr)
    const calories = dayRecords.reduce((s, r) => s + (r.calories || 0), 0)
    const percent = todayTarget.value > 0 ? Math.min(100, Math.round(calories / todayTarget.value * 100)) : 0
    week.push({
      label: days[d.getDay() === 0 ? 6 : d.getDay() - 1],
      calories,
      percent,
      color: i === 0 ? '#4CAF50' : '#E0E0E0'
    })
  }
  return week
})

const weekAvgCalories = computed(() => {
  const days = weekData.value.filter(d => d.calories > 0)
  if (days.length === 0) return 0
  return Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length)
})

const weekDays = computed(() => weekData.value.filter(d => d.calories > 0).length)

const weekChange = computed(() => 0)

const avatarText = computed(() => {
  const n = authStore.profile?.nickname || authStore.user?.email || '?'
  return n.charAt(0).toUpperCase()
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
  
  const today = formatDate(new Date())
  const { data: todayData } = await supabase
    .from('diet_records')
    .select('*')
    .eq('user_id', authStore.user.id)
    .eq('record_date', today)
  
  if (todayData) {
    todayCalories.value = todayData.reduce((s, r) => s + (r.calories || 0), 0)
    todayRecords.value = todayData
  }
  
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: weekData } = await supabase
    .from('diet_records')
    .select('record_date, calories')
    .eq('user_id', authStore.user.id)
    .gte('record_date', formatDate(weekAgo))
  
  if (weekData) weekRecords.value = weekData
  
  const { data } = await supabase
    .from('diet_records')
    .select('record_date, calories')
    .eq('user_id', authStore.user.id)
  
  if (data) {
    totalRecords.value = data.length
    totalCaloriesRecorded.value = data.reduce((s, r) => s + (r.calories || 0), 0)
    totalDays.value = new Set(data.map(r => r.record_date)).size
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

.page-content { padding: 12px 16px; }

.setup-tip {
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  border: none;
  margin-bottom: 12px;
}
.tip-content { display: flex; align-items: center; gap: 12px; }
.tip-icon { font-size: 28px; }
.tip-text { flex: 1; }
.tip-text p { font-size: 13px; color: #1565C0; margin-bottom: 8px; }
.btn-sm { padding: 6px 16px; font-size: 13px; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-header h3 { font-size: 15px; font-weight: 600; }
.date { font-size: 12px; color: var(--text-secondary); }
.bmi-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.today-summary { margin-bottom: 12px; }
.summary-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 14px;
  padding: 10px 0;
  background: var(--bg-gray);
  border-radius: 10px;
}
.summary-item { text-align: center; }
.summary-val { display: block; font-size: 22px; font-weight: 700; }
.summary-label { font-size: 11px; color: var(--text-secondary); }

.meal-bars { }
.meal-bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.meal-bar-item:last-child { margin-bottom: 0; }
.meal-bar-label { font-size: 12px; width: 50px; }
.meal-bar-track {
  flex: 1;
  height: 8px;
  background: var(--bg-gray);
  border-radius: 4px;
  overflow: hidden;
}
.meal-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}
.meal-bar-val { font-size: 11px; color: var(--text-secondary); width: 55px; text-align: right; }

.body-card { margin-bottom: 12px; }
.body-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.body-item { text-align: center; }
.body-item-val { display: block; font-size: 18px; font-weight: 700; color: var(--primary-dark); }
.body-item-label { font-size: 10px; color: var(--text-secondary); }

.weight-progress { }
.weight-progress-track {
  height: 8px;
  background: linear-gradient(to right, #42A5F5, #4CAF50, #FFA726, #EF5350);
  border-radius: 4px;
  position: relative;
  margin-bottom: 4px;
}
.weight-progress-marker {
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
}
.marker-val {
  font-size: 10px;
  background: var(--primary-dark);
  color: #fff;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
}
.weight-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-secondary);
}

.week-stats { margin-bottom: 12px; }
.week-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 80px;
  margin-bottom: 14px;
  padding: 0 5px;
}
.week-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.week-bar-track {
  width: 20px;
  height: 50px;
  background: var(--bg-gray);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
}
.week-bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.3s ease;
  min-height: 2px;
}
.week-bar-label { font-size: 10px; color: var(--text-secondary); margin-top: 4px; }
.week-bar-val { font-size: 9px; color: var(--text-hint); }

.week-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.week-summary-item { text-align: center; }
.week-summary-item .val { display: block; font-size: 18px; font-weight: 700; color: var(--primary-dark); }
.week-summary-item .label { font-size: 11px; color: var(--text-secondary); }

.total-stats {
  display: flex;
  justify-content: space-around;
}
.total-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.total-icon { font-size: 24px; }
.total-info { }
.total-val { display: block; font-size: 18px; font-weight: 700; color: var(--primary-dark); }
.total-label { font-size: 11px; color: var(--text-secondary); }

.action-card { padding: 0; margin-bottom: 12px; }
.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.2s;
}
.action-item:last-child { border-bottom: none; }
.action-item:hover { background: var(--bg-gray); }
.action-icon { font-size: 20px; }
.action-text { flex: 1; font-size: 14px; }
.action-arrow { font-size: 18px; color: var(--text-hint); }

.about-card { padding: 0; margin-bottom: 12px; }
.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.about-item:last-child { border-bottom: none; }
.about-val { font-size: 13px; color: var(--text-secondary); }
</style>
