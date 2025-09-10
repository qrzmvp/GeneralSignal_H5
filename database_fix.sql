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

-- 5. 邀请码生成函数（幂等）：生成唯一 8 位数字码
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := lpad(floor(random() * 100000000)::int::text, 8, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE invitation_code = code
    );
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 5.1 创建触发器函数来自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code text;
  v_inviter uuid;
BEGIN
  INSERT INTO public.profiles (id, email, username, invitation_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'invitation_code', ''), public.generate_invitation_code())
  );

  -- 绑定邀请关系：使用 referrer_code 指向邀请人的邀请码
  v_ref_code := NULLIF(NEW.raw_user_meta_data->>'referrer_code', '');
  IF v_ref_code IS NOT NULL THEN
    SELECT p.id INTO v_inviter FROM public.profiles p WHERE p.invitation_code = v_ref_code LIMIT 1;
    IF v_inviter IS NOT NULL THEN
      INSERT INTO public.referrals(inviter_id, invitee_id)
      VALUES (v_inviter, NEW.id)
      ON CONFLICT (invitee_id) DO NOTHING;
    END IF;
  END IF;

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

-- 11. Storage：确保公开的 avatars 存储桶与 RLS 策略（幂等）
-- 11.1 创建（或确保存在）公开的 avatars 存储桶
DO $$
BEGIN
  -- 若不存在则创建公开的 avatars 存储桶（兼容不同存储版本：有无 name 列）
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'name'
    ) THEN
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('avatars', 'avatars', true);
    ELSE
      INSERT INTO storage.buckets (id, public)
      VALUES ('avatars', true);
    END IF;
  END IF;
  -- 确保存储桶为公开
  UPDATE storage.buckets SET public = true WHERE id = 'avatars';
END $$;

-- 12. 为已有用户回填缺失的邀请码（一次性，幂等）
DO $$
BEGIN
  UPDATE public.profiles
  SET invitation_code = public.generate_invitation_code()
  WHERE (invitation_code IS NULL OR invitation_code = '');
END $$;

-- 13. 邀请码唯一约束（仅当无重复时添加，幂等）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_invitation_code_unique'
  ) THEN
    IF NOT EXISTS (
      SELECT invitation_code FROM public.profiles
      WHERE invitation_code IS NOT NULL AND invitation_code <> ''
      GROUP BY invitation_code HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_invitation_code_unique UNIQUE (invitation_code);
    END IF;
  END IF;
END $$;

-- 14. 邀请绑定表（幂等）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'referrals'
  ) THEN
    CREATE TABLE public.referrals (
      inviter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      invitee_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );
    CREATE INDEX IF NOT EXISTS referrals_inviter_id_idx ON public.referrals(inviter_id);
  END IF;
END $$;

-- 15. 校验邀请码 RPC（安全定义者）
CREATE OR REPLACE FUNCTION public.validate_invitation_code(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inviter uuid;
BEGIN
  -- 清洗入参，去除两端空白和非字母数字/下划线/短横线字符（例如 <> 等）
  code := regexp_replace(coalesce(code, ''), '[^0-9A-Za-z_-]', '', 'g');
  code := btrim(code);
  IF code IS NULL OR length(code) = 0 THEN
    RETURN NULL;
  END IF;
  SELECT id INTO v_inviter FROM public.profiles WHERE invitation_code = code LIMIT 1;
  RETURN v_inviter;
END;
$$;

-- 允许前端角色调用该 RPC
GRANT EXECUTE ON FUNCTION public.validate_invitation_code(text) TO anon, authenticated;

-- 16. 邀请记录查询 RPC（仅返回当前登录用户作为邀请人的记录；安全定义者）
-- 16.0 移除可能残留的无参重载，避免 PostgREST 选择到旧版本（幂等）
DO $$ BEGIN
  -- 若存在旧版本：public.get_invitees()（无参），则删除
  EXECUTE 'DROP FUNCTION IF EXISTS public.get_invitees()';
EXCEPTION WHEN OTHERS THEN
  -- 忽略由于权限或不存在导致的异常
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.get_invitees(offset_arg int DEFAULT 0, limit_arg int DEFAULT 50)
RETURNS TABLE(email text, username text, invited_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.username, r.created_at AS invited_at
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.invitee_id
  WHERE r.inviter_id = auth.uid()
  ORDER BY r.created_at DESC
  OFFSET GREATEST(coalesce(offset_arg, 0), 0)
  LIMIT LEAST(GREATEST(coalesce(limit_arg, 50), 1), 200);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitees(int, int) TO authenticated;

-- 16.1 提示 PostgREST 重新加载 Schema 缓存（Supabase API）
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- 如果当前角色无权限或未启用 pgrst 通知通道，则忽略
  NULL;
END $$;

-- 16.2 新版游标分页 RPC：使用 keyset pagination，彻底避免 offset/limit 依赖
CREATE OR REPLACE FUNCTION public.get_invitees_v2(
  cursor_created_at timestamptz DEFAULT NULL,
  cursor_invitee_id uuid DEFAULT NULL,
  limit_arg int DEFAULT 10
)
RETURNS TABLE(email text, username text, invited_at timestamptz, invitee_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email,
         p.username,
         r.created_at AS invited_at,
         r.invitee_id
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.invitee_id
  WHERE r.inviter_id = auth.uid()
    AND (
      cursor_created_at IS NULL
      OR (r.created_at, r.invitee_id) < (cursor_created_at, cursor_invitee_id)
    )
  ORDER BY r.created_at DESC, r.invitee_id DESC
  LIMIT LEAST(GREATEST(COALESCE(limit_arg, 10), 1), 200);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitees_v2(timestamptz, uuid, int) TO authenticated;

DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 16.3 极简分页版：后端统一分页，前端仅传 page/page_size（可选过滤）
CREATE OR REPLACE FUNCTION public.get_invitees_paged(
  page int DEFAULT 1,
  page_size int DEFAULT 10,
  q text DEFAULT NULL,                 -- 关键词（按邮箱/用户名模糊）
  start_at timestamptz DEFAULT NULL,   -- 起始时间过滤
  end_at timestamptz DEFAULT NULL      -- 结束时间过滤
)
RETURNS TABLE(
  email text,
  username text,
  invited_at timestamptz,
  invitee_id uuid,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_limit int;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(page_size, 10), 1), 200);
  v_offset := GREATEST(COALESCE(page, 1) - 1, 0) * v_limit;

  RETURN QUERY
  WITH filtered AS (
    SELECT r.invitee_id,
           r.created_at,
           p.email,
           p.username
    FROM public.referrals r
    JOIN public.profiles p ON p.id = r.invitee_id
    WHERE r.inviter_id = auth.uid()
      AND (q IS NULL OR q = '' OR p.email ILIKE '%'||q||'%' OR p.username ILIKE '%'||q||'%')
      AND (start_at IS NULL OR r.created_at >= start_at)
      AND (end_at IS NULL OR r.created_at <= end_at)
  )
  SELECT f.email,
         f.username,
         f.created_at AS invited_at,
         f.invitee_id,
         COUNT(*) OVER() AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC, f.invitee_id DESC
  OFFSET v_offset
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitees_paged(int, int, text, timestamptz, timestamptz) TO authenticated;

DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 11.2 确保 storage.objects 开启 RLS（仅表拥有者/管理员可执行）

-- 17. 为 traders.name 添加唯一约束（仅当无重复时，幂等安全）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'traders'
  ) THEN
    -- 若不存在命名唯一约束，且数据无重复，则添加；否则跳过
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.traders'::regclass AND conname = 'traders_name_unique'
    ) THEN
      IF NOT EXISTS (
        SELECT name FROM public.traders
        WHERE name IS NOT NULL
        GROUP BY name HAVING COUNT(*) > 1
      ) THEN
        ALTER TABLE public.traders ADD CONSTRAINT traders_name_unique UNIQUE (name);
      END IF;
    END IF;
  END IF;
END $$;
DO $$
DECLARE
  obj_owner text;
BEGIN
  SELECT pg_get_userbyid(c.relowner)
    INTO obj_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects';

  IF obj_owner = current_user OR current_user = 'supabase_admin' THEN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
  ELSE
    RAISE NOTICE 'Skip: current_user=% is not owner(%) of storage.objects; RLS enable unchanged', current_user, obj_owner;
  END IF;
END $$;

-- 11.3 公开只读策略：任何人可读取 avatars 桶中的对象
DO $$
DECLARE
  obj_owner text;
BEGIN
  SELECT pg_get_userbyid(c.relowner)
    INTO obj_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects';

  IF obj_owner = current_user OR current_user = 'supabase_admin' THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public read for avatars" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public read for avatars" ON storage.objects FOR SELECT USING (bucket_id = ''avatars'')';
  ELSE
    RAISE NOTICE 'Skip: insufficient privileges to manage storage.objects policies (owner=%, current_user=%)', obj_owner, current_user;
  END IF;
END $$;

-- 11.4 认证用户可管理自己上传到 avatars 的对象（写、改、删）
DO $$
DECLARE
  obj_owner text;
BEGIN
  SELECT pg_get_userbyid(c.relowner)
    INTO obj_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects';

  IF obj_owner = current_user OR current_user = 'supabase_admin' THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated insert own avatars" ON storage.objects';
    EXECUTE 'CREATE POLICY "Authenticated insert own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''avatars'' AND owner = auth.uid())';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated update own avatars" ON storage.objects';
    EXECUTE 'CREATE POLICY "Authenticated update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''avatars'' AND owner = auth.uid()) WITH CHECK (bucket_id = ''avatars'' AND owner = auth.uid())';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated delete own avatars" ON storage.objects';
    EXECUTE 'CREATE POLICY "Authenticated delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''avatars'' AND owner = auth.uid())';
  ELSE
    RAISE NOTICE 'Skip: insufficient privileges to manage storage.objects policies (owner=%, current_user=%)', obj_owner, current_user;
  END IF;
END $$;

-- ============================
-- 17. 我的API（api_keys）- Pragmatic 安全方案
-- 目标：仅本人可见/改/删；前端通过只读视图 api_keys_public 获取列表，永不返回明文 api_secret
-- ============================

-- 17.1 若表不存在则跳过创建（你的环境已存在该表）
-- 可选：在全新环境中创建
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_keys'
  ) THEN
    CREATE TABLE public.api_keys (
      id uuid not null default gen_random_uuid() primary key,
      user_id uuid not null default auth.uid(),
      name text not null,
      exchange text not null,
      api_key text not null,
      api_secret text not null,
      passphrase text null,
      status text not null default 'running'::text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint unique_user_exchange_key_secret unique (user_id, exchange, api_key, api_secret),
      constraint api_keys_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
    );
  END IF;
END $$;

-- 若表已存在但仍为旧的唯一约束（不含 api_secret），则调整为新的联合唯一
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='api_keys' AND constraint_name='unique_user_exchange_apikey'
  ) THEN
    ALTER TABLE public.api_keys DROP CONSTRAINT unique_user_exchange_apikey;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='api_keys' AND constraint_name='unique_user_exchange_key_secret'
  ) THEN
    ALTER TABLE public.api_keys ADD CONSTRAINT unique_user_exchange_key_secret UNIQUE (user_id, exchange, api_key, api_secret);
  END IF;
END $$;

-- 17.2 RLS + 策略（幂等）
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_keys' AND policyname='api_keys_select_own')
  THEN EXECUTE 'DROP POLICY api_keys_select_own ON public.api_keys'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_keys' AND policyname='api_keys_insert_own')
  THEN EXECUTE 'DROP POLICY api_keys_insert_own ON public.api_keys'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_keys' AND policyname='api_keys_update_own')
  THEN EXECUTE 'DROP POLICY api_keys_update_own ON public.api_keys'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_keys' AND policyname='api_keys_delete_own')
  THEN EXECUTE 'DROP POLICY api_keys_delete_own ON public.api_keys'; END IF;
END $$;

CREATE POLICY api_keys_select_own ON public.api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY api_keys_insert_own ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY api_keys_update_own ON public.api_keys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY api_keys_delete_own ON public.api_keys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
REVOKE ALL ON public.api_keys FROM anon;

-- 17.3 掩码函数 + 只读视图（供前端查询）
CREATE OR REPLACE FUNCTION public.mask_middle(txt text, left_keep int default 3, right_keep int default 3)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  select case
           when txt is null then null
           when length(txt) <= left_keep + right_keep then txt
           else substring(txt from 1 for left_keep) || '...' || substring(txt from length(txt) - right_keep + 1)
         end;
$$;

-- 轻量化：如需直接前端查询表，可不依赖视图；保留以下视图段以便需要时启用（可选）
-- CREATE OR REPLACE VIEW public.api_keys_public AS
-- SELECT
--   id,
--   user_id,
--   name,
--   exchange,
--   api_key,
--   public.mask_middle(api_key) AS api_key_masked,
--   '••••••••'::text AS api_secret_masked,
--   (passphrase is not null and length(passphrase) > 0) as has_passphrase,
--   status,
--   created_at,
--   updated_at
-- FROM public.api_keys;
-- GRANT SELECT ON public.api_keys_public TO authenticated;

-- 17.4 触发器：更新时间 & 留空即保留旧密钥
CREATE OR REPLACE FUNCTION public.handle_api_key_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.api_secret IS NULL THEN NEW.api_secret := OLD.api_secret; END IF;
  IF NEW.passphrase IS NULL THEN NEW.passphrase := OLD.passphrase; END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_api_key_update'
  ) THEN
    CREATE TRIGGER on_api_key_update BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.handle_api_key_update();
  END IF;
END $$;

-- 17.5 常用索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_updated ON public.api_keys(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_exchange ON public.api_keys(user_id, exchange);

DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================
-- 18. 我的页面「问题反馈」后端与数据库
-- 目标：
--  - 反馈表 public.feedbacks（仅本人可见/增/改）；
--  - 私有附件桶 storage.bucket 'feedback-attachments'（仅本人可读写）；
--  - 触发器限频：同一用户 60 秒内仅允许 1 次提交；
--  - 必要索引与 Realtime（可选）。
-- ============================

-- 18.1 反馈表（幂等创建）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='feedbacks'
  ) THEN
    CREATE TABLE public.feedbacks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL DEFAULT auth.uid(),
      categories text[] NOT NULL,
      description text NOT NULL,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      contact text NULL,
      env jsonb NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
      CONSTRAINT feedbacks_description_len CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
      CONSTRAINT feedbacks_categories_len CHECK (array_length(categories, 1) BETWEEN 1 AND 4)
    );
  END IF;
END $$;

-- 若缺少列/约束则补齐（幂等安全）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='feedbacks' AND column_name='status'
  ) THEN
    ALTER TABLE public.feedbacks ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='feedbacks' AND column_name='images'
  ) THEN
    ALTER TABLE public.feedbacks ADD COLUMN images jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 18.2 RLS 策略
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedbacks' AND policyname='feedbacks_select_own')
  THEN EXECUTE 'DROP POLICY feedbacks_select_own ON public.feedbacks'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedbacks' AND policyname='feedbacks_insert_own')
  THEN EXECUTE 'DROP POLICY feedbacks_insert_own ON public.feedbacks'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feedbacks' AND policyname='feedbacks_update_own')
  THEN EXECUTE 'DROP POLICY feedbacks_update_own ON public.feedbacks'; END IF;
END $$;

CREATE POLICY feedbacks_select_own ON public.feedbacks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 插入策略：允许 user_id 为空（交由默认值 auth.uid() 填充），或显式等于当前用户
CREATE POLICY feedbacks_insert_own ON public.feedbacks
  FOR INSERT TO authenticated WITH CHECK (COALESCE(user_id, auth.uid()) = auth.uid());

CREATE POLICY feedbacks_update_own ON public.feedbacks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.feedbacks TO authenticated;
REVOKE ALL ON public.feedbacks FROM anon;

-- 18.3 触发器：更新时间与 60s 限频
CREATE OR REPLACE FUNCTION public.handle_feedback_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_feedback_update') THEN
    CREATE TRIGGER on_feedback_update BEFORE UPDATE ON public.feedbacks
    FOR EACH ROW EXECUTE FUNCTION public.handle_feedback_update();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_feedback_spam()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  recent_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.feedbacks
    WHERE user_id = NEW.user_id
      AND created_at >= timezone('utc'::text, now()) - interval '60 seconds'
  ) INTO recent_exists;

  IF recent_exists THEN
    -- 使用有效的 SQLSTATE 码（自定义/通用：P0001），并通过 DETAIL/HINT 传递可机读信息
    RAISE EXCEPTION 'Too Many Requests: please wait before submitting again'
      USING ERRCODE = 'P0001',         -- generic raise_exception
            DETAIL = 'TooManyRequests',
            HINT = 'cooldown_seconds=60';
  END IF;

  RETURN NEW;
END;$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_feedback_insert_limit') THEN
    CREATE TRIGGER on_feedback_insert_limit BEFORE INSERT ON public.feedbacks
    FOR EACH ROW EXECUTE FUNCTION public.prevent_feedback_spam();
  END IF;
END $$;

-- 18.4 索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_created ON public.feedbacks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.feedbacks(status);

-- 18.5 Storage：feedback-attachments 桶（私有）与 RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='feedback-attachments') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='storage' AND table_name='buckets' AND column_name='name'
    ) THEN
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('feedback-attachments', 'feedback-attachments', false);
    ELSE
      INSERT INTO storage.buckets (id, public)
      VALUES ('feedback-attachments', false);
    END IF;
  END IF;
  -- 强制为私有
  UPDATE storage.buckets SET public=false WHERE id='feedback-attachments';
END $$;

-- 确保 storage.objects 开启 RLS（若前文已启用会跳过）
DO $$
DECLARE obj_owner text; BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO obj_owner
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='storage' AND c.relname='objects';
  IF obj_owner = current_user OR current_user='supabase_admin' THEN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 私有读写策略（仅对象 owner=auth.uid() 且在 feedback-attachments 桶）
DO $$
DECLARE obj_owner text; BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO obj_owner
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='storage' AND c.relname='objects';

  IF obj_owner = current_user OR current_user='supabase_admin' THEN
    EXECUTE 'DROP POLICY IF EXISTS "Feedback read own attachments" ON storage.objects';
    EXECUTE 'CREATE POLICY "Feedback read own attachments" ON storage.objects
             FOR SELECT TO authenticated
             USING (
               bucket_id = ''feedback-attachments''
               AND (
                 owner = auth.uid() OR name LIKE auth.uid()::text || ''/%''
               )
             )';

    EXECUTE 'DROP POLICY IF EXISTS "Feedback insert own attachments" ON storage.objects';
    EXECUTE 'CREATE POLICY "Feedback insert own attachments" ON storage.objects
             FOR INSERT TO authenticated
             WITH CHECK (
               bucket_id = ''feedback-attachments''
               AND (
                 owner = auth.uid() OR name LIKE auth.uid()::text || ''/%''
               )
             )';

    EXECUTE 'DROP POLICY IF EXISTS "Feedback update own attachments" ON storage.objects';
    EXECUTE 'CREATE POLICY "Feedback update own attachments" ON storage.objects
             FOR UPDATE TO authenticated
             USING (
               bucket_id = ''feedback-attachments'' AND (owner = auth.uid() OR name LIKE auth.uid()::text || ''/%'')
             )
             WITH CHECK (
               bucket_id = ''feedback-attachments'' AND (owner = auth.uid() OR name LIKE auth.uid()::text || ''/%'')
             )';

    EXECUTE 'DROP POLICY IF EXISTS "Feedback delete own attachments" ON storage.objects';
    EXECUTE 'CREATE POLICY "Feedback delete own attachments" ON storage.objects
             FOR DELETE TO authenticated
             USING (
               bucket_id = ''feedback-attachments'' AND (owner = auth.uid() OR name LIKE auth.uid()::text || ''/%'')
             )';
  END IF;
END $$;

-- Realtime（可选）：加入 publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication p
      JOIN pg_publication_rel pr ON pr.prpubid = p.oid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.pubname='supabase_realtime' AND n.nspname='public' AND c.relname='feedbacks'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks';
    END IF;
  END IF;
END $$;

DO $$ BEGIN PERFORM pg_notify('pgrst', 'reload schema'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================
-- 19. 将军榜单：交易员表、RLS、索引、头像存储与统一分页 RPC
-- 目标：
--  - 表 public.traders：名称/描述/收益率/胜率/盈亏比/累计信号/头像key/标签；
--  - 公开读取（anon/authenticated 可 SELECT），写入仅后台（service_role）；
--  - 存储桶 trader-avatars（公开只读），保存 avatar_key；
--  - 统一分页 RPC：get_traders_paged(page,page_size,q,sort_by,order_by)。
-- ============================

-- 19.1 扩展（可选）：pg_trgm，加速 ILIKE 模糊
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname='pg_trgm';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 19.2 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='traders'
  ) THEN
    CREATE TABLE public.traders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text NULL,
      yield_rate numeric(7,2) NOT NULL DEFAULT 0 CHECK (yield_rate BETWEEN -10000 AND 10000),
      win_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (win_rate BETWEEN 0 AND 100),
      profit_loss_ratio numeric(7,2) NULL,
      total_signals integer NOT NULL DEFAULT 0,
      avatar_key text NULL,
      avatar_url text NULL,
      tags text[] NOT NULL DEFAULT '{}'::text[],
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );
  END IF;
END $$;

-- 向后兼容：如果已存在 traders 表，但缺少 avatar_url 字段，则添加之
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='traders'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='traders' AND column_name='avatar_url'
    ) THEN
      ALTER TABLE public.traders ADD COLUMN avatar_url text NULL;
    END IF;
  END IF;
END $$;

-- 19.3 触发器：更新时间
CREATE OR REPLACE FUNCTION public.handle_trader_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_trader_update') THEN
    CREATE TRIGGER on_trader_update BEFORE UPDATE ON public.traders
    FOR EACH ROW EXECUTE FUNCTION public.handle_trader_update();
  END IF;
END $$;

-- 19.4 RLS 策略：公开可读，写入仅后端服务
ALTER TABLE public.traders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='traders' AND policyname='traders_public_read')
  THEN EXECUTE 'DROP POLICY traders_public_read ON public.traders'; END IF;
END $$;

CREATE POLICY traders_public_read ON public.traders
  FOR SELECT TO anon, authenticated USING (true);

-- 不创建 INSERT/UPDATE/DELETE 对前端的策略；由 service_role 直连或 Edge Function 维护
GRANT SELECT ON public.traders TO anon, authenticated;

-- 19.5 索引
CREATE INDEX IF NOT EXISTS idx_traders_name ON public.traders(name);
CREATE INDEX IF NOT EXISTS idx_traders_updated ON public.traders(updated_at DESC);
-- 默认综合排序常用的回退组合
CREATE INDEX IF NOT EXISTS idx_traders_yield_win_id ON public.traders(yield_rate DESC, win_rate DESC, id DESC);
-- 模糊搜索（pg_trgm）
DO $$ BEGIN
  -- 若 pg_trgm 可用则建 GIN 索引，加速 ILIKE
  PERFORM 1 FROM pg_extension WHERE extname='pg_trgm';
  IF FOUND THEN
    CREATE INDEX IF NOT EXISTS idx_traders_name_trgm ON public.traders USING gin (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_traders_desc_trgm ON public.traders USING gin (description gin_trgm_ops);
  END IF;
END $$;

-- 19.6 存储桶：trader-avatars（公开只读）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='trader-avatars') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='storage' AND table_name='buckets' AND column_name='name'
    ) THEN
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('trader-avatars', 'trader-avatars', true);
    ELSE
      INSERT INTO storage.buckets (id, public)
      VALUES ('trader-avatars', true);
    END IF;
  END IF;
  UPDATE storage.buckets SET public=true WHERE id='trader-avatars';
END $$;

-- storage.objects 策略：公开读取 trader-avatars
DO $$
DECLARE obj_owner text; BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO obj_owner
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='storage' AND c.relname='objects';
  IF obj_owner = current_user OR current_user='supabase_admin' THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public read for trader-avatars" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public read for trader-avatars" ON storage.objects FOR SELECT USING (bucket_id = ''trader-avatars'')';
  END IF;
END $$;

-- 19.7 统一分页 RPC：get_traders_paged
-- 先删除旧版本函数（当返回列变化时，CREATE OR REPLACE 无法直接更改 OUT 参数定义）
DO $$
BEGIN
  EXECUTE 'DROP FUNCTION IF EXISTS public.get_traders_paged(int,int,text,text,text)';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.get_traders_paged(
  page int DEFAULT 1,
  page_size int DEFAULT 10,
  q text DEFAULT NULL,
  sort_by text DEFAULT 'score',   -- 'score' | 'yield' | 'win'
  order_by text DEFAULT 'desc'    -- 'asc' | 'desc'
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  yield_rate numeric,
  win_rate numeric,
  profit_loss_ratio numeric,
  total_signals int,
  avatar_key text,
  avatar_url text,
  tags text[],
  score numeric,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_limit int;
  v_sort text := lower(coalesce(sort_by,'score'));
  v_order text := lower(coalesce(order_by,'desc'));
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(page_size, 10), 1), 50);
  v_offset := GREATEST(COALESCE(page, 1) - 1, 0) * v_limit;

  IF v_sort NOT IN ('score','yield','win') THEN v_sort := 'score'; END IF;
  IF v_order NOT IN ('asc','desc') THEN v_order := 'desc'; END IF;

  RETURN QUERY
  WITH base AS (
    SELECT t.*,
           (t.yield_rate * (t.win_rate/100.0))::numeric AS score
    FROM public.traders t
    WHERE (
      q IS NULL OR q = '' OR
      t.name ILIKE '%'||q||'%' OR coalesce(t.description,'') ILIKE '%'||q||'%'
    )
  ),
  ranked AS (
    SELECT b.id, b.name, b.description,
           b.yield_rate, b.win_rate, b.profit_loss_ratio, b.total_signals,
           b.avatar_key, b.avatar_url, b.tags, b.score, b.updated_at,
           COUNT(*) OVER() AS total_count
    FROM base b
    ORDER BY
      CASE WHEN v_sort='score' THEN b.score END    -- 主排序字段（NULLs last 由次序保证）
      , CASE WHEN v_sort='yield' THEN b.yield_rate END
      , CASE WHEN v_sort='win'   THEN b.win_rate END
      , b.id
    -- 上面的顺序方向需要在外层处理；为了简单，在下一层做方向翻转
  )
  SELECT r.id, r.name, r.description,
         r.yield_rate, r.win_rate, r.profit_loss_ratio, r.total_signals,
         r.avatar_key, r.avatar_url, r.tags, r.score, r.updated_at, r.total_count
  FROM ranked r
  ORDER BY
    CASE WHEN v_sort='score' AND v_order='asc' THEN r.score END ASC NULLS LAST,
    CASE WHEN v_sort='score' AND v_order='desc' THEN r.score END DESC NULLS LAST,
    CASE WHEN v_sort='yield' AND v_order='asc' THEN r.yield_rate END ASC NULLS LAST,
    CASE WHEN v_sort='yield' AND v_order='desc' THEN r.yield_rate END DESC NULLS LAST,
    CASE WHEN v_sort='win' AND v_order='asc' THEN r.win_rate END ASC NULLS LAST,
    CASE WHEN v_sort='win' AND v_order='desc' THEN r.win_rate END DESC NULLS LAST,
    r.id DESC
  OFFSET v_offset
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_traders_paged(int,int,text,text,text) TO anon, authenticated;

DO $$ BEGIN PERFORM pg_notify('pgrst', 'reload schema'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 18.6 RPC：安全地创建反馈（服务端绑定 user_id），可接收可选自定义 id 用于与前端上传路径关联
CREATE OR REPLACE FUNCTION public.create_feedback(
  p_id uuid DEFAULT NULL,
  p_categories text[] DEFAULT ARRAY[]::text[],
  p_description text DEFAULT NULL,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_contact text DEFAULT NULL,
  p_env jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid := coalesce(p_id, gen_random_uuid());
BEGIN
  -- 基本校验（与表约束保持一致）
  IF p_description IS NULL OR char_length(p_description) < 10 OR char_length(p_description) > 500 THEN
    RAISE EXCEPTION 'invalid description length';
  END IF;
  IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) < 1 OR array_length(p_categories, 1) > 4 THEN
    RAISE EXCEPTION 'invalid categories length';
  END IF;

  INSERT INTO public.feedbacks (id, user_id, categories, description, images, contact, env)
  VALUES (v_id, auth.uid(), p_categories, p_description, coalesce(p_images, '[]'::jsonb), p_contact, p_env);

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_feedback(uuid, text[], text, jsonb, text, jsonb) TO authenticated;

DO $$ BEGIN PERFORM pg_notify('pgrst', 'reload schema'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

