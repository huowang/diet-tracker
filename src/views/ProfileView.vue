<template>
  <div class="profile-page">
    <!-- 顶部用户信息 -->
    <div class="profile-hero">
      <div class="avatar">{{ avatarText }}</div>
      <div class="user-info">
        <h2>{{ authStore.profile?.nickname || '用户' }}</h2>
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

      <!-- 编辑个人信息 -->
      <div class="card">
        <h3 class="section-title">👤 个人信息</h3>
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
            <label>体重 (kg)</label>
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

      <button class="btn btn-primary btn-block" :disabled="saving" @click="handleSave" style="margin-bottom:12px">
        {{ saving ? '保存中...' : '💾 保存更改' }}
      </button>

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

      <!-- 关于 -->
      <div class="card about-card">
        <div class="about-item">
          <span>🥗 轻食记</span>
          <span class="about-val">v1.0.0</span>
        </div>
        <div class="about-item">
          <span>📧 联系我们</span>
          <span class="about-val">support@dietapp.com</span>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useDietStore } from '@/stores/diet.js'
import { calcBMI, calcBMR, calcTDEE, getBMICategory, getRecentDates } from '@/utils/diet.js'
import { supabase } from '@/supabase.js'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const dietStore = useDietStore()

const saving = ref(false)
const totalDays = ref(0)
const totalRecords = ref(0)
const totalCaloriesRecorded = ref(0)

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
  const n = authStore.profile?.nickname || authStore.user?.email || '?'
  return n.charAt(0).toUpperCase()
})

const bodyStats = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height) return []
  const bmi = calcBMI(p.weight, p.height)
  const bmiCat = getBMICategory(bmi)
  const bmr = calcBMR(p.weight, p.height, p.age || 25, p.gender || 'male')
  const tdee = calcTDEE(bmr, p.activity_level || 'sedentary')
  return [
    { label: 'BMI', val: bmi.toFixed(1), color: bmiCat.color },
    { label: '体重 kg', val: p.weight, color: '#5C6BC0' },
    { label: '目标 kg', val: p.target_weight || '-', color: '#4CAF50' },
    { label: '基础代谢', val: Math.round(bmr), color: '#FF7043' },
  ]
})

function loadForm() {
  const p = authStore.profile
  if (!p) return
  Object.keys(form).forEach(k => { if (p[k] !== undefined) form[k] = p[k] })
}

async function handleSave() {
  saving.value = true
  console.log('=== 开始保存个人资料 ===')
  
  try {
    const res = await authStore.updateProfile({ ...form })
    console.log('保存结果:', res)
    
    if (res.success) {
      window.$toast?.('保存成功 ✅')
    } else {
      alert(`保存失败: ${res.error || '请重试'}`)
    }
  } catch (e) {
    console.error('保存异常:', e)
    alert(`保存异常: ${e.message}`)
  } finally {
    saving.value = false
  }
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
  loadForm()
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

.section-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; }

.gender-row { margin-bottom: 14px; }
.gender-row > label { font-size: 13px; color: var(--text-secondary); font-weight: 500; display: block; margin-bottom: 8px; }
.gender-btns { display: flex; gap: 10px; }
.gender-btn { flex: 1; padding: 10px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.gender-btn.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary-dark); font-weight: 500; }

.row-inputs { display: flex; gap: 12px; }
.flex1 { flex: 1; }

.goal-btns { display: flex; gap: 10px; }
.goal-btn { flex: 1; padding: 10px 4px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; font-size: 13px; cursor: pointer; transition: all 0.2s; text-align: center; line-height: 1.4; }
.goal-btn span { font-size: 12px; }
.goal-btn.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary-dark); font-weight: 500; }

.my-stats { display: flex; justify-content: space-around; }
.my-stat-item { text-align: center; }
.my-stat-num { display: block; font-size: 22px; font-weight: 700; color: var(--primary-dark); }
.my-stat-label { font-size: 11px; color: var(--text-secondary); }

.about-card { padding: 0; }
.about-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 14px; }
.about-item:last-child { border-bottom: none; }
.about-val { font-size: 13px; color: var(--text-secondary); }
</style>
