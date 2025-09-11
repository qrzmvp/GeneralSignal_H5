-- =============================================
-- 收益率计算验证查询
-- 用于测试和验证收益率计算的准确性
-- =============================================

-- 1. 查看某个交易员的历史信号详情
WITH trader_signals_detail AS (
  SELECT 
    ts.trader_id,
    t.name as trader_name,
    ts.signal_type,
    ts.status,
    ts.actual_pnl,
    ts.created_at
  FROM public.trader_signals ts
  JOIN public.traders t ON ts.trader_id = t.id
  WHERE ts.signal_type = 'historical'
  AND ts.actual_pnl IS NOT NULL
  ORDER BY ts.trader_id, ts.created_at DESC
),
trader_summary AS (
  SELECT 
    trader_id,
    trader_name,
    COUNT(*) as total_historical_signals,
    COUNT(*) FILTER (WHERE status = '止盈平仓') as win_signals,
    COUNT(*) FILTER (WHERE status = '止损平仓') as loss_signals,
    SUM(actual_pnl) as total_net_pnl,
    SUM(actual_pnl) FILTER (WHERE actual_pnl > 0) as total_profit,
    ABS(SUM(actual_pnl) FILTER (WHERE actual_pnl < 0)) as total_loss,
    -- 计算收益率 (固定1000 USDT基准)
    ROUND((SUM(actual_pnl) / 1000.0) * 100, 2) as calculated_yield_rate
  FROM trader_signals_detail
  GROUP BY trader_id, trader_name
)
SELECT 
  ts.trader_name,
  ts.total_historical_signals,
  ts.win_signals,
  ts.loss_signals,
  ROUND((ts.win_signals::numeric / ts.total_historical_signals::numeric) * 100, 2) as calculated_win_rate,
  ROUND(ts.total_profit / NULLIF(ts.total_loss, 0), 1) as calculated_pnl_ratio,
  ts.total_net_pnl,
  ts.calculated_yield_rate,
  -- 对比数据库中的静态值
  t.yield_rate as static_yield_rate,
  t.win_rate as static_win_rate,
  t.profit_loss_ratio as static_pnl_ratio,
  -- 差异分析
  ABS(ts.calculated_yield_rate - COALESCE(t.yield_rate, 0)) as yield_rate_diff
FROM trader_summary ts
JOIN public.traders t ON ts.trader_id = t.id
ORDER BY ts.calculated_yield_rate DESC;

-- 2. 查看收益率分布统计
SELECT 
  '📈 收益率分布统计' as analysis_type,
  COUNT(*) as trader_count,
  ROUND(AVG(yield_rate), 2) as avg_static_yield,
  ROUND(MIN(yield_rate), 2) as min_static_yield,
  ROUND(MAX(yield_rate), 2) as max_static_yield,
  ROUND(STDDEV(yield_rate), 2) as static_yield_stddev
FROM public.traders
WHERE yield_rate IS NOT NULL

UNION ALL

SELECT 
  '🔢 计算收益率统计',
  COUNT(DISTINCT ts.trader_id),
  ROUND(AVG((SUM(ts.actual_pnl) / 1000.0) * 100), 2),
  ROUND(MIN((SUM(ts.actual_pnl) / 1000.0) * 100), 2),
  ROUND(MAX((SUM(ts.actual_pnl) / 1000.0) * 100), 2),
  ROUND(STDDEV((SUM(ts.actual_pnl) / 1000.0) * 100), 2)
FROM public.trader_signals ts
WHERE ts.signal_type = 'historical' 
AND ts.actual_pnl IS NOT NULL
GROUP BY ts.trader_id;

-- 3. 验证收益率计算逻辑的样本案例
SELECT 
  '🧮 收益率计算示例' as title,
  '假设交易员A有以下历史信号:' as description,
  '信号1: +200 USDT 盈利, 信号2: -100 USDT 亏损, 信号3: +150 USDT 盈利' as case_data,
  '总净盈亏: 200 + (-100) + 150 = 250 USDT' as net_pnl_calc,
  '固定基准仓位: 1000 USDT' as fixed_capital,
  '收益率: (250 / 1000) * 100 = 25.00%' as yield_calculation;

-- 4. 检查是否有异常数据
SELECT 
  t.name,
  COUNT(ts.id) as signal_count,
  SUM(ts.actual_pnl) as total_pnl,
  CASE 
    WHEN COUNT(ts.id) = 0 THEN 'ERROR: 无历史信号'
    WHEN SUM(ts.actual_pnl) IS NULL THEN 'WARNING: PnL数据缺失'
    WHEN ABS(SUM(ts.actual_pnl)) > 100000 THEN 'WARNING: PnL数据异常大'
    ELSE 'OK'
  END as data_status
FROM public.traders t
LEFT JOIN public.trader_signals ts ON t.id = ts.trader_id 
  AND ts.signal_type = 'historical'
GROUP BY t.id, t.name
ORDER BY signal_count DESC;