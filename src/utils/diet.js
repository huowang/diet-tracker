// 常见食物卡路里数据库（每100g）
export const FOOD_DATABASE = [
  // 主食
  { name: '米饭', category: '主食', calories: 116, unit: '克', emoji: '🍚' },
  { name: '面条', category: '主食', calories: 137, unit: '克', emoji: '🍜' },
  { name: '馒头', category: '主食', calories: 223, unit: '个(约80g)', calories_per_unit: 178, emoji: '🥐' },
  { name: '面包', category: '主食', calories: 265, unit: '片(约40g)', calories_per_unit: 106, emoji: '🍞' },
  { name: '包子', category: '主食', calories: 178, unit: '个(约100g)', calories_per_unit: 178, emoji: '🥟' },
  { name: '饺子', category: '主食', calories: 240, unit: '个(约30g)', calories_per_unit: 72, emoji: '🥟' },
  { name: '粥', category: '主食', calories: 46, unit: '克', emoji: '🍲' },
  // 蔬菜
  { name: '西兰花', category: '蔬菜', calories: 34, unit: '克', emoji: '🥦' },
  { name: '菠菜', category: '蔬菜', calories: 28, unit: '克', emoji: '🥬' },
  { name: '番茄', category: '蔬菜', calories: 20, unit: '克', emoji: '🍅' },
  { name: '黄瓜', category: '蔬菜', calories: 16, unit: '克', emoji: '🥒' },
  { name: '土豆', category: '蔬菜', calories: 76, unit: '克', emoji: '🥔' },
  { name: '胡萝卜', category: '蔬菜', calories: 37, unit: '克', emoji: '🥕' },
  // 肉类
  { name: '鸡胸肉', category: '肉类', calories: 133, unit: '克', emoji: '🍗' },
  { name: '猪肉(瘦)', category: '肉类', calories: 143, unit: '克', emoji: '🥩' },
  { name: '牛肉', category: '肉类', calories: 125, unit: '克', emoji: '🥩' },
  { name: '鸡蛋', category: '肉类', calories: 144, unit: '个(约55g)', calories_per_unit: 79, emoji: '🥚' },
  { name: '三文鱼', category: '肉类', calories: 208, unit: '克', emoji: '🐟' },
  { name: '虾', category: '肉类', calories: 93, unit: '克', emoji: '🦐' },
  // 水果
  { name: '苹果', category: '水果', calories: 52, unit: '个(约200g)', calories_per_unit: 104, emoji: '🍎' },
  { name: '香蕉', category: '水果', calories: 89, unit: '根(约120g)', calories_per_unit: 107, emoji: '🍌' },
  { name: '橙子', category: '水果', calories: 47, unit: '个(约180g)', calories_per_unit: 85, emoji: '🍊' },
  { name: '草莓', category: '水果', calories: 32, unit: '克', emoji: '🍓' },
  { name: '葡萄', category: '水果', calories: 69, unit: '克', emoji: '🍇' },
  // 饮品
  { name: '牛奶', category: '饮品', calories: 54, unit: '毫升', emoji: '🥛' },
  { name: '豆浆', category: '饮品', calories: 13, unit: '毫升', emoji: '🥛' },
  { name: '可乐', category: '饮品', calories: 43, unit: '毫升', emoji: '🥤' },
  { name: '橙汁', category: '饮品', calories: 45, unit: '毫升', emoji: '🧃' },
  // 外卖常见
  { name: '汉堡', category: '外卖', calories: 295, unit: '个(约150g)', calories_per_unit: 443, emoji: '🍔' },
  { name: '炸鸡腿', category: '外卖', calories: 279, unit: '个(约120g)', calories_per_unit: 335, emoji: '🍗' },
  { name: '披萨(一片)', category: '外卖', calories: 266, unit: '片(约100g)', calories_per_unit: 266, emoji: '🍕' },
  { name: '炒饭', category: '外卖', calories: 165, unit: '克', emoji: '🍳' },
  { name: '沙拉', category: '外卖', calories: 50, unit: '克', emoji: '🥗' },
  { name: '麻辣烫', category: '外卖', calories: 120, unit: '克', emoji: '🍲' },
  { name: '烤鸭饭', category: '外卖', calories: 280, unit: '份(约300g)', calories_per_unit: 840, emoji: '🦆' },
]

export const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐', emoji: '🌅', color: '#FF9800' },
  { value: 'lunch', label: '午餐', emoji: '☀️', color: '#4CAF50' },
  { value: 'dinner', label: '晚餐', emoji: '🌙', color: '#5C6BC0' },
  { value: 'snack', label: '加餐', emoji: '🍎', color: '#EC407A' },
]

export const DIET_TYPES = [
  { value: 'delivery', label: '点外卖', emoji: '🛵' },
  { value: 'homemade', label: '自己做', emoji: '👨‍🍳' },
  { value: 'restaurant', label: '在外就餐', emoji: '🍽️' },
]

// 计算BMR（基础代谢率）
export function calcBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  }
}

// 计算TDEE（每日总能量消耗）
export function calcTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  return bmr * (multipliers[activityLevel] || 1.2)
}

// 计算BMI
export function calcBMI(weight, height) {
  const h = height / 100
  return weight / (h * h)
}

// BMI 分类
export function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: '偏瘦', color: '#42A5F5', advice: '建议适当增加饮食摄入' }
  if (bmi < 24) return { label: '正常', color: '#4CAF50', advice: '体重正常，继续保持' }
  if (bmi < 28) return { label: '超重', color: '#FFA726', advice: '建议控制饮食，增加运动' }
  return { label: '肥胖', color: '#EF5350', advice: '建议积极减重，咨询专业医生' }
}

// 卡路里状态
export function getCalorieStatus(intake, target) {
  const ratio = intake / target
  if (ratio < 0.7) return { label: '摄入不足', color: '#42A5F5', emoji: '😟' }
  if (ratio <= 1.1) return { label: '摄入适中', color: '#4CAF50', emoji: '😊' }
  if (ratio <= 1.3) return { label: '略微超标', color: '#FFA726', emoji: '😐' }
  return { label: '严重超标', color: '#EF5350', emoji: '😰' }
}

// 格式化日期
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().split('T')[0]
}

export function formatDateCN(date) {
  const d = date instanceof Date ? date : new Date(date)
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week[d.getDay()]}`
}

// 获取最近N天的日期列表
export function getRecentDates(n) {
  const dates = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(formatDate(d))
  }
  return dates
}
