-- =============================================
-- 更新交易员统计计算函数 - 添加收益率计算
-- 基于真实历史信号数据计算收益率
-- =============================================

-- 1. 删除旧版本函数
DROP FUNCTION IF EXISTS calculate_trader_statistics(uuid);

-- 2. 创建新的统计计算函数（包含收益率）
CREATE OR REPLACE FUNCTION calculate_trader_statistics(trader_uuid uuid)
RETURNS TABLE (
    win_rate numeric,
    pnl_ratio numeric,
    yield_rate numeric,
    total_signals integer,
    total_profit numeric,
    total_loss numeric
) AS $$
DECLARE
    total_historical integer;
    win_count integer;
    profit_sum numeric;
    loss_sum numeric;
    total_net_pnl numeric;
BEGIN
    -- 获取历史信号统计
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = '止盈平仓'),
        COALESCE(SUM(actual_pnl) FILTER (WHERE actual_pnl > 0), 0),
        COALESCE(SUM(actual_pnl) FILTER (WHERE actual_pnl < 0), 0),
        COALESCE(SUM(actual_pnl), 0)
    INTO total_historical, win_count, profit_sum, loss_sum, total_net_pnl
    FROM public.trader_signals 
    WHERE trader_id = trader_uuid AND signal_type = 'historical';
    
    -- 计算胜率
    win_rate := CASE 
        WHEN total_historical > 0 THEN 
            ROUND((win_count::numeric / total_historical::numeric) * 100, 2)
        ELSE 0 
    END;
    
    -- 计算盈亏比
    loss_sum := ABS(loss_sum);
    pnl_ratio := CASE 
        WHEN loss_sum > 0 THEN 
            ROUND(profit_sum / loss_sum, 1)
        WHEN profit_sum > 0 THEN 99.9 -- 表示无亏损
        ELSE 0
    END;
    
    -- 计算收益率（固定1000 USDT基准）
    yield_rate := ROUND((total_net_pnl / 1000.0) * 100, 2);
    
    -- 计算总信号数
    SELECT COUNT(*) INTO total_signals 
    FROM public.trader_signals 
    WHERE trader_id = trader_uuid;
    
    total_profit := profit_sum;
    total_loss := loss_sum;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 3. 更新交易员表结构（如果需要存储计算出的收益率）
DO $$
BEGIN
    -- 检查是否需要添加计算收益率字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'traders' 
        AND column_name = 'calculated_yield_rate'
    ) THEN
        ALTER TABLE public.traders 
        ADD COLUMN calculated_yield_rate numeric(7,2) DEFAULT NULL;
        
        COMMENT ON COLUMN public.traders.calculated_yield_rate IS '基于历史信号计算的真实收益率';
    END IF;
END $$;

-- 4. 更新所有交易员的统计数据（包括收益率）
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
            calculated_yield_rate = stats.yield_rate,
            total_signals = stats.total_signals,
            updated_at = NOW()
        WHERE id = trader_record.id;
        
        RAISE NOTICE '已更新交易员 % 的统计数据: 胜率=%.2f%%, 盈亏比=%:1, 收益率=%.2f%%, 信号数=%', 
            trader_record.name, stats.win_rate, stats.pnl_ratio, stats.yield_rate, stats.total_signals;
    END LOOP;
    
    RAISE NOTICE '🎉 所有交易员统计数据更新完成（含收益率）！';
END $$;

-- 5. 验证数据 - 对比静态收益率和计算收益率
SELECT 
    t.name,
    t.yield_rate as static_yield_rate,        -- 静态收益率
    t.calculated_yield_rate as calc_yield_rate, -- 计算收益率
    t.win_rate,
    t.profit_loss_ratio,
    t.total_signals,
    COUNT(ts.id) as actual_signals
FROM public.traders t
LEFT JOIN public.trader_signals ts ON t.id = ts.trader_id
GROUP BY t.id, t.name, t.yield_rate, t.calculated_yield_rate, t.win_rate, t.profit_loss_ratio, t.total_signals
ORDER BY t.calculated_yield_rate DESC NULLS LAST
LIMIT 10;

-- 6. 显示收益率对比统计
SELECT 
    '📊 收益率数据对比' as title,
    ROUND(AVG(yield_rate), 2) as avg_static_yield,
    ROUND(AVG(calculated_yield_rate), 2) as avg_calculated_yield,
    ROUND(STDDEV(yield_rate), 2) as static_yield_stddev,
    ROUND(STDDEV(calculated_yield_rate), 2) as calc_yield_stddev,
    COUNT(*) as total_traders
FROM public.traders
WHERE calculated_yield_rate IS NOT NULL;