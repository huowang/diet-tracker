<template>
  <div class="home-page">
    <!-- 顶部 -->
    <div class="home-header">
      <div class="header-left">
        <p class="greeting">{{ greeting }}，{{ authStore.profile?.nickname || '朋友' }} 👋</p>
        <p class="date-text">{{ todayStr }}</p>
      </div>
      <div class="date-nav">
        <button class="date-btn" @click="changeDate(-1)">‹</button>
        <span class="date-label" @click="goToday">{{ isToday ? '今天' : dateLabel }}</span>
        <button class="date-btn" :disabled="isToday" @click="changeDate(1)">›</button>
      </div>
    </div>

    <!-- 今日卡路里概览 -->
    <div class="calorie-overview card">
      <div class="cal-circle-wrap">
        <svg class="cal-circle" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#E8F5E9" stroke-width="10"/>
          <circle cx="60" cy="60" r="50" fill="none" :stroke="circleColor" stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="`${circleProgress * 314.16 / 100} 314.16`"
            stroke-dashoffset="78.54"
            transform="rotate(-90 60 60)"
            style="transition:stroke-dasharray 0.5s ease"/>
          <text x="60" y="54" text-anchor="middle" font-size="22" font-weight="700" :fill="circleColor">{{ todayIntake }}</text>
          <text x="60" y="70" text-anchor="middle" font-size="11" fill="#9E9E9E">千卡</text>
        </svg>
      </div>
      <div class="cal-info">
        <div class="cal-item">
          <span class="cal-label">目标</span>
          <span class="cal-value">{{ targetCalories }} kcal</span>
        </div>
        <div class="cal-item">
          <span class="cal-label">已摄入</span>
          <span class="cal-value" :style="{ color: circleColor }">{{ todayIntake }} kcal</span>
        </div>
        <div class="cal-item">
          <span class="cal-label">剩余</span>
          <span class="cal-value" :style="{ color: remaining < 0 ? '#EF5350' : '#4CAF50' }">
            {{ remaining >= 0 ? remaining : '超' + Math.abs(remaining) }} kcal
          </span>
        </div>
        <div class="cal-status-badge" :style="{ background: statusBadgeBg, color: calorieStatus.color }">
          {{ calorieStatus.emoji }} {{ calorieStatus.label }}
        </div>
      </div>
    </div>

    <!-- 三餐营养分布 -->
    <div class="meal-stats card" style="margin-bottom:12px">
      <div v-for="meal in MEAL_TYPES" :key="meal.value" class="meal-stat-row">
        <span class="meal-emoji">{{ meal.emoji }}</span>
        <span class="meal-name">{{ meal.label }}</span>
        <div class="progress-bar flex1">
          <div class="progress-fill" :style="{ width: getMealProgress(meal.value) + '%', background: meal.color }"></div>
        </div>
        <span class="meal-cal">{{ getMealCalories(meal.value) }} kcal</span>
      </div>
    </div>

    <!-- 三餐列表 -->
    <div v-for="meal in MEAL_TYPES" :key="meal.value" class="meal-section">
      <div class="meal-header" @click="toggleMeal(meal.value)">
        <div class="meal-title-wrap">
          <span class="meal-icon" :style="{ background: meal.color + '20' }">{{ meal.emoji }}</span>
          <div>
            <span class="meal-title">{{ meal.label }}</span>
            <span class="meal-sub">{{ getMealCalories(meal.value) }} kcal · {{ getMealRecords(meal.value).length }} 种食物</span>
          </div>
        </div>
        <div class="meal-actions">
          <button class="add-food-btn" @click.stop="openAddModal(meal.value)">+</button>
          <span class="collapse-icon">{{ collapsedMeals[meal.value] ? '▼' : '▲' }}</span>
        </div>
      </div>

      <transition name="slide-up">
        <div v-if="!collapsedMeals[meal.value]" class="food-list">
          <div v-if="getMealRecords(meal.value).length === 0" class="empty-meal">
            <span>暂无记录，点击 + 添加食物</span>
          </div>
          <div v-for="record in getMealRecords(meal.value)" :key="record.id" class="food-item">
            <div class="food-item-left">
              <span class="food-emoji">{{ getFoodEmoji(record) }}</span>
              <div>
                <p class="food-name">{{ record.food_name }}</p>
                <p class="food-meta">
                  <span :class="['badge', getDietTypeBadge(record.diet_type)]">{{ getDietTypeLabel(record.diet_type) }}</span>
                  <span class="food-amount">{{ record.amount }}{{ record.unit }}</span>
                </p>
              </div>
            </div>
            <div class="food-item-right">
              <span class="food-cal">{{ record.calories }} kcal</span>
              <button class="del-btn" @click="handleDelete(record.id)">🗑</button>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 底部导航 -->
    <TabBar />

    <!-- 添加食物弹窗 -->
    <transition name="fade">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-title">添加食物 · {{ currentMealLabel }}</div>

          <!-- 饮食类型 -->
          <div class="diet-type-row">
            <button v-for="dt in DIET_TYPES" :key="dt.value"
              :class="['diet-type-btn', { active: addForm.diet_type === dt.value }]"
              @click="addForm.diet_type = dt.value">
              {{ dt.emoji }} {{ dt.label }}
            </button>
          </div>

          <!-- 搜索食物 -->
          <div class="input-group">
            <label>搜索食物</label>
            <input v-model="searchQuery" type="text" placeholder="输入食物名称搜索..." @input="filterFoods" />
          </div>

          <!-- 食物选择 -->
          <div v-if="filteredFoods.length > 0" class="food-select-list">
            <div v-for="food in filteredFoods.slice(0, 10)" :key="food.name"
              :class="['food-select-item', { active: selectedFood?.name === food.name }]"
              @click="selectFood(food)">
              <span>{{ food.emoji }} {{ food.name }}</span>
              <span class="food-select-cal">{{ food.calories }}kcal/100g</span>
            </div>
          </div>

          <!-- 手动输入 -->
          <div v-if="!selectedFood" class="input-group">
            <label>或手动输入食物名称</label>
            <input v-model="addForm.food_name" type="text" placeholder="食物名称" />
          </div>

          <div v-if="selectedFood" class="selected-food-info">
            <span>已选：{{ selectedFood.emoji }} {{ selectedFood.name }}</span>
            <button class="clear-btn" @click="selectedFood = null; addForm.food_name = ''">✕</button>
          </div>

          <div class="row-inputs">
            <div class="input-group flex1">
              <label>数量</label>
              <input v-model.number="addForm.amount" type="number" placeholder="100" min="1" @input="calcCalories" />
            </div>
            <div class="input-group flex1">
              <label>单位</label>
              <select v-model="addForm.unit" @change="calcCalories">
                <option value="克">克</option>
                <option value="毫升">毫升</option>
                <option value="个">个</option>
                <option value="份">份</option>
                <option value="片">片</option>
                <option value="碗">碗</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label>卡路里 (kcal)</label>
            <input v-model.number="addForm.calories" type="number" placeholder="自动计算或手动填写" />
          </div>

          <div class="input-group">
            <label>备注（可选）</label>
            <textarea v-model="addForm.note" placeholder="例如：加了辣，少油..." rows="2"></textarea>
          </div>

          <button class="btn btn-primary btn-block" :disabled="addLoading" @click="handleAddFood">
            {{ addLoading ? '添加中...' : '添加到' + currentMealLabel }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useDietStore } from '@/stores/diet.js'
import { MEAL_TYPES, DIET_TYPES, FOOD_DATABASE, calcBMR, calcTDEE, getCalorieStatus, formatDate, formatDateCN } from '@/utils/diet.js'
import TabBar from '@/components/TabBar.vue'

const authStore = useAuthStore()
const dietStore = useDietStore()

const currentDate = ref(new Date())
const collapsedMeals = reactive({ breakfast: false, lunch: false, dinner: false, snack: true })
const showAddModal = ref(false)
const currentMeal = ref('breakfast')
const addLoading = ref(false)
const searchQuery = ref('')
const filteredFoods = ref([])
const selectedFood = ref(null)

const addForm = reactive({
  food_name: '', diet_type: 'delivery', amount: 100, unit: '克', calories: null, note: ''
})

const todayStr = computed(() => formatDateCN(currentDate.value))
const isToday = computed(() => formatDate(currentDate.value) === formatDate(new Date()))
const dateLabel = computed(() => {
  const d = currentDate.value
  return `${d.getMonth() + 1}/${d.getDate()}`
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 10) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const targetCalories = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height || !p?.age) return 2000
  const bmr = calcBMR(p.weight, p.height, p.age, p.gender || 'male')
  let tdee = calcTDEE(bmr, p.activity_level || 'sedentary')
  if (p.diet_goal === 'lose') tdee -= 500
  if (p.diet_goal === 'gain') tdee += 300
  return Math.round(tdee)
})

const todayIntake = computed(() => dietStore.todayCalories)
const remaining = computed(() => targetCalories.value - todayIntake.value)

const circleProgress = computed(() => Math.min(100, (todayIntake.value / targetCalories.value) * 100))
const circleColor = computed(() => {
  const r = todayIntake.value / targetCalories.value
  if (r < 0.7) return '#42A5F5'
  if (r <= 1.1) return '#4CAF50'
  if (r <= 1.3) return '#FFA726'
  return '#EF5350'
})

const calorieStatus = computed(() => getCalorieStatus(todayIntake.value, targetCalories.value))
const statusBadgeBg = computed(() => calorieStatus.value.color + '20')

const currentMealLabel = computed(() => MEAL_TYPES.find(m => m.value === currentMeal.value)?.label || '')

function getMealRecords(meal) { return dietStore.getRecordsByMeal(meal) }
function getMealCalories(meal) { return getMealRecords(meal).reduce((s, r) => s + (r.calories || 0), 0) }
function getMealProgress(meal) { return todayIntake.value > 0 ? Math.round(getMealCalories(meal) / targetCalories.value * 100) : 0 }
function toggleMeal(meal) { collapsedMeals[meal] = !collapsedMeals[meal] }

function getDietTypeBadge(type) {
  return type === 'delivery' ? 'badge-orange' : type === 'homemade' ? 'badge-green' : 'badge-blue'
}
function getDietTypeLabel(type) {
  return DIET_TYPES.find(d => d.value === type)?.label || ''
}
function getFoodEmoji(record) {
  return FOOD_DATABASE.find(f => f.name === record.food_name)?.emoji || '🍽️'
}

function changeDate(delta) {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + delta)
  if (d <= new Date()) {
    currentDate.value = d
    dietStore.fetchRecords(formatDate(d))
  }
}
function goToday() {
  currentDate.value = new Date()
  dietStore.fetchRecords(formatDate(new Date()))
}

function openAddModal(meal) {
  currentMeal.value = meal
  addForm.food_name = ''
  addForm.diet_type = 'delivery'
  addForm.amount = 100
  addForm.unit = '克'
  addForm.calories = null
  addForm.note = ''
  selectedFood.value = null
  searchQuery.value = ''
  filteredFoods.value = []
  showAddModal.value = true
}

function filterFoods() {
  if (!searchQuery.value) { filteredFoods.value = []; return }
  filteredFoods.value = FOOD_DATABASE.filter(f => f.name.includes(searchQuery.value) || f.category.includes(searchQuery.value))
}

function selectFood(food) {
  selectedFood.value = food
  addForm.food_name = food.name
  addForm.unit = '克'
  addForm.amount = 100
  calcCalories()
  filteredFoods.value = []
  searchQuery.value = ''
}

function calcCalories() {
  if (!selectedFood.value || !addForm.amount) return
  addForm.calories = Math.round(selectedFood.value.calories * addForm.amount / 100)
}

async function handleAddFood() {
  if (!addForm.food_name) { window.$toast?.('请填写食物名称'); return }
  if (!addForm.calories || addForm.calories <= 0) { window.$toast?.('请填写卡路里'); return }
  addLoading.value = true
  const res = await dietStore.addRecord({
    meal_type: currentMeal.value,
    food_name: addForm.food_name,
    diet_type: addForm.diet_type,
    amount: addForm.amount,
    unit: addForm.unit,
    calories: addForm.calories,
    note: addForm.note,
    record_date: formatDate(currentDate.value)
  })
  addLoading.value = false
  if (res.success) {
    window.$toast?.('添加成功 ✅')
    showAddModal.value = false
  } else {
    window.$toast?.(res.error || '添加失败，请重试')
  }
}

async function handleDelete(id) {
  const res = await dietStore.deleteRecord(id)
  if (res.success) window.$toast?.('已删除')
}

onMounted(() => {
  dietStore.fetchRecords(formatDate(currentDate.value))
})
</script>

<style scoped>
.home-page { min-height: 100vh; background: var(--bg-gray); }

.home-header {
  background: linear-gradient(135deg, #2E7D32, #4CAF50);
  padding: 16px 20px;
  padding-top: calc(16px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.greeting { font-size: 18px; font-weight: 700; }
.date-text { font-size: 12px; opacity: 0.8; margin-top: 2px; }
.date-nav { display: flex; align-items: center; gap: 8px; }
.date-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.date-btn:disabled { opacity: 0.3; }
.date-label { font-size: 13px; font-weight: 500; cursor: pointer; }

.calorie-overview {
  margin: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.cal-circle-wrap { flex-shrink: 0; }
.cal-circle { width: 110px; height: 110px; }
.cal-info { flex: 1; }
.cal-item { display: flex; justify-content: space-between; margin-bottom: 6px; }
.cal-label { font-size: 12px; color: var(--text-secondary); }
.cal-value { font-size: 13px; font-weight: 600; }
.cal-status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.meal-stats { margin: 0 16px 12px; }
.meal-stat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.meal-stat-row:last-child { margin-bottom: 0; }
.meal-emoji { font-size: 16px; width: 20px; }
.meal-name { font-size: 12px; color: var(--text-secondary); width: 28px; }
.flex1 { flex: 1; }
.meal-cal { font-size: 11px; color: var(--text-secondary); width: 60px; text-align: right; }

.meal-section { background: #fff; margin: 0 16px 12px; border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
}
.meal-title-wrap { display: flex; align-items: center; gap: 10px; }
.meal-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.meal-title { display: block; font-size: 15px; font-weight: 600; }
.meal-sub { font-size: 12px; color: var(--text-secondary); }
.meal-actions { display: flex; align-items: center; gap: 8px; }
.add-food-btn {
  width: 28px; height: 28px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.collapse-icon { color: var(--text-hint); font-size: 12px; }

.food-list { border-top: 1px solid var(--border); padding: 8px 0; }
.empty-meal { text-align: center; padding: 12px; color: var(--text-hint); font-size: 13px; }
.food-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.food-item-left { display: flex; align-items: center; gap: 10px; }
.food-emoji { font-size: 24px; }
.food-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.food-meta { display: flex; align-items: center; gap: 6px; }
.food-amount { font-size: 12px; color: var(--text-secondary); }
.food-item-right { display: flex; align-items: center; gap: 8px; }
.food-cal { font-size: 14px; font-weight: 600; color: var(--primary-dark); }
.del-btn { background: none; border: none; cursor: pointer; font-size: 16px; }

/* 弹窗内样式 */
.diet-type-row { display: flex; gap: 8px; margin-bottom: 14px; }
.diet-type-btn {
  flex: 1;
  padding: 9px 4px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-white);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.diet-type-btn.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary-dark); font-weight: 500; }

.food-select-list {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
}
.food-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.food-select-item:last-child { border-bottom: none; }
.food-select-item:hover, .food-select-item.active { background: var(--primary-bg); }
.food-select-cal { font-size: 12px; color: var(--text-secondary); }

.selected-food-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary-bg);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--primary-dark);
  font-weight: 500;
}
.clear-btn { background: none; border: none; cursor: pointer; color: var(--text-hint); font-size: 14px; }

.row-inputs { display: flex; gap: 12px; }
</style>
