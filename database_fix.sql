-- 修复数据库表和RLS策略
-- 请在 Supabase SQL Editor 中执行以下命令

-- 1. 确保 profiles 表存在且结构正确
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  website TEXT,
  invitation_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 删除现有的 RLS 策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert during signup" ON profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON profiles;

-- 3. 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. 创建新的 RLS 策略
-- 允许注册时插入用户资料
CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户查看自己的资料
CREATE POLICY "Allow read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 允许用户更新自己的资料
CREATE POLICY "Allow update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. 创建触发器函数来自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, invitation_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'invitation_code'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 7. 创建新的触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. 添加索引以提高性能
-- 用户名允许重复，不创建唯一索引
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- 9. 确保 profiles 表有正确的权限
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- 10. 刷新 realtime 订阅（如果使用 realtime）
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
