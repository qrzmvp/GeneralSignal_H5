-- 为第三方API添加trader_signals表的INSERT策略

-- 创建策略：允许通过API插入信号数据
CREATE POLICY "trader_signals_insert_api" ON public.trader_signals 
FOR INSERT 
WITH CHECK (true);

-- 授权INSERT权限给anon用户（用于API调用）
GRANT INSERT ON public.trader_signals TO anon;
GRANT UPDATE ON public.traders TO anon;

-- 验证策略是否创建成功
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'trader_signals';
