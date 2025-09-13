-- 快速修复：为trader_signals表添加INSERT策略

-- 删除可能存在的旧策略并创建新策略
DROP POLICY IF EXISTS "trader_signals_insert_api" ON public.trader_signals;

-- 创建策略：允许第三方API插入信号数据
CREATE POLICY "trader_signals_insert_api" ON public.trader_signals 
FOR INSERT WITH CHECK (true);

-- 授权INSERT权限
GRANT INSERT ON public.trader_signals TO anon, authenticated;

-- 验证策略
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'trader_signals';
