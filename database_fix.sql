-- 修复数据库表和 RLS 策略（与 supabase_setup.sql 保持一致，幂等可重复执行）

-- 1. 确保 profiles 表存在且结构正确
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  website TEXT,
  invitation_code TEXT,
  membership_level public.membership_level DEFAULT 'free' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.1 枚举：membership_level（幂等创建）
DO $$ BEGIN
  CREATE TYPE public.membership_level AS ENUM ('free','basic','pro','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1.2 若 profiles 已存在但缺少 membership_level 列，则补充（幂等）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN membership_level public.membership_level DEFAULT 'free' NOT NULL;
  END IF;
END $$;

-- 1.3 统一 email 约束（NOT NULL + UNIQUE，幂等且安全）
DO $$
BEGIN
  -- 若 email 列可为空且数据中不存在 NULL，则改为 NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email' AND is_nullable = 'YES'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email IS NULL) THEN
      ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
    END IF;
  END IF;

  -- 若不存在命名唯一约束，且数据无重复，则添加；否则保留现状
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_email_unique'
  ) THEN
    IF NOT EXISTS (
      SELECT email FROM public.profiles GROUP BY email HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
  END IF;
END $$;

-- 2. 删除现有的 RLS 策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert during signup" ON profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON profiles;

-- 3. 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. 创建新的 RLS 策略（与 supabase_setup.sql 保持一致）
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
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

-- 8. 统一 email 索引策略
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_email_unique'
  ) THEN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profiles_email_idx') THEN
      DROP INDEX IF EXISTS public.profiles_email_idx;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT email FROM public.profiles GROUP BY email HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
      IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profiles_email_idx') THEN
        DROP INDEX IF EXISTS public.profiles_email_idx;
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profiles_email_idx') THEN
        CREATE INDEX profiles_email_idx ON public.profiles(email);
      END IF;
    END IF;
  END IF;
END $$;

-- 9. 确保 profiles 表有正确的权限
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- 10. 刷新 realtime 订阅（如果使用 realtime）
-- 若已加入则跳过，避免 “relation is already member of publication” 错误
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication p
      JOIN pg_publication_rel pr ON pr.prpubid = p.oid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.pubname = 'supabase_realtime'
        AND n.nspname = 'public'
        AND c.relname = 'profiles'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
    END IF;
  END IF;
END
$$;
