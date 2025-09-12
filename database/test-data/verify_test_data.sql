-- =============================================
-- 生产环境测试数据验证脚本
-- 用于验证所有测试数据是否正确部署
-- =============================================

-- 验证总览
SELECT '🎯 部署验证总览' as title;

SELECT 
    '会员套餐' as data_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM public.membership_plans

UNION ALL

SELECT 
    '交易员数据' as data_type,
    COUNT(*) as total_count,
    COUNT(*) as active_count
FROM public.traders

UNION ALL

SELECT 
    '支付配置' as data_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM public.payment_config

UNION ALL

SELECT 
    '付费记录' as data_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'completed') as active_count
FROM public.payment_records;

-- ===================================

SELECT '📊 会员套餐详情' as title;

SELECT 
    plan_type,
    duration_months,
    title,
    price_usdt,
    original_price_usdt,
    ROUND((original_price_usdt - price_usdt) / original_price_usdt * 100, 1) as discount_percent,
    is_active,
    sort_order
FROM public.membership_plans 
ORDER BY sort_order;

-- ===================================

SELECT '👥 交易员排行榜（TOP 5）' as title;

SELECT 
    ROW_NUMBER() OVER (ORDER BY yield_rate DESC) as rank,
    name,
    yield_rate || '%' as yield_rate,
    win_rate || '%' as win_rate,
    profit_loss_ratio || ':1' as pnl_ratio,
    total_signals,
    array_to_string(tags, ', ') as tags
FROM public.traders 
ORDER BY yield_rate DESC
LIMIT 5;

-- ===================================

SELECT '💰 支付配置状态' as title;

SELECT 
    payment_method,
    wallet_address,
    network_name,
    CASE WHEN is_active THEN '✅ 活跃' ELSE '❌ 停用' END as status,
    created_at
FROM public.payment_config 
ORDER BY payment_method;

-- ===================================

SELECT '📈 付费记录统计' as title;

SELECT 
    status,
    CASE 
        WHEN status = 'completed' THEN '✅ 已完成'
        WHEN status = 'pending' THEN '⏳ 待支付'
        WHEN status = 'reviewing' THEN '🔍 审核中'
        WHEN status = 'failed' THEN '❌ 已失败'
        ELSE status
    END as status_display,
    COUNT(*) as order_count,
    COALESCE(SUM(amount_usdt), 0) as total_amount,
    ROUND(COALESCE(AVG(amount_usdt), 0), 2) as avg_amount
FROM public.payment_records 
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'completed' THEN 1
        WHEN 'reviewing' THEN 2
        WHEN 'pending' THEN 3
        WHEN 'failed' THEN 4
        ELSE 5
    END;

-- ===================================

SELECT '🔍 数据完整性检查' as title;

-- 检查各项数据是否符合预期
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.membership_plans WHERE is_active = true) = 6 THEN '✅'
        ELSE '❌'
    END || ' 会员套餐: ' || (SELECT COUNT(*) FROM public.membership_plans WHERE is_active = true) || '/6' as check_result

UNION ALL

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.traders) >= 14 THEN '✅'
        ELSE '❌'
    END || ' 交易员数据: ' || (SELECT COUNT(*) FROM public.traders) || '/14' as check_result

UNION ALL

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.payment_config WHERE is_active = true) = 2 THEN '✅'
        ELSE '❌'
    END || ' 支付方式: ' || (SELECT COUNT(*) FROM public.payment_config WHERE is_active = true) || '/2' as check_result

UNION ALL

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.traders WHERE yield_rate > 300) THEN '✅'
        ELSE '❌'
    END || ' 高收益交易员存在' as check_result

UNION ALL

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.membership_plans WHERE plan_type = 'manual' AND price_usdt < original_price_usdt) THEN '✅'
        ELSE '❌'
    END || ' 套餐折扣设置正确' as check_result;

-- ===================================

SELECT '📋 建议验证步骤' as title;

SELECT 
    '1. 访问首页，检查将军榜单是否显示14名交易员' as suggestion
UNION ALL
SELECT '2. 访问 /membership，检查是否显示6个套餐（3个手动+3个自动）'
UNION ALL  
SELECT '3. 注册测试用户，执行 create_test_payment_records.sql 创建付费记录'
UNION ALL
SELECT '4. 登录测试用户，访问 /payment-details 检查付费明细'
UNION ALL
SELECT '5. 测试购买流程，检查支付页面是否显示正确的钱包地址'
UNION ALL
SELECT '6. 点击交易员头像，进入详情页面验证数据完整性';

-- ===================================

SELECT '🎉 部署状态总结' as title;

DO $$
DECLARE
    plan_count int;
    trader_count int;
    config_count int;
    payment_count int;
    status_text text;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM public.membership_plans WHERE is_active = true;
    SELECT COUNT(*) INTO trader_count FROM public.traders;
    SELECT COUNT(*) INTO config_count FROM public.payment_config WHERE is_active = true;
    SELECT COUNT(*) INTO payment_count FROM public.payment_records;
    
    IF plan_count = 6 AND trader_count >= 14 AND config_count = 2 THEN
        status_text := '🎉 恭喜！所有测试数据部署成功！';
    ELSE
        status_text := '⚠️ 部署可能存在问题，请检查上述数据';
    END IF;
    
    RAISE NOTICE '%', status_text;
    RAISE NOTICE '📊 数据统计：套餐数=%，交易员数=%，支付方式数=%，付费记录数=%', 
                 plan_count, trader_count, config_count, payment_count;
END $$;
