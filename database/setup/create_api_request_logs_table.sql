-- =============================================
-- API请求日志表创建脚本
-- 用于记录API请求以实现频率限制
-- =============================================

-- 1. 创建API请求日志表
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.third_party_api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  ip_address inet,
  requested_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON public.api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_endpoint ON public.api_request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_requested_at ON public.api_request_logs(requested_at);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_endpoint_time ON public.api_request_logs(api_key_id, endpoint, requested_at);

-- 3. 设置 RLS 策略
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "api_request_logs_select_service" ON public.api_request_logs;

-- 创建策略：仅服务角色可以查看API请求日志数据
CREATE POLICY "api_request_logs_select_service" ON public.api_request_logs 
FOR SELECT USING (current_setting('role') = 'service_role');

-- 4. 授权
GRANT SELECT, INSERT ON public.api_request_logs TO service_role;

-- 5. 创建清理旧日志的函数
CREATE OR REPLACE FUNCTION public.cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  -- 删除超过24小时的请求日志
  DELETE FROM public.api_request_logs 
  WHERE requested_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 6. 可以设置定时任务定期清理旧日志（在Supabase中通过数据库定时任务实现）