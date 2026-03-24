import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase.js'
import { useAuthStore } from './auth.js'

export const useDietStore = defineStore('diet', () => {
  const records = ref([])
  const loading = ref(false)
  const todayCalories = ref(0)

  async function fetchRecords(date) {
    const authStore = useAuthStore()
    if (!authStore.user) return
    loading.value = true
    const { data } = await supabase
      .from('diet_records')
      .select('*')
      .eq('user_id', authStore.user.id)
      .eq('record_date', date)
      .order('created_at', { ascending: true })
    records.value = data || []
    calcTodayCalories()
    loading.value = false
  }

  async function fetchRecordsByRange(startDate, endDate) {
    const authStore = useAuthStore()
    if (!authStore.user) return []
    const { data } = await supabase
      .from('diet_records')
      .select('*')
      .eq('user_id', authStore.user.id)
      .gte('record_date', startDate)
      .lte('record_date', endDate)
      .order('record_date', { ascending: true })
    return data || []
  }

  async function addRecord(record) {
    const authStore = useAuthStore()
    if (!authStore.user) return { success: false, error: '用户未登录' }
    try {
      const { data, error } = await supabase
        .from('diet_records')
        .insert({ ...record, user_id: authStore.user.id, created_at: new Date().toISOString() })
        .select()
        .single()
      if (error) {
        console.error('添加饮食记录失败:', error)
        return { success: false, error: error.message }
      }
      if (data) {
        records.value.push(data)
        calcTodayCalories()
      }
      return { success: true, data }
    } catch (e) {
      console.error('添加饮食记录异常:', e)
      return { success: false, error: e.message }
    }
  }

  async function updateRecord(id, updates) {
    const { error } = await supabase
      .from('diet_records')
      .update(updates)
      .eq('id', id)
    if (!error) {
      const idx = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value[idx] = { ...records.value[idx], ...updates }
      calcTodayCalories()
    }
    return { success: !error }
  }

  async function deleteRecord(id) {
    const { error } = await supabase
      .from('diet_records')
      .delete()
      .eq('id', id)
    if (!error) {
      records.value = records.value.filter(r => r.id !== id)
      calcTodayCalories()
    }
    return { success: !error }
  }

  function calcTodayCalories() {
    todayCalories.value = records.value.reduce((sum, r) => sum + (r.calories || 0), 0)
  }

  function getRecordsByMeal(meal) {
    return records.value.filter(r => r.meal_type === meal)
  }

  return { records, loading, todayCalories, fetchRecords, fetchRecordsByRange, addRecord, updateRecord, deleteRecord, getRecordsByMeal }
})
