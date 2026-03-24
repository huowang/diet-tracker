<template>
  <div class="advice-page">
    <div class="page-header advice-header">
      <h1>身材管理建议</h1>
      <p>基于您的饮食数据个性化分析</p>
    </div>

    <div class="page-content">
      <!-- 无数据提示 -->
      <div v-if="!hasProfile" class="card no-profile-card">
        <div class="no-profile-icon">📋</div>
        <p class="no-profile-title">请先完善个人信息</p>
        <p class="no-profile-desc">填写身高、体重等信息才能获得个性化建议</p>
        <button class="btn btn-primary btn-sm" @click="router.push('/profile')">去完善信息</button>
      </div>

      <template v-else>
        <!-- BMI 卡片 -->
        <div class="bmi-card card">
          <div class="bmi-header">
            <div>
              <h3>BMI 体重指数</h3>
              <p class="bmi-desc">身体质量指数</p>
            </div>
            <div class="bmi-value-wrap">
              <span class="bmi-number" :style="{ color: bmiCategory.color }">{{ bmi }}</span>
              <span class="bmi-badge" :style="{ background: bmiCategory.color + '20', color: bmiCategory.color }">{{ bmiCategory.label }}</span>
            </div>
          </div>
          <div class="bmi-scale">
            <div class="bmi-bar">
              <div class="bmi-indicator" :style="{ left: bmiPosition + '%' }"></div>
              <div class="bmi-seg bmi-thin">偏瘦</div>
              <div class="bmi-seg bmi-normal">正常</div>
              <div class="bmi-seg bmi-over">超重</div>
              <div class="bmi-seg bmi-fat">肥胖</div>
            </div>
            <div class="bmi-labels">
              <span>15</span><span>18.5</span><span>24</span><span>28</span><span>35</span>
            </div>
          </div>
          <div class="bmi-tip">
            <span class="tip-icon">💡</span>
            {{ bmiCategory.advice }}
          </div>
        </div>

        <!-- 卡路里目标卡片 -->
        <div class="card calorie-target-card">
          <h3 class="card-section-title">🎯 每日卡路里目标</h3>
          <div class="target-info-row">
            <div class="target-info-item">
              <span class="ti-label">基础代谢率(BMR)</span>
              <span class="ti-val">{{ bmr }} kcal</span>
            </div>
            <div class="target-info-item">
              <span class="ti-label">活动消耗(TDEE)</span>
              <span class="ti-val">{{ tdee }} kcal</span>
            </div>
            <div class="target-info-item highlight">
              <span class="ti-label">推荐每日摄入</span>
              <span class="ti-val big" :style="{ color: '#4CAF50' }">{{ recommendedCalories }} kcal</span>
            </div>
          </div>
          <div class="goal-explain">
            <span v-if="profile.diet_goal === 'lose'" class="goal-tag lose">🔻 减脂模式：每日减少 500 kcal</span>
            <span v-else-if="profile.diet_goal === 'gain'" class="goal-tag gain">🔺 增肌模式：每日增加 300 kcal</span>
            <span v-else class="goal-tag maintain">⚖️ 保持模式：维持当前体重</span>
          </div>
        </div>

        <!-- 近7日趋势分析 -->
        <div class="card week-analysis-card">
          <h3 class="card-section-title">📊 近7日摄入分析</h3>
          <div v-if="weekAnalysis.days === 0" class="empty-state">
            <div class="icon">🍽️</div>
            <p>还没有饮食记录，快去记录吧</p>
          </div>
          <template v-else>
            <div class="week-stat-row">
              <div class="week-stat">
                <span class="ws-num">{{ weekAnalysis.avgCalories }}</span>
                <span class="ws-label">日均摄入(kcal)</span>
              </div>
              <div class="week-stat">
                <span class="ws-num">{{ weekAnalysis.days }}</span>
                <span class="ws-label">记录天数</span>
              </div>
              <div class="week-stat">
                <span class="ws-num" :style="{ color: weekAnalysis.calorieDiff > 0 ? '#EF5350' : '#4CAF50' }">
                  {{ weekAnalysis.calorieDiff > 0 ? '+' : '' }}{{ weekAnalysis.calorieDiff }}
                </span>
                <span class="ws-label">日均差值(kcal)</span>
              </div>
            </div>
            <div class="week-conclusion">
              <span class="conclusion-icon">{{ weekAnalysis.conclusionIcon }}</span>
              <p>{{ weekAnalysis.conclusion }}</p>
            </div>
          </template>
        </div>

        <!-- 饮食建议 -->
        <div class="card advice-list-card">
          <h3 class="card-section-title">🌿 个性化饮食建议</h3>
          <div v-for="(advice, i) in dietAdvices" :key="i" class="advice-item">
            <span class="advice-num">{{ i + 1 }}</span>
            <div>
              <p class="advice-title">{{ advice.title }}</p>
              <p class="advice-desc">{{ advice.desc }}</p>
            </div>
          </div>
        </div>

        <!-- 体重预测 -->
        <div v-if="profile.target_weight" class="card weight-predict-card">
          <h3 class="card-section-title">📅 目标达成预测</h3>
          <div class="predict-info">
            <div class="predict-row">
              <span>当前体重</span>
              <span class="predict-val">{{ profile.weight }} kg</span>
            </div>
            <div class="predict-row">
              <span>目标体重</span>
              <span class="predict-val">{{ profile.target_weight }} kg</span>
            </div>
            <div class="predict-row">
              <span>差距</span>
              <span class="predict-val" :style="{ color: weightDiff > 0 ? '#EF5350' : '#4CAF50' }">
                {{ weightDiff > 0 ? '需减' : '需增' }} {{ Math.abs(weightDiff).toFixed(1) }} kg
              </span>
            </div>
            <div class="predict-row highlight-row">
              <span>预计达成时间</span>
              <span class="predict-val" style="color:#4CAF50; font-weight:700;">{{ predictDays }}</span>
            </div>
          </div>
          <p class="predict-tip">* 基于每日 500 kcal 的缺口估算，实际效果因人而异</p>
        </div>

        <!-- 食物推荐 -->
        <div class="card">
          <h3 class="card-section-title">🥗 推荐食物清单</h3>
          <div class="food-rec-tabs">
            <button v-for="cat in foodRecCategories" :key="cat"
              :class="['food-rec-tab', { active: selectedFoodCat === cat }]"
              @click="selectedFoodCat = cat">{{ cat }}</button>
          </div>
          <div class="food-rec-list">
            <div v-for="food in recommendedFoods" :key="food.name" class="food-rec-item">
              <span class="food-rec-emoji">{{ food.emoji }}</span>
              <div class="food-rec-info">
                <span class="food-rec-name">{{ food.name }}</span>
                <span class="food-rec-cal">{{ food.calories }} kcal/100g</span>
              </div>
              <span :class="['food-rec-badge', food.type === 'recommend' ? 'badge-green' : 'badge-orange']">
                {{ food.type === 'recommend' ? '✅ 推荐' : '⚠️ 少吃' }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useDietStore } from '@/stores/diet.js'
import { calcBMI, calcBMR, calcTDEE, getBMICategory, getRecentDates, formatDate } from '@/utils/diet.js'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const dietStore = useDietStore()

const weekRecords = ref([])
const selectedFoodCat = ref('减脂')
const foodRecCategories = ['减脂', '增肌', '均衡']

const profile = computed(() => authStore.profile || {})
const hasProfile = computed(() => !!(profile.value?.weight && profile.value?.height))

const bmi = computed(() => {
  if (!hasProfile.value) return 0
  return calcBMI(profile.value.weight, profile.value.height).toFixed(1)
})

const bmiCategory = computed(() => getBMICategory(parseFloat(bmi.value)))

const bmiPosition = computed(() => {
  const b = parseFloat(bmi.value)
  if (b <= 15) return 0
  if (b >= 35) return 100
  return Math.round((b - 15) / 20 * 100)
})

const bmr = computed(() => {
  if (!hasProfile.value) return 0
  return Math.round(calcBMR(profile.value.weight, profile.value.height, profile.value.age || 25, profile.value.gender || 'male'))
})

const tdee = computed(() => Math.round(calcTDEE(bmr.value, profile.value.activity_level || 'sedentary')))

const recommendedCalories = computed(() => {
  let cal = tdee.value
  if (profile.value.diet_goal === 'lose') cal -= 500
  if (profile.value.diet_goal === 'gain') cal += 300
  return cal
})

const weightDiff = computed(() => {
  if (!profile.value?.weight || !profile.value?.target_weight) return 0
  return parseFloat((profile.value.weight - profile.value.target_weight).toFixed(1))
})

const predictDays = computed(() => {
  if (!weightDiff.value || weightDiff.value === 0) return '已达目标 🎉'
  const totalKcal = Math.abs(weightDiff.value) * 7700
  const dailyDiff = 500
  const days = Math.round(totalKcal / dailyDiff)
  if (days <= 30) return `约 ${days} 天`
  if (days <= 90) return `约 ${Math.round(days / 7)} 周`
  return `约 ${Math.round(days / 30)} 个月`
})

const weekAnalysis = computed(() => {
  if (!weekRecords.value.length) return { days: 0, avgCalories: 0, calorieDiff: 0, conclusion: '', conclusionIcon: '' }
  const dayMap = {}
  weekRecords.value.forEach(r => {
    dayMap[r.record_date] = (dayMap[r.record_date] || 0) + (r.calories || 0)
  })
  const days = Object.keys(dayMap).length
  const total = Object.values(dayMap).reduce((s, v) => s + v, 0)
  const avg = Math.round(total / days)
  const diff = avg - recommendedCalories.value

  let conclusion = '', conclusionIcon = ''
  if (Math.abs(diff) < 200) {
    conclusion = '近期饮食控制很好，热量摄入基本达标，保持这个节奏！'
    conclusionIcon = '🎉'
  } else if (diff > 0) {
    conclusion = `近期平均每天超标 ${diff} kcal，注意控制饮食，减少高热量食物摄入。`
    conclusionIcon = '⚠️'
  } else {
    conclusion = `近期摄入不足，平均每天缺少 ${Math.abs(diff)} kcal，请保证足够的营养摄入。`
    conclusionIcon = '📢'
  }

  return { days, avgCalories: avg, calorieDiff: diff, conclusion, conclusionIcon }
})

const dietAdvices = computed(() => {
  const advices = []
  const goal = profile.value.diet_goal
  const bmiVal = parseFloat(bmi.value)

  if (goal === 'lose' || bmiVal >= 24) {
    advices.push({ title: '控制主食份量', desc: '每餐主食控制在 100-150g，选择糙米、燕麦等低GI食物替代精白米面。' })
    advices.push({ title: '增加蛋白质摄入', desc: '每天摄入体重×1.5g的蛋白质，有助于保持肌肉量，增加饱腹感。' })
    advices.push({ title: '少油少盐少糖', desc: '外卖尽量选择清淡口味，减少炸鸡、奶茶等高热量食物。' })
    advices.push({ title: '多吃膳食纤维', desc: '每天保证 500g 蔬菜，有助于消化，减少热量吸收。' })
  }
  if (goal === 'gain') {
    advices.push({ title: '增加每日热量', desc: '在基础代谢上额外增加 300-500 kcal，重点增加优质蛋白和复合碳水。' })
    advices.push({ title: '运动后及时补充', desc: '训练后 30 分钟内补充蛋白质+碳水，有助于肌肉合成。' })
    advices.push({ title: '少量多餐', desc: '改为每天 4-6 餐，保持血糖稳定，为肌肉合成提供持续能量。' })
  }
  if (goal === 'maintain' || bmiVal >= 18.5 && bmiVal < 24) {
    advices.push({ title: '均衡搭配三餐', desc: '保持"一碗主食+一拳蛋白质+两拳蔬菜"的搭配原则。' })
    advices.push({ title: '减少外卖频率', desc: '尽量自己烹饪，外卖建议每周不超过 5 次，选择少油少盐的品类。' })
    advices.push({ title: '规律进餐时间', desc: '固定早中晚餐时间，避免暴饮暴食和长时间空腹。' })
  }

  advices.push({ title: '保持充足饮水', desc: '每天饮水 1500-2000ml，餐前喝水有助于控制食欲。' })
  return advices.slice(0, 5)
})

// 食物推荐数据
const allFoodRec = {
  '减脂': [
    { name: '鸡胸肉', emoji: '🍗', calories: 133, type: 'recommend' },
    { name: '西兰花', emoji: '🥦', calories: 34, type: 'recommend' },
    { name: '黄瓜', emoji: '🥒', calories: 16, type: 'recommend' },
    { name: '鸡蛋', emoji: '🥚', calories: 144, type: 'recommend' },
    { name: '番茄', emoji: '🍅', calories: 20, type: 'recommend' },
    { name: '炸鸡腿', emoji: '🍗', calories: 279, type: 'avoid' },
    { name: '汉堡', emoji: '🍔', calories: 295, type: 'avoid' },
    { name: '可乐', emoji: '🥤', calories: 43, type: 'avoid' },
  ],
  '增肌': [
    { name: '牛肉', emoji: '🥩', calories: 125, type: 'recommend' },
    { name: '三文鱼', emoji: '🐟', calories: 208, type: 'recommend' },
    { name: '鸡蛋', emoji: '🥚', calories: 144, type: 'recommend' },
    { name: '燕麦', emoji: '🌾', calories: 389, type: 'recommend' },
    { name: '香蕉', emoji: '🍌', calories: 89, type: 'recommend' },
    { name: '酒精饮料', emoji: '🍺', calories: 43, type: 'avoid' },
    { name: '加工食品', emoji: '🌭', calories: 300, type: 'avoid' },
  ],
  '均衡': [
    { name: '糙米', emoji: '🍚', calories: 111, type: 'recommend' },
    { name: '菠菜', emoji: '🥬', calories: 28, type: 'recommend' },
    { name: '苹果', emoji: '🍎', calories: 52, type: 'recommend' },
    { name: '豆腐', emoji: '🧊', calories: 76, type: 'recommend' },
    { name: '牛奶', emoji: '🥛', calories: 54, type: 'recommend' },
    { name: '油炸食品', emoji: '🍟', calories: 312, type: 'avoid' },
    { name: '甜点', emoji: '🍰', calories: 350, type: 'avoid' },
  ]
}

const recommendedFoods = computed(() => allFoodRec[selectedFoodCat.value] || [])

onMounted(async () => {
  const dates = getRecentDates(7)
  weekRecords.value = await dietStore.fetchRecordsByRange(dates[0], dates[dates.length - 1])
})
</script>

<style scoped>
.advice-page { min-height: 100vh; background: var(--bg-gray); }
.advice-header {
  background: linear-gradient(135deg, #7B1FA2, #AB47BC);
  color: #fff;
  padding: 16px 20px 20px;
  padding-top: calc(16px + env(safe-area-inset-top));
}
.advice-header h1 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.advice-header p { font-size: 13px; opacity: 0.85; }

.no-profile-card { text-align: center; padding: 30px; }
.no-profile-icon { font-size: 48px; margin-bottom: 12px; }
.no-profile-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.no-profile-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

/* BMI 卡片 */
.bmi-card { margin-bottom: 12px; }
.bmi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.bmi-header h3 { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
.bmi-desc { font-size: 12px; color: var(--text-secondary); }
.bmi-value-wrap { text-align: right; }
.bmi-number { display: block; font-size: 28px; font-weight: 800; }
.bmi-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 3px; }

.bmi-scale { margin-bottom: 12px; }
.bmi-bar { display: flex; height: 24px; border-radius: 12px; overflow: hidden; position: relative; }
.bmi-seg { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; font-weight: 500; }
.bmi-thin { background: #42A5F5; }
.bmi-normal { background: #4CAF50; flex: 1.5; }
.bmi-over { background: #FFA726; }
.bmi-fat { background: #EF5350; }
.bmi-indicator {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 28px;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(0,0,0,0.3);
  transform: translateX(-50%);
  z-index: 1;
}
.bmi-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-hint); margin-top: 4px; }

.bmi-tip { background: var(--primary-bg); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 13px; color: var(--primary-dark); display: flex; gap: 6px; }
.tip-icon { flex-shrink: 0; }

.card-section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }

.calorie-target-card { margin-bottom: 12px; }
.target-info-row { }
.target-info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.target-info-item:last-child { border-bottom: none; }
.target-info-item.highlight { background: var(--primary-bg); margin: 4px -16px -16px; padding: 10px 16px; border-radius: 0 0 var(--radius) var(--radius); border-bottom: none; }
.ti-label { font-size: 13px; color: var(--text-secondary); }
.ti-val { font-size: 14px; font-weight: 600; }
.ti-val.big { font-size: 18px; font-weight: 800; }
.goal-explain { margin-top: 8px; }
.goal-tag { font-size: 13px; font-weight: 500; }
.goal-tag.lose { color: #E53935; }
.goal-tag.gain { color: #1E88E5; }
.goal-tag.maintain { color: #43A047; }

.week-stat-row { display: flex; justify-content: space-around; margin-bottom: 12px; }
.week-stat { text-align: center; }
.ws-num { display: block; font-size: 22px; font-weight: 700; color: var(--primary-dark); }
.ws-label { font-size: 11px; color: var(--text-secondary); }
.week-conclusion { background: var(--primary-bg); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; gap: 8px; align-items: flex-start; }
.conclusion-icon { font-size: 20px; flex-shrink: 0; }
.week-conclusion p { font-size: 13px; color: var(--primary-dark); line-height: 1.5; }

.advice-list-card { margin-bottom: 12px; }
.week-analysis-card { margin-bottom: 12px; }
.advice-item { display: flex; gap: 10px; margin-bottom: 14px; }
.advice-item:last-child { margin-bottom: 0; }
.advice-num { width: 22px; height: 22px; background: var(--primary); color: #fff; border-radius: 50%; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.advice-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
.advice-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

.weight-predict-card { margin-bottom: 12px; }
.predict-info { }
.predict-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.predict-row:last-child { border-bottom: none; }
.highlight-row { font-weight: 600; }
.predict-val { font-weight: 600; }
.predict-tip { font-size: 11px; color: var(--text-hint); margin-top: 8px; }

.food-rec-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.food-rec-tab { padding: 6px 16px; border: 1.5px solid var(--border); border-radius: 20px; background: #fff; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.food-rec-tab.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary-dark); font-weight: 500; }
.food-rec-list { }
.food-rec-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.food-rec-item:last-child { border-bottom: none; }
.food-rec-emoji { font-size: 24px; }
.food-rec-info { flex: 1; }
.food-rec-name { display: block; font-size: 14px; font-weight: 500; }
.food-rec-cal { font-size: 12px; color: var(--text-secondary); }
</style>
