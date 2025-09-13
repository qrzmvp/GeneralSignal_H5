-- =============================================
-- 第三方API密钥表创建脚本
-- 用于存储和验证第三方系统的API密钥
-- =============================================

-- 1. 创建API密钥表
CREATE TABLE IF NOT EXISTS public.third_party_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key text NOT NULL UNIQUE,
  partner_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamptz
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_third_party_api_keys_api_key ON public.third_party_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_third_party_api_keys_partner_name ON public.third_party_api_keys(partner_name);
CREATE INDEX IF NOT EXISTS idx_third_party_api_keys_is_active ON public.third_party_api_keys(is_active);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_third_party_api_keys_updated_at 
    BEFORE UPDATE ON public.third_party_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 设置 RLS 策略
ALTER TABLE public.third_party_api_keys ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "third_party_api_keys_select_service" ON public.third_party_api_keys;

-- 创建策略：仅服务角色可以查看API密钥数据
CREATE POLICY "third_party_api_keys_select_service" ON public.third_party_api_keys 
FOR SELECT USING (current_setting('role') = 'service_role');

-- 5. 授权
GRANT SELECT ON public.third_party_api_keys TO service_role;

-- 6. 插入示例数据
INSERT INTO public.third_party_api_keys (name, api_key, partner_name) VALUES
  ('示例合作伙伴', 'example_api_key_12345', 'Example Partner')
ON CONFLICT (api_key) DO NOTHING;