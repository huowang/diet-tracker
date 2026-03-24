-- ==========================================
-- 轻食记 Diet Tracker - Supabase 数据库初始化
-- 请在 Supabase Dashboard > SQL Editor 中执行
-- ==========================================

-- 0. 先删除旧策略（如果存在）
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户只能插入自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户只能查看自己的饮食记录" ON diet_records;
DROP POLICY IF EXISTS "用户只能插入自己的饮食记录" ON diet_records;
DROP POLICY IF EXISTS "用户只能更新自己的饮食记录" ON diet_records;
DROP POLICY IF EXISTS "用户只能删除自己的饮食记录" ON diet_records;

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  nickname TEXT NOT NULL DEFAULT '用户',
  gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  age INTEGER,
  height NUMERIC(5,1),
  weight NUMERIC(5,1),
  target_weight NUMERIC(5,1),
  activity_level TEXT DEFAULT 'sedentary' CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  diet_goal TEXT DEFAULT 'maintain' CHECK (diet_goal IN ('lose','maintain','gain')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 饮食记录表
CREATE TABLE IF NOT EXISTS diet_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name TEXT NOT NULL,
  diet_type TEXT DEFAULT 'delivery' CHECK (diet_type IN ('delivery','homemade','restaurant')),
  amount NUMERIC(8,1) DEFAULT 100,
  unit TEXT DEFAULT '克',
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(6,1),
  fat NUMERIC(6,1),
  carbs NUMERIC(6,1),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 开启 RLS（行级安全）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_records ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略 - user_profiles
CREATE POLICY "用户只能查看自己的资料" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS 策略 - diet_records
CREATE POLICY "用户只能查看自己的饮食记录" ON diet_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的饮食记录" ON diet_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的饮食记录" ON diet_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的饮食记录" ON diet_records
  FOR DELETE USING (auth.uid() = user_id);

-- 6. 索引优化
CREATE INDEX IF NOT EXISTS idx_diet_records_user_date ON diet_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_diet_records_meal ON diet_records(user_id, meal_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 7. 自动更新 updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 完成！数据库初始化成功 ✅
