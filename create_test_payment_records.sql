-- =============================================
-- 创建测试用户付费记录脚本
-- 使用方法：
-- 1. 先在应用中注册测试用户
-- 2. 查询用户ID
-- 3. 替换下面的USER_ID并执行
-- =============================================

-- 第一步：查询现有用户ID
SELECT 
    id as user_id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 第二步：为特定用户创建测试付费记录
-- ⚠️ 重要：请将下面的 'YOUR_USER_ID_HERE' 替换为实际的用户UUID

DO $$
DECLARE
    target_user_id uuid := 'YOUR_USER_ID_HERE'::uuid;  -- 👈 请替换这里的用户ID
    manual_1m_plan_id uuid;
    manual_3m_plan_id uuid;
    manual_1y_plan_id uuid;
    auto_1m_plan_id uuid;
    auto_3m_plan_id uuid;
    auto_1y_plan_id uuid;
BEGIN
    -- 获取套餐ID
    SELECT id INTO manual_1m_plan_id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 1;
    SELECT id INTO manual_3m_plan_id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 3;
    SELECT id INTO manual_1y_plan_id FROM public.membership_plans WHERE plan_type = 'manual' AND duration_months = 12;
    SELECT id INTO auto_1m_plan_id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 1;
    SELECT id INTO auto_3m_plan_id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 3;
    SELECT id INTO auto_1y_plan_id FROM public.membership_plans WHERE plan_type = 'auto' AND duration_months = 12;

    -- 检查用户是否存在
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION '用户ID % 不存在，请先创建用户或使用正确的用户ID', target_user_id;
    END IF;

    -- 插入测试付费记录
    INSERT INTO public.payment_records (
        user_id, plan_id, payment_method, payment_address, sender_address,
        amount_usdt, transaction_hash, status, payment_type, 
        completed_at, expires_at, notes
    ) VALUES 

    -- 成功的年费订单（已激活）
    (target_user_id, manual_1y_plan_id, 'TRC20', 'TXYZ...abcd...efgh', 'TXabc123def456ghi789jkl012mno345pqr678',
     199.90, 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
     'completed', '手动跟单 · 1年',
     NOW() - INTERVAL '15 days', NOW() + INTERVAL '1 year' - INTERVAL '15 days',
     '支付成功，会员已激活。感谢您的信任！'),

    -- 待审核的自动跟单订单
    (target_user_id, auto_3m_plan_id, 'TRC20', 'TXYZ...abcd...efgh', 'TXdef456ghi789jkl012mno345pqr678stu901',
     269.90, 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a',
     'reviewing', '自动跟单 · 3个月',
     NULL, NULL, '等待管理员审核确认，预计24小时内完成'),

    -- 失败的订单
    (target_user_id, manual_1m_plan_id, 'ERC20', '0x12...cdef...3456', '0x9876543210abcdef9876543210abcdef98765432',
     29.90, NULL, 'failed', '手动跟单 · 1个月',
     NULL, NULL, '支付超时，订单已取消。请重新下单'),

    -- 待支付的订单
    (target_user_id, auto_1m_plan_id, 'TRC20', 'TXYZ...abcd...efgh', NULL,
     99.90, NULL, 'pending', '自动跟单 · 1个月',
     NULL, NULL, '订单已创建，等待支付确认'),

    -- 历史成功订单（已过期）
    (target_user_id, manual_3m_plan_id, 'TRC20', 'TXYZ...abcd...efgh', 'TXghi789jkl012mno345pqr678stu901vwx234',
     79.90, 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2',
     'completed', '手动跟单 · 3个月',
     NOW() - INTERVAL '150 days', NOW() - INTERVAL '60 days',
     '历史订单，服务已到期'),

    -- 大额VIP订单
    (target_user_id, auto_1y_plan_id, 'ERC20', '0x12...cdef...3456', '0x1234567890abcdef1234567890abcdef12345678',
     899.90, 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567abc3',
     'completed', '自动跟单 · 1年',
     NOW() - INTERVAL '60 days', NOW() + INTERVAL '1 year' - INTERVAL '60 days',
     'VIP用户，享受最高级别服务。专属客服已分配'),

    -- 待确认的支付
    (target_user_id, manual_1m_plan_id, 'ERC20', '0x12...cdef...3456', '0x5432109876abcdef5432109876abcdef54321098',
     29.90, 'e5f6789012345678901234567890abcdef1234567890abcdef1234567abcd4',
     'reviewing', '手动跟单 · 1个月',
     NULL, NULL, '支付凭证已提交，等待区块链确认'),

    -- 网络异常失败的订单
    (target_user_id, auto_3m_plan_id, 'ERC20', '0x12...cdef...3456', '0x6543210987abcdef6543210987abcdef65432109',
     269.90, NULL, 'failed', '自动跟单 · 3个月',
     NULL, NULL, '网络拥堵，交易失败。Gas费用已退回'),

    -- 最近的试用订单
    (target_user_id, manual_1m_plan_id, 'TRC20', 'TXYZ...abcd...efgh', 'TXjkl012mno345pqr678stu901vwx234yza567',
     29.90, 'f6789012345678901234567890abcdef1234567890abcdef1234567abcde5',
     'completed', '手动跟单 · 1个月',
     NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 month' - INTERVAL '5 days',
     '体验套餐，首次购买优惠价');

    RAISE NOTICE '✅ 成功为用户 % 创建了 9 条测试付费记录', target_user_id;
    RAISE NOTICE '包含状态：completed(4条), reviewing(2条), failed(2条), pending(1条)';

END $$;

-- 第三步：验证创建结果
SELECT 
    '=== 付费记录统计 ===' as info,
    status,
    COUNT(*) as count,
    SUM(amount_usdt) as total_amount
FROM public.payment_records 
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- 👈 请替换这里的用户ID
GROUP BY status
ORDER BY count DESC;

-- 第四步：查看详细记录
SELECT 
    payment_type,
    status,
    amount_usdt,
    payment_method,
    CASE 
        WHEN completed_at IS NOT NULL THEN '已完成'
        WHEN status = 'pending' THEN '待支付'
        WHEN status = 'reviewing' THEN '审核中'
        ELSE '已失败'
    END as status_cn,
    created_at,
    notes
FROM public.payment_records 
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- 👈 请替换这里的用户ID
ORDER BY created_at DESC;
