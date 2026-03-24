import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      user.value = session.user
      await fetchProfile()
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      user.value = session?.user || null
      if (session?.user) await fetchProfile()
      else profile.value = null
    })
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.value.id)
      .single()
    profile.value = data
  }

  async function register(email, password, nickname) {
    loading.value = true
    try {
      // 关闭邮箱确认，直接登录
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { nickname }
        }
      })
      if (error) throw error
      
      // 如果 signUp 成功但没有 session（邮箱确认开启），尝试直接登录
      if (data.user && !data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email, password
        })
        if (!signInError && signInData.user) {
          user.value = signInData.user
          await supabase.from('user_profiles').insert({
            user_id: signInData.user.id,
            nickname,
            email,
            created_at: new Date().toISOString()
          })
          await fetchProfile()
          return { success: true, needsSetup: true }
        }
      }
      
      if (data.user) {
        user.value = data.user
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          nickname,
          email,
          created_at: new Date().toISOString()
        })
        await fetchProfile()
        const needsSetup = !profile.value?.height && !profile.value?.weight
        return { success: true, needsSetup }
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  async function login(email, password) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      user.value = data.user
      await fetchProfile()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  async function updateProfile(data) {
    if (!user.value) {
      return { success: false, error: '用户未登录，请重新登录' }
    }
    
    console.log('开始保存资料，用户ID:', user.value.id)
    console.log('提交的数据:', data)
    
    try {
      const profileData = {
        user_id: user.value.id,
        email: user.value.email,
        nickname: data.nickname && data.nickname.trim() !== '' ? data.nickname.trim() : '用户',
        gender: data.gender || 'male',
        age: data.age || null,
        height: data.height || null,
        weight: data.weight || null,
        target_weight: data.target_weight || null,
        activity_level: data.activity_level || 'sedentary',
        diet_goal: data.diet_goal || 'maintain',
        updated_at: new Date().toISOString()
      }
      
      // 使用 Promise.race 添加 10 秒超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 10000)
      })
      
      // 先检查记录是否存在
      const checkPromise = supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.value.id)
        .single()
      
      const { data: existing, error: checkError } = await Promise.race([checkPromise, timeoutPromise])
      console.log('检查现有记录结果:', existing, '错误:', checkError)
      
      let result
      let error
      if (existing) {
        console.log('执行 UPDATE 操作')
        result = await Promise.race([
          supabase.from('user_profiles').update(profileData).eq('user_id', user.value.id),
          timeoutPromise
        ])
        error = result?.error
      } else {
        console.log('执行 INSERT 操作')
        profileData.created_at = new Date().toISOString()
        result = await Promise.race([
          supabase.from('user_profiles').insert(profileData),
          timeoutPromise
        ])
        error = result?.error
      }
      
      console.log('操作结果:', result)
      
      if (error) {
        console.error('保存资料失败:', error)
        return { success: false, error: error.message || JSON.stringify(error) }
      }
      
      await fetchProfile()
      console.log('保存成功!')
      return { success: true }
    } catch (e) {
      console.error('保存资料异常:', e)
      return { success: false, error: e.message || String(e) }
    }
  }

  return { user, profile, loading, isLoggedIn, init, register, login, logout, updateProfile, fetchProfile }
})
