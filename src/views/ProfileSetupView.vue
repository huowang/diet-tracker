<template>
  <div class="setup-page">
    <div class="setup-header">
      <h1>完善个人信息</h1>
      <p>帮助我们为您制定专属的饮食计划</p>
    </div>

    <div class="setup-body">
      <div class="step-indicator">
        <span>基本信息</span>
        <div class="step-line"></div>
        <span>目标设定</span>
      </div>

      <div class="card" style="margin-bottom:16px">
        <h3 class="section-title">📋 基本信息</h3>
        <div class="gender-row">
          <label>性别</label>
          <div class="gender-btns">
            <button :class="['gender-btn', { active: form.gender === 'male' }]" @click="form.gender = 'male'">👨 男</button>
            <button :class="['gender-btn', { active: form.gender === 'female' }]" @click="form.gender = 'female'">👩 女</button>
          </div>
        </div>
        <div class="input-group">
          <label>年龄</label>
          <input v-model.number="form.age" type="number" placeholder="请输入年龄" min="10" max="100" />
        </div>
        <div class="row-inputs">
          <div class="input-group flex1">
            <label>身高 (cm)</label>
            <input v-model.number="form.height" type="number" placeholder="例如 170" />
          </div>
          <div class="input-group flex1">
            <label>体重 (kg)</label>
            <input v-model.number="form.weight" type="number" placeholder="例如 65" />
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <h3 class="section-title">🎯 目标设定</h3>
        <div class="input-group">
          <label>目标体重 (kg)</label>
          <input v-model.number="form.target_weight" type="number" placeholder="您的目标体重" />
        </div>
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
          <select v-model="form.diet_goal">
            <option value="lose">减脂瘦身</option>
            <option value="maintain">保持体重</option>
            <option value="gain">增肌增重</option>
          </select>
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <button class="btn btn-primary btn-block" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '完成设置，开始使用 →' }}
      </button>
      <button class="btn-skip" @click="router.push('/home')">暂时跳过</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const saving = ref(false)
const errorMsg = ref('')

const form = reactive({
  gender: 'male',
  age: null,
  height: null,
  weight: null,
  target_weight: null,
  activity_level: 'sedentary',
  diet_goal: 'maintain'
})

async function handleSave() {
  errorMsg.value = ''
  if (!form.age || !form.height || !form.weight) {
    errorMsg.value = '请填写年龄、身高和体重'
    return
  }
  saving.value = true
  const res = await authStore.updateProfile(form)
  saving.value = false
  if (res.success) {
    window.$toast?.('个人信息已保存 ✅')
    router.push('/home')
  } else {
    errorMsg.value = '保存失败，请重试'
  }
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  background: var(--bg-gray);
}
.setup-header {
  background: linear-gradient(135deg, var(--primary), #2E7D32);
  color: #fff;
  padding: 40px 20px 24px;
  text-align: center;
}
.setup-header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.setup-header p { opacity: 0.85; font-size: 14px; }
.setup-body { padding: 16px; padding-bottom: 40px; }

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}
.step-line { width: 40px; height: 1px; background: var(--border); }

.section-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; }

.gender-row { margin-bottom: 14px; }
.gender-row label { font-size: 13px; color: var(--text-secondary); font-weight: 500; display: block; margin-bottom: 8px; }
.gender-btns { display: flex; gap: 10px; }
.gender-btn {
  flex: 1;
  padding: 10px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-white);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.gender-btn.active {
  border-color: var(--primary);
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-weight: 500;
}

.row-inputs { display: flex; gap: 12px; }
.flex1 { flex: 1; }

.error-msg { color: var(--danger); font-size: 13px; text-align: center; margin-bottom: 12px; }

.btn-skip {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: var(--text-hint);
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
  padding: 8px;
  cursor: pointer;
}
</style>
