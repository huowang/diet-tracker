<template>
  <div class="stats-page">
    <div class="page-header">
      <h1>卡路里统计</h1>
      <div class="period-tabs">
        <button v-for="p in periods" :key="p.value"
          :class="['period-btn', { active: period === p.value }]"
          @click="changePeriod(p.value)">{{ p.label }}</button>
      </div>
    </div>

    <div class="page-content">
      <!-- 本期摘要 -->
      <div class="summary-row">
        <div class="summary-card card">
          <div class="sum-icon">🔥</div>
          <div class="sum-val">{{ avgCalories }}</div>
          <div class="sum-label">日均卡路里</div>
        </div>
        <div class="summary-card card">
          <div class="sum-icon">📈</div>
          <div class="sum-val">{{ totalCalories }}</div>
          <div class="sum-label">累计摄入</div>
        </div>
        <div class="summary-card card">
          <div class="sum-icon">🎯</div>
          <div class="sum-val" :style="{ color: reachRate >= 80 ? '#4CAF50' : '#FFA726' }">{{ reachRate }}%</div>
          <div class="sum-label">达标率</div>
        </div>
      </div>

      <!-- 折线图 -->
      <div class="card chart-card">
        <h3 class="chart-title">每日卡路里趋势</h3>
        <div class="chart-wrap">
          <canvas ref="lineChartEl" height="180"></canvas>
        </div>
      </div>

      <!-- 餐次分布 -->
      <div class="card chart-card">
        <h3 class="chart-title">餐次热量分布</h3>
        <div class="chart-wrap chart-pie">
          <canvas ref="pieChartEl" height="180"></canvas>
        </div>
        <div class="pie-legend">
          <div v-for="m in MEAL_TYPES" :key="m.value" class="legend-item">
            <span class="legend-dot" :style="{ background: m.color }"></span>
            <span>{{ m.label }}</span>
            <span class="legend-val">{{ mealDistribution[m.value] || 0 }} kcal</span>
          </div>
        </div>
      </div>

      <!-- 饮食类型分布 -->
      <div class="card chart-card">
        <h3 class="chart-title">饮食来源分析</h3>
        <div v-for="dt in DIET_TYPES" :key="dt.value" class="diet-dist-item">
          <div class="diet-dist-info">
            <span>{{ dt.emoji }} {{ dt.label }}</span>
            <span>{{ dietTypePercent[dt.value] || 0 }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (dietTypePercent[dt.value] || 0) + '%', background: getDietColor(dt.value) }"></div>
          </div>
          <div class="diet-dist-count">共 {{ dietTypeCounts[dt.value] || 0 }} 次</div>
        </div>
      </div>

      <!-- 每日明细 -->
      <div class="card">
        <h3 class="chart-title">每日明细</h3>
        <div v-if="dailyData.length === 0" class="empty-state">
          <div class="icon">📊</div>
          <p>暂无数据，开始记录饮食吧</p>
        </div>
        <div v-for="day in dailyData" :key="day.date" class="daily-item">
          <div class="daily-left">
            <span class="daily-date">{{ formatDailyDate(day.date) }}</span>
            <div class="daily-bar-wrap">
              <div class="daily-bar">
                <div class="daily-bar-fill" :style="{ width: Math.min(100, day.calories / targetCalories * 100) + '%', background: getBarColor(day.calories) }"></div>
              </div>
              <span class="daily-target-line" :style="{ left: '100%' }"></span>
            </div>
          </div>
          <div class="daily-right">
            <span class="daily-cal" :style="{ color: getBarColor(day.calories) }">{{ day.calories }}</span>
            <span class="daily-unit">kcal</span>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useDietStore } from '@/stores/diet.js'
import { useAuthStore } from '@/stores/auth.js'
import { MEAL_TYPES, DIET_TYPES, calcBMR, calcTDEE, formatDate, getRecentDates } from '@/utils/diet.js'
import TabBar from '@/components/TabBar.vue'

Chart.register(...registerables)

const dietStore = useDietStore()
const authStore = useAuthStore()

const period = ref('7')
const periods = [
  { value: '7', label: '7天' },
  { value: '14', label: '14天' },
  { value: '30', label: '30天' }
]

const lineChartEl = ref(null)
const pieChartEl = ref(null)
let lineChart = null
let pieChart = null

const allRecords = ref([])
const dailyData = ref([])

const targetCalories = computed(() => {
  const p = authStore.profile
  if (!p?.weight || !p?.height || !p?.age) return 2000
  const bmr = calcBMR(p.weight, p.height, p.age, p.gender || 'male')
  let tdee = calcTDEE(bmr, p.activity_level || 'sedentary')
  if (p.diet_goal === 'lose') tdee -= 500
  if (p.diet_goal === 'gain') tdee += 300
  return Math.round(tdee)
})

const totalCalories = computed(() => dailyData.value.reduce((s, d) => s + d.calories, 0))
const avgCalories = computed(() => dailyData.value.length ? Math.round(totalCalories.value / dailyData.value.length) : 0)
const reachRate = computed(() => {
  if (!dailyData.value.length) return 0
  const reach = dailyData.value.filter(d => {
    const r = d.calories / targetCalories.value
    return r >= 0.7 && r <= 1.3
  }).length
  return Math.round(reach / dailyData.value.length * 100)
})

const mealDistribution = computed(() => {
  const dist = {}
  MEAL_TYPES.forEach(m => { dist[m.value] = 0 })
  allRecords.value.forEach(r => { dist[r.meal_type] = (dist[r.meal_type] || 0) + (r.calories || 0) })
  return dist
})

const dietTypeCounts = computed(() => {
  const counts = {}
  allRecords.value.forEach(r => { counts[r.diet_type] = (counts[r.diet_type] || 0) + 1 })
  return counts
})

const dietTypePercent = computed(() => {
  const total = allRecords.value.length
  if (!total) return {}
  const pct = {}
  Object.keys(dietTypeCounts.value).forEach(k => {
    pct[k] = Math.round(dietTypeCounts.value[k] / total * 100)
  })
  return pct
})

function getDietColor(type) {
  return type === 'delivery' ? '#FF7043' : type === 'homemade' ? '#4CAF50' : '#42A5F5'
}

function getBarColor(cal) {
  const r = cal / targetCalories.value
  if (r < 0.7) return '#42A5F5'
  if (r <= 1.1) return '#4CAF50'
  if (r <= 1.3) return '#FFA726'
  return '#EF5350'
}

function formatDailyDate(dateStr) {
  const d = new Date(dateStr)
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}/${d.getDate()} 周${week[d.getDay()]}`
}

async function loadData() {
  const days = parseInt(period.value)
  const dates = getRecentDates(days)
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]
  allRecords.value = await dietStore.fetchRecordsByRange(startDate, endDate)

  // 构建每日数据
  const daily = {}
  dates.forEach(d => { daily[d] = 0 })
  allRecords.value.forEach(r => {
    daily[r.record_date] = (daily[r.record_date] || 0) + (r.calories || 0)
  })
  dailyData.value = dates.map(d => ({ date: d, calories: daily[d] || 0 }))

  await nextTick()
  renderLineChart()
  renderPieChart()
}

function renderLineChart() {
  if (lineChart) lineChart.destroy()
  const ctx = lineChartEl.value?.getContext('2d')
  if (!ctx) return
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dailyData.value.map(d => {
        const dt = new Date(d.date)
        return `${dt.getMonth() + 1}/${dt.getDate()}`
      }),
      datasets: [
        {
          label: '实际摄入',
          data: dailyData.value.map(d => d.calories),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#4CAF50',
          pointRadius: 4
        },
        {
          label: '目标卡路里',
          data: dailyData.value.map(() => targetCalories.value),
          borderColor: '#FFA726',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
        x: { grid: { display: false } }
      }
    }
  })
}

function renderPieChart() {
  if (pieChart) pieChart.destroy()
  const ctx = pieChartEl.value?.getContext('2d')
  if (!ctx) return
  const vals = MEAL_TYPES.map(m => mealDistribution.value[m.value] || 0)
  if (vals.every(v => v === 0)) return
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: MEAL_TYPES.map(m => m.label),
      datasets: [{
        data: vals,
        backgroundColor: MEAL_TYPES.map(m => m.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '60%'
    }
  })
}

function changePeriod(p) {
  period.value = p
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.stats-page { min-height: 100vh; background: var(--bg-gray); }

.page-header {
  background: linear-gradient(135deg, #1565C0, #42A5F5);
  color: #fff;
  padding: 16px 20px;
  padding-top: calc(16px + env(safe-area-inset-top));
}
.page-header h1 { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
.period-tabs { display: flex; gap: 8px; }
.period-btn {
  padding: 5px 16px;
  border: 1.5px solid rgba(255,255,255,0.5);
  border-radius: 20px;
  background: transparent;
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  cursor: pointer;
}
.period-btn.active { background: #fff; color: #1565C0; font-weight: 600; border-color: #fff; }

.summary-row { display: flex; gap: 10px; margin-bottom: 12px; }
.summary-card { flex: 1; text-align: center; padding: 14px 8px; }
.sum-icon { font-size: 22px; margin-bottom: 4px; }
.sum-val { font-size: 20px; font-weight: 700; color: var(--primary-dark); }
.sum-label { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

.chart-card { margin-bottom: 12px; }
.chart-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.chart-wrap { position: relative; height: 180px; }
.chart-pie { height: 180px; }

.pie-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-val { color: var(--text-secondary); margin-left: 2px; }

.diet-dist-item { margin-bottom: 12px; }
.diet-dist-info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; font-weight: 500; }
.diet-dist-count { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }

.daily-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.daily-item:last-child { border-bottom: none; }
.daily-left { flex: 1; }
.daily-date { font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 5px; }
.daily-bar-wrap { position: relative; }
.daily-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.daily-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.daily-right { text-align: right; min-width: 70px; margin-left: 12px; }
.daily-cal { font-size: 16px; font-weight: 700; }
.daily-unit { font-size: 11px; color: var(--text-secondary); margin-left: 2px; }
</style>
