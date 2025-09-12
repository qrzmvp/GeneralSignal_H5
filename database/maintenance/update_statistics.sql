-- =============================================
-- 更新交易员统计数据的 RPC 函数
-- 用于基于真实信号数据更新统计指标
-- =============================================

-- 创建或替换统计更新函数
CREATE OR REPLACE FUNCTION public.update_trader_statistics()
RETURNS TEXT AS $$
DECLARE
    trader_record RECORD;
    stats RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- 遍历所有交易员
    FOR trader_record IN 
        SELECT id, name FROM public.traders 
    LOOP
        -- 计算该交易员的统计数据
        SELECT * INTO stats FROM calculate_trader_statistics(trader_record.id);
        
        -- 更新交易员表中的统计数据
        UPDATE public.traders 
        SET 
            win_rate = stats.win_rate,
            profit_loss_ratio = stats.pnl_ratio,
            total_signals = stats.total_signals,
            updated_at = NOW()
        WHERE id = trader_record.id;
        
        updated_count := updated_count + 1;
        
        -- 记录更新日志
        RAISE NOTICE '已更新交易员 % 的统计数据: 胜率=%.2f%%, 盈亏比=%:1, 信号数=%', 
            trader_record.name, stats.win_rate, stats.pnl_ratio, stats.total_signals;
    END LOOP;
    
    RETURN format('成功更新了 %s 个交易员的统计数据', updated_count);
END;
$$ LANGUAGE plpgsql;

-- 创建获取交易员详细统计数据的函数
CREATE OR REPLACE FUNCTION public.get_trader_detailed_stats(trader_uuid uuid)
RETURNS TABLE (
    win_rate numeric,
    pnl_ratio numeric,
    total_signals integer,
    total_profit numeric,
    total_loss numeric,
    current_signals integer,
    historical_signals integer,
    win_count integer,
    loss_count integer,
    avg_win_amount numeric,
    avg_loss_amount numeric
) AS $$
DECLARE
    total_historical integer;
    total_current integer;
    win_count_val integer;
    loss_count_val integer;
    profit_sum numeric;
    loss_sum numeric;
BEGIN
    -- 获取基础统计
    SELECT 
        COUNT(*) FILTER (WHERE signal_type = 'historical'),
        COUNT(*) FILTER (WHERE signal_type = 'current'),
        COUNT(*) FILTER (WHERE signal_type = 'historical' AND status = '止盈平仓'),
        COUNT(*) FILTER (WHERE signal_type = 'historical' AND status IN ('止损平仓', '手动平仓')),
        COALESCE(SUM(actual_pnl) FILTER (WHERE actual_pnl > 0), 0),
        COALESCE(ABS(SUM(actual_pnl)) FILTER (WHERE actual_pnl < 0), 0)
    INTO total_historical, total_current, win_count_val, loss_count_val, profit_sum, loss_sum
    FROM public.trader_signals 
    WHERE trader_id = trader_uuid;
    
    -- 计算胜率
    win_rate := CASE 
        WHEN total_historical > 0 THEN 
            ROUND((win_count_val::numeric / total_historical::numeric) * 100, 2)
        ELSE 0 
    END;
    
    -- 计算盈亏比
    pnl_ratio := CASE 
        WHEN loss_sum > 0 THEN 
            ROUND(profit_sum / loss_sum, 1)
        WHEN profit_sum > 0 THEN 99.9
        ELSE 0
    END;
    
    -- 设置返回值
    total_signals := total_historical + total_current;
    total_profit := profit_sum;
    total_loss := loss_sum;
    current_signals := total_current;
    historical_signals := total_historical;
    win_count := win_count_val;
    loss_count := loss_count_val;
    
    -- 计算平均盈利和亏损
    avg_win_amount := CASE 
        WHEN win_count_val > 0 THEN ROUND(profit_sum / win_count_val, 2)
        ELSE 0
    END;
    
    avg_loss_amount := CASE 
        WHEN loss_count_val > 0 THEN ROUND(loss_sum / loss_count_val, 2)
        ELSE 0
    END;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 授权函数使用权限
GRANT EXECUTE ON FUNCTION public.update_trader_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trader_detailed_stats(uuid) TO authenticated, anon;

-- 立即执行一次统计更新
SELECT public.update_trader_statistics();

-- 验证更新结果
SELECT 
    name,
    win_rate,
    profit_loss_ratio,
    total_signals,
    updated_at
FROM public.traders
ORDER BY win_rate DESC
LIMIT 10;