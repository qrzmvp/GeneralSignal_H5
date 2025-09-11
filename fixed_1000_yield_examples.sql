-- =============================================
-- 固定1000 USDT基准收益率计算示例
-- 演示新的收益率计算逻辑
-- =============================================

-- 1. 收益率计算公式演示
SELECT 
  '📊 新收益率计算公式' as title,
  '收益率 = (总净盈亏 ÷ 1000 USDT) × 100%' as formula,
  '所有交易员统一使用1000 USDT作为基准仓位' as description;

-- 2. 实际案例计算示例
WITH sample_calculations AS (
  SELECT 
    'WWG-Woods' as trader_name,
    ARRAY[150.50, -80.20, 220.80, -45.30, 180.90] as pnl_list,
    5 as signal_count
  UNION ALL
  SELECT 
    '量化大师',
    ARRAY[300.00, -150.00, 250.00, 180.00, -90.00, 420.00],
    6
  UNION ALL
  SELECT 
    '短线快枪手',
    ARRAY[50.20, -30.10, 80.50, 45.30, -25.80, 70.40, 90.20],
    7
)
SELECT 
  trader_name,
  signal_count,
  pnl_list,
  -- 计算总净盈亏
  (SELECT SUM(unnest) FROM unnest(pnl_list)) as total_net_pnl,
  -- 固定基准仓位
  1000 as fixed_capital,
  -- 计算收益率
  ROUND(((SELECT SUM(unnest) FROM unnest(pnl_list)) / 1000.0) * 100, 2) as yield_rate,
  -- 格式化显示
  CASE 
    WHEN ((SELECT SUM(unnest) FROM unnest(pnl_list)) / 1000.0) * 100 >= 0 
    THEN '+' || ROUND(((SELECT SUM(unnest) FROM unnest(pnl_list)) / 1000.0) * 100, 2)::text || '%'
    ELSE ROUND(((SELECT SUM(unnest) FROM unnest(pnl_list)) / 1000.0) * 100, 2)::text || '%'
  END as formatted_yield
FROM sample_calculations
ORDER BY yield_rate DESC;

-- 3. 对比旧计算方式 vs 新计算方式
WITH comparison_data AS (
  SELECT 
    'WWG-Woods' as trader_name,
    426.70 as total_net_pnl,
    5 as signal_count
  UNION ALL
  SELECT 
    '量化大师',
    910.00,
    6
  UNION ALL
  SELECT 
    '短线快枪手',
    280.70,
    7
)
SELECT 
  trader_name,
  total_net_pnl,
  signal_count,
  -- 旧方式：动态初始资金
  GREATEST(10000, signal_count * 1000) as old_initial_capital,
  ROUND((total_net_pnl / GREATEST(10000, signal_count * 1000)) * 100, 2) as old_yield_rate,
  -- 新方式：固定1000 USDT基准
  1000 as new_fixed_capital,
  ROUND((total_net_pnl / 1000.0) * 100, 2) as new_yield_rate,
  -- 差异
  ROUND((total_net_pnl / 1000.0) * 100, 2) - ROUND((total_net_pnl / GREATEST(10000, signal_count * 1000)) * 100, 2) as yield_diff
FROM comparison_data
ORDER BY new_yield_rate DESC;

-- 4. 收益率等级分类示例
WITH yield_categories AS (
  SELECT yield_rate, 
    CASE 
      WHEN yield_rate >= 50 THEN '🚀 超高收益 (≥50%)'
      WHEN yield_rate >= 20 THEN '📈 高收益 (20%-49%)'
      WHEN yield_rate >= 10 THEN '💰 中等收益 (10%-19%)'
      WHEN yield_rate >= 0 THEN '🟢 低收益 (0%-9%)'
      ELSE '🔴 亏损 (<0%)'
    END as category
  FROM (
    VALUES 
      (85.50), (42.67), (28.07), (15.23), (8.90), 
      (5.45), (2.10), (-3.20), (-8.75), (-15.40)
  ) AS t(yield_rate)
)
SELECT 
  category,
  COUNT(*) as trader_count,
  ROUND(AVG(yield_rate), 2) as avg_yield,
  STRING_AGG(yield_rate::text || '%', ', ' ORDER BY yield_rate DESC) as yield_examples
FROM yield_categories
GROUP BY category
ORDER BY AVG(yield_rate) DESC;

-- 5. 验证计算准确性
SELECT 
  '✅ 收益率计算验证' as check_title,
  '示例：总净盈亏 426.70 USDT' as example_pnl,
  '基准仓位：1000 USDT' as base_capital,
  '计算过程：(426.70 ÷ 1000) × 100' as calculation_process,
  '预期结果：42.67%' as expected_result,
  ROUND((426.70 / 1000.0) * 100, 2)::text || '%' as actual_result,
  CASE 
    WHEN ROUND((426.70 / 1000.0) * 100, 2) = 42.67 
    THEN '✅ 计算正确' 
    ELSE '❌ 计算错误' 
  END as validation_status;