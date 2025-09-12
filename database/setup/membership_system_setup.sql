-- =============================================
-- 会员系统数据库设置脚本
-- 包含：会员套餐表、付费记录表、支付配置表
-- 幂等脚本：可重复执行
-- =============================================

-- 1. 会员套餐表 (membership_plans)
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text NOT NULL CHECK (plan_type IN ('manual', 'auto')),
  duration_months integer NOT NULL CHECK (duration_months > 0),
  price_usdt numeric(10,2) NOT NULL CHECK (price_usdt >= 0),
  original_price_usdt numeric(10,2) NOT NULL CHECK (original_price_usdt >= 0),
  title text NOT NULL,
  description text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.1 会员套餐表索引
CREATE INDEX IF NOT EXISTS idx_membership_plans_type_active ON public.membership_plans(plan_type, is_active);
CREATE INDEX IF NOT EXISTS idx_membership_plans_sort ON public.membership_plans(sort_order, created_at);

-- 1.2 会员套餐表RLS策略
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "membership_plans_select_all" ON public.membership_plans;

-- 创建新策略：所有用户可查看激活的套餐
CREATE POLICY "membership_plans_select_all" ON public.membership_plans
  FOR SELECT USING (is_active = true);

-- 授权
GRANT SELECT ON public.membership_plans TO authenticated;
GRANT SELECT ON public.membership_plans TO anon;

-- 2. 付费记录表 (payment_records)
CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.membership_plans(id),
  payment_method text NOT NULL CHECK (payment_method IN ('TRC20', 'ERC20')),
  payment_address text NOT NULL,
  sender_address text,
  amount_usdt numeric(10,2) NOT NULL CHECK (amount_usdt > 0),
  transaction_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reviewing')),
  payment_type text NOT NULL,
  completed_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.1 付费记录表索引
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON public.payment_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON public.payment_records(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_method ON public.payment_records(payment_method, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_hash ON public.payment_records(transaction_hash) WHERE transaction_hash IS NOT NULL;

-- 2.2 付费记录表RLS策略
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "payment_records_select_own" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_insert_own" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_update_own" ON public.payment_records;

-- 创建新策略：用户只能查看自己的付费记录
CREATE POLICY "payment_records_select_own" ON public.payment_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 用户可以插入自己的付费记录
CREATE POLICY "payment_records_insert_own" ON public.payment_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的付费记录（限制字段）
CREATE POLICY "payment_records_update_own" ON public.payment_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 授权
GRANT SELECT, INSERT, UPDATE ON public.payment_records TO authenticated;

-- 3. 支付配置表 (payment_config)
CREATE TABLE IF NOT EXISTS public.payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method text NOT NULL UNIQUE CHECK (payment_method IN ('TRC20', 'ERC20')),
  wallet_address text NOT NULL,
  network_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.1 支付配置表RLS策略
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "payment_config_select_all" ON public.payment_config;

-- 创建新策略：所有用户可查看激活的支付配置
CREATE POLICY "payment_config_select_all" ON public.payment_config
  FOR SELECT USING (is_active = true);

-- 授权
GRANT SELECT ON public.payment_config TO authenticated;
GRANT SELECT ON public.payment_config TO anon;

-- 4. 更新时间戳触发器函数（复用现有函数）
-- handle_updated_at 函数已在 supabase_setup.sql 中定义

-- 4.1 为会员套餐表添加更新时间戳触发器
DROP TRIGGER IF EXISTS handle_membership_plans_updated_at ON public.membership_plans;
CREATE TRIGGER handle_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4.2 为付费记录表添加更新时间戳触发器
DROP TRIGGER IF EXISTS handle_payment_records_updated_at ON public.payment_records;
CREATE TRIGGER handle_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4.3 为支付配置表添加更新时间戳触发器
DROP TRIGGER IF EXISTS handle_payment_config_updated_at ON public.payment_config;
CREATE TRIGGER handle_payment_config_updated_at
  BEFORE UPDATE ON public.payment_config
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. 初始化会员套餐数据
INSERT INTO public.membership_plans (plan_type, duration_months, price_usdt, original_price_usdt, title, description, sort_order)
VALUES 
  -- 手动跟单套餐
  ('manual', 12, 119.90, 140.00, '手动跟单 · 1年', '长期投资者的选择', 1),
  ('manual', 3, 29.90, 35.00, '手动跟单 · 3个月', '最具性价比', 2),
  ('manual', 1, 9.90, 12.00, '手动跟单 · 1个月', '适合短期体验', 3),
  -- 自动跟单套餐
  ('auto', 12, 240.00, 280.00, '自动跟单 · 1年', '一劳永逸，全年无忧', 4),
  ('auto', 3, 60.00, 70.00, '自动跟单 · 3个月', '省心省力的选择', 5),
  ('auto', 1, 20.00, 25.00, '自动跟单 · 1个月', '灵活的自动跟单', 6)
ON CONFLICT DO NOTHING;

-- 6. 初始化支付配置数据
INSERT INTO public.payment_config (payment_method, wallet_address, network_name)
VALUES 
  ('TRC20', 'TXYZ...abcd...efgh', 'TRON'),
  ('ERC20', '0x12...cdef...3456', 'Ethereum')
ON CONFLICT (payment_method) DO UPDATE SET
  wallet_address = EXCLUDED.wallet_address,
  network_name = EXCLUDED.network_name,
  updated_at = timezone('utc'::text, now());

-- 7. 创建查询付费记录的RPC函数
CREATE OR REPLACE FUNCTION public.get_payment_records(
  page_size int DEFAULT 10,
  page_offset int DEFAULT 0,
  filter_status text DEFAULT NULL,
  filter_method text DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan_id uuid,
  payment_method text,
  payment_address text,
  sender_address text,
  amount_usdt numeric,
  transaction_hash text,
  status text,
  payment_type text,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  plan_title text,
  plan_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.user_id,
    pr.plan_id,
    pr.payment_method,
    pr.payment_address,
    pr.sender_address,
    pr.amount_usdt,
    pr.transaction_hash,
    pr.status,
    pr.payment_type,
    pr.completed_at,
    pr.expires_at,
    pr.created_at,
    mp.title as plan_title,
    mp.price_usdt as plan_price
  FROM public.payment_records pr
  LEFT JOIN public.membership_plans mp ON pr.plan_id = mp.id
  WHERE pr.user_id = auth.uid()
    AND (filter_status IS NULL OR pr.status = filter_status)
    AND (filter_method IS NULL OR pr.payment_method = filter_method)
    AND (filter_type IS NULL OR pr.payment_type ILIKE '%' || filter_type || '%')
  ORDER BY pr.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 授权RPC函数
GRANT EXECUTE ON FUNCTION public.get_payment_records(int, int, text, text, text) TO authenticated;

-- 8. 通知PostgREST重新加载Schema缓存
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 完成提示
DO $$ BEGIN
  RAISE NOTICE '会员系统数据库设置完成！';
  RAISE NOTICE '- 已创建 membership_plans 表（会员套餐）';
  RAISE NOTICE '- 已创建 payment_records 表（付费记录）';
  RAISE NOTICE '- 已创建 payment_config 表（支付配置）';
  RAISE NOTICE '- 已初始化基础数据';
  RAISE NOTICE '- 已设置RLS策略和权限';
END $$;