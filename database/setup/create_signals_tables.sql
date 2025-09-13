-- =============================================
-- 交易信号数据表创建脚本
-- 用于存储真实的交易信号数据，支持统计计算
-- =============================================

-- 1. 创建信号数据表
CREATE TABLE IF NOT EXISTS public.trader_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id uuid NOT NULL REFERENCES public.traders(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('current', 'historical')),
  pair text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('做多', '做空')),
  entry_price text NOT NULL,
  take_profit_1 text,
  take_profit_2 text,
  stop_loss text NOT NULL,
  suggested_pnl_ratio text,
  order_type text NOT NULL DEFAULT '限价单',
  contract_type text NOT NULL DEFAULT '永续合约',
  margin_mode text NOT NULL DEFAULT '全仓',
  status text CHECK (status IN ('止盈平仓', '止损平仓', '手动平仓')), -- 仅历史信号有状态
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamptz, -- 仅历史信号有结束时间
  actual_exit_price text, -- 实际平仓价格
  actual_pnl numeric(15,2), -- 实际盈亏金额
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_trader_signals_trader_id ON public.trader_signals(trader_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trader_signals_type ON public.trader_signals(signal_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trader_signals_status ON public.trader_signals(status) WHERE signal_type = 'historical';

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trader_signals_updated_at 
    BEFORE UPDATE ON public.trader_signals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 设置 RLS 策略
ALTER TABLE public.trader_signals ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "trader_signals_select_all" ON public.trader_signals;
DROP POLICY IF EXISTS "trader_signals_insert_api" ON public.trader_signals;

-- 创建策略：所有用户都可以查看信号数据
CREATE POLICY "trader_signals_select_all" ON public.trader_signals 
FOR SELECT USING (true);

-- 创建策略：允许第三方API插入信号数据
CREATE POLICY "trader_signals_insert_api" ON public.trader_signals 
FOR INSERT WITH CHECK (true);

-- 5. 授权
GRANT SELECT ON public.trader_signals TO authenticated, anon;
GRANT INSERT ON public.trader_signals TO authenticated, anon;

-- 6. 插入测试数据
DO $$
DECLARE
    trader_record RECORD;
    signal_count INTEGER;
    current_signals INTEGER;
    historical_signals INTEGER;
BEGIN
    -- 为每个交易员创建信号数据
    FOR trader_record IN 
        SELECT id, name FROM public.traders 
    LOOP
        -- 随机生成信号数量
        current_signals := floor(random() * 15 + 10)::INTEGER; -- 10-24个当前信号
        historical_signals := floor(random() * 25 + 20)::INTEGER; -- 20-44个历史信号
        
        -- 插入当前信号
        FOR i IN 1..current_signals LOOP
            INSERT INTO public.trader_signals (
                trader_id, signal_type, pair, direction, entry_price,
                take_profit_1, take_profit_2, stop_loss, suggested_pnl_ratio,
                order_type, contract_type, margin_mode, created_at
            ) VALUES (
                trader_record.id,
                'current',
                (ARRAY['BTC-USDT-SWAP', 'ETH-USDT-SWAP', 'SOL-USDT-SWAP', 'DOGE-USDT-SWAP'])[floor(random() * 4 + 1)],
                (ARRAY['做多', '做空'])[floor(random() * 2 + 1)],
                (random() * 50000 + 20000)::text,
                CASE WHEN random() > 0.2 THEN (random() * 55000 + 22000)::text ELSE NULL END,
                CASE WHEN random() > 0.4 THEN (random() * 60000 + 24000)::text ELSE NULL END,
                (random() * 45000 + 18000)::text,
                (random() * 4 + 1)::numeric(3,1)::text || ':1',
                '限价单',
                '永续合约',
                '全仓',
                NOW() - (random() * INTERVAL '7 days')
            );
        END LOOP;
        
        -- 插入历史信号
        FOR i IN 1..historical_signals LOOP
            DECLARE
                signal_created_at timestamptz;
                signal_ended_at timestamptz;
                is_profit BOOLEAN;
                entry_price_num NUMERIC;
                exit_price_num NUMERIC;
                direction_val TEXT;
            BEGIN
                signal_created_at := NOW() - (random() * INTERVAL '180 days');
                signal_ended_at := signal_created_at + (random() * INTERVAL '72 hours' + INTERVAL '2 hours');
                is_profit := random() > 0.25; -- 75%的胜率
                entry_price_num := random() * 500 + 100;
                direction_val := (ARRAY['做多', '做空'])[floor(random() * 2 + 1)];
                
                -- 根据方向和盈亏情况计算退出价格
                IF is_profit THEN
                    IF direction_val = '做多' THEN
                        exit_price_num := entry_price_num * (1 + random() * 0.1 + 0.02); -- 2%-12%收益
                    ELSE
                        exit_price_num := entry_price_num * (1 - random() * 0.1 - 0.02); -- 2%-12%收益
                    END IF;
                ELSE
                    IF direction_val = '做多' THEN
                        exit_price_num := entry_price_num * (1 - random() * 0.05 - 0.01); -- 1%-6%亏损
                    ELSE
                        exit_price_num := entry_price_num * (1 + random() * 0.05 + 0.01); -- 1%-6%亏损
                    END IF;
                END IF;
                
                INSERT INTO public.trader_signals (
                    trader_id, signal_type, pair, direction, entry_price,
                    take_profit_1, take_profit_2, stop_loss, suggested_pnl_ratio,
                    order_type, contract_type, margin_mode, status,
                    created_at, ended_at, actual_exit_price, actual_pnl
                ) VALUES (
                    trader_record.id,
                    'historical',
                    (ARRAY['ADA-USDT-SWAP', 'XRP-USDT-SWAP', 'BNB-USDT-SWAP', 'LINK-USDT-SWAP'])[floor(random() * 4 + 1)],
                    direction_val,
                    entry_price_num::text,
                    (entry_price_num * 1.05)::text,
                    (entry_price_num * 1.10)::text,
                    (entry_price_num * 0.98)::text,
                    (random() * 4 + 1)::numeric(3,1)::text || ':1',
                    '限价单',
                    '永续合约',
                    '全仓',
                    CASE WHEN is_profit THEN '止盈平仓' ELSE '止损平仓' END,
                    signal_created_at,
                    signal_ended_at,
                    exit_price_num::text,
                    -- 计算实际盈亏（假设1000 USDT仓位）
                    CASE 
                        WHEN direction_val = '做多' THEN 
                            1000 * (exit_price_num - entry_price_num) / entry_price_num
                        ELSE 
                            1000 * (entry_price_num - exit_price_num) / entry_price_num
                    END
                );
            END;
        END LOOP;
        
        RAISE NOTICE '已为交易员 % 创建 % 个当前信号和 % 个历史信号', 
            trader_record.name, current_signals, historical_signals;
    END LOOP;
    
    RAISE NOTICE '✅ 信号数据创建完成！';
END $$;

-- 7. 创建统计计算函数
CREATE OR REPLACE FUNCTION calculate_trader_statistics(trader_uuid uuid)
RETURNS TABLE (
    win_rate numeric,
    pnl_ratio numeric,
    total_signals integer,
    total_profit numeric,
    total_loss numeric
) AS $$
DECLARE
    total_historical integer;
    win_count integer;
    profit_sum numeric;
    loss_sum numeric;
BEGIN
    -- 获取历史信号统计
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = '止盈平仓'),
        COALESCE(SUM(actual_pnl) FILTER (WHERE actual_pnl > 0), 0),
        COALESCE(ABS(SUM(actual_pnl)) FILTER (WHERE actual_pnl < 0), 0)
    INTO total_historical, win_count, profit_sum, loss_sum
    FROM public.trader_signals 
    WHERE trader_id = trader_uuid AND signal_type = 'historical';
    
    -- 计算胜率
    win_rate := CASE 
        WHEN total_historical > 0 THEN 
            ROUND((win_count::numeric / total_historical::numeric) * 100, 2)
        ELSE 0 
    END;
    
    -- 计算盈亏比
    pnl_ratio := CASE 
        WHEN loss_sum > 0 THEN 
            ROUND(profit_sum / loss_sum, 1)
        WHEN profit_sum > 0 THEN 99.9 -- 表示无亏损
        ELSE 0
    END;
    
    -- 计算总信号数
    SELECT COUNT(*) INTO total_signals 
    FROM public.trader_signals 
    WHERE trader_id = trader_uuid;
    
    total_profit := profit_sum;
    total_loss := loss_sum;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 8. 更新交易员表的统计数据
DO $$
DECLARE
    trader_record RECORD;
    stats RECORD;
BEGIN
    FOR trader_record IN 
        SELECT id, name FROM public.traders 
    LOOP
        -- 计算统计数据
        SELECT * INTO stats FROM calculate_trader_statistics(trader_record.id);
        
        -- 更新交易员表
        UPDATE public.traders 
        SET 
            win_rate = stats.win_rate,
            profit_loss_ratio = stats.pnl_ratio,
            total_signals = stats.total_signals,
            updated_at = NOW()
        WHERE id = trader_record.id;
        
        RAISE NOTICE '已更新交易员 % 的统计数据: 胜率=%.2f%%, 盈亏比=%:1, 信号数=%', 
            trader_record.name, stats.win_rate, stats.pnl_ratio, stats.total_signals;
    END LOOP;
    
    RAISE NOTICE '🎉 所有交易员统计数据更新完成！';
END $$;

-- 9. 验证数据
SELECT 
    t.name,
    t.win_rate,
    t.profit_loss_ratio,
    t.total_signals,
    COUNT(ts.id) as actual_signals
FROM public.traders t
LEFT JOIN public.trader_signals ts ON t.id = ts.trader_id
GROUP BY t.id, t.name, t.win_rate, t.profit_loss_ratio, t.total_signals
ORDER BY t.win_rate DESC
LIMIT 10;